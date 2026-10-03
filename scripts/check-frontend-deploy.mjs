import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// Reproduce a host that receives only frontend/, with no workspace root,
// backend packages, previous node_modules, or local environment files.
const frontend = fileURLToPath(new URL("../frontend/", import.meta.url));
const staging = mkdtempSync(join(tmpdir(), "virtual-realm-frontend-"));
try {
  cpSync(frontend, staging, {
    recursive: true,
    filter: (source) => !["node_modules", "dist"].includes(basename(source))
      && !basename(source).startsWith(".env"),
  });
  const env = { ...process.env, NODE_ENV: "production" };
  execFileSync("npm", ["ci", "--include=dev", "--workspaces=false"], {
    cwd: staging, env, stdio: "inherit",
  });
  execFileSync("npm", ["run", "build", "--workspaces=false"], {
    cwd: staging, env, stdio: "inherit",
  });
  const config = JSON.parse(readFileSync(join(staging, "vercel.json"), "utf8"));
  if (!existsSync(join(staging, config.outputDirectory, "index.html"))) {
    throw new Error("The standalone build did not produce the configured Vercel output.");
  }
  console.log("Standalone frontend install and production build passed.");
} finally {
  rmSync(staging, { recursive: true, force: true });
}
