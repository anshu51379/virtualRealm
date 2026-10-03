import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { nodeFileTrace } from "@vercel/nft";
import { getTransformedRoutes } from "@vercel/routing-utils";

// Reproduce a host that receives only frontend/, with no workspace root,
// workspace files, previous node_modules, or local environment files. The API
// lives inside frontend/server and must load with only this install.
const frontend = fileURLToPath(new URL("../frontend/", import.meta.url));
const staging = mkdtempSync(join(tmpdir(), "virtual-realm-frontend-"));
try {
  cpSync(frontend, staging, {
    recursive: true,
    filter: (source) => !["node_modules", "dist"].includes(basename(source))
      && !basename(source).startsWith(".env"),
  });
  const env = {
    ...process.env, NODE_ENV: "production", VIRTUAL_REALM_INTEGRATED_API: "true",
    // A stale public URL must not send the integrated storefront to the old API.
    VITE_API_URL: "https://obsolete-api.example.invalid",
    SECRET_KEY: "build-only-authentication-secret-must-stay-server-side",
    MONGO_URL: "mongodb://build-only.example.invalid/private-database",
    AI_API_KEY: "build-only-ai-key-must-stay-server-side",
  };
  execFileSync("npm", ["ci", "--include=dev", "--workspaces=false"], {
    cwd: staging, env, stdio: "inherit",
  });
  execFileSync("npm", ["run", "build", "--workspaces=false"], {
    cwd: staging, env, stdio: "inherit",
  });
  const config = JSON.parse(readFileSync(join(staging, "vercel.json"), "utf8"));
  const { routes, error } = getTransformedRoutes(config);
  if (error) throw new Error(JSON.stringify(error));
  for (const pathname of ["/api/health", "/api/getProducts", "/api/getProductDetail/65a000000000000000000001", "/api/missing"]) {
    const route = routes.find((candidate) => candidate.src && new RegExp(candidate.src).test(pathname));
    assert.match(route?.dest || "", /^\/api\/index\?__realm_path=/);
  }
  assert.ok(!routes.some((candidate) => candidate.dest === "/index.html" && new RegExp(candidate.src).test("/assets/missing.js")));
  if (!existsSync(join(staging, config.outputDirectory, "index.html"))) {
    throw new Error("The standalone build did not produce the configured Vercel output.");
  }
  for (const file of readdirSync(join(staging, config.outputDirectory, "assets"))) {
    if (!file.endsWith(".js")) continue;
    const source = readFileSync(join(staging, config.outputDirectory, "assets", file), "utf8");
    for (const key of ["VITE_API_URL", "SECRET_KEY", "MONGO_URL", "AI_API_KEY"]) {
      assert.ok(!source.includes(env[key]), `${key} must not reach the integrated client bundle.`);
    }
  }
  const { fileList, warnings } = await nodeFileTrace([join(staging, "api/index.js")], { base: staging });
  assert.ok(fileList.has("server/controllers/orderController.js"));
  assert.ok([...fileList].some((file) => file.includes("bcrypt/") && file.endsWith(".node")));
  // Optional MongoDB driver integrations are intentionally not installed;
  // ordinary password-authenticated MongoDB/Atlas connections don't need them.
  const optionalMongo = ["gcp-metadata", "kerberos", "snappy", "socks", "mongodb-client-encryption", "@mongodb-js/zstd", "@aws-sdk/credential-providers"];
  for (const warning of warnings) {
    const optionalColor = warning.message.startsWith('Failed to resolve dependency "supports-color"') && warning.message.includes("debug/src/node.js");
    if (!optionalColor && !optionalMongo.some((name) => warning.message.startsWith(`Failed to resolve dependency \"${name}\"`))) throw warning;
  }
  for (const file of fileList) {
    assert.ok(!file.startsWith("../") && !basename(file).startsWith(".env"), "Functions must not bundle environment files or files outside the deployment root.");
  }
  console.log(`Vercel routes validated and ${fileList.size} API runtime files traced, including native bcrypt.`);
  execFileSync(process.execPath, ["-e", `
    const assert = require('node:assert/strict');
    const http = require('node:http');
    delete process.env.MONGO_URL;
    delete process.env.SECRET_KEY;
    const handler = require('./api/index');
    const server = http.createServer(handler).listen(0, '127.0.0.1', async () => {
      try {
        const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/index?__realm_path=health');
        assert.equal(response.status, 503);
        assert.match(response.headers.get('content-type'), /json/);
        const body = await response.json();
        assert.equal(body.code, 'CONFIGURATION_MISSING');
        assert.deepEqual(body.missing, ['MONGO_URL', 'SECRET_KEY']);
        console.log('Standalone API and native bcrypt dependencies loaded; missing configuration returns JSON.');
      } catch (error) {
        console.error(error);
        process.exitCode = 1;
      } finally { server.close(); }
    });
  `], { cwd: staging, env: { ...env, VERCEL: "1" }, stdio: "inherit" });
  console.log("Standalone frontend and backend deployment checks passed.");
} finally {
  rmSync(staging, { recursive: true, force: true });
}
