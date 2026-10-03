const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const request = require("supertest");
const { createServer } = require("../server");

test("combined server provides SPA routes without masking API or asset failures", async () => {
  const frontendDir = fs.mkdtempSync(path.join(os.tmpdir(), "realm-hosting-"));
  try {
    fs.writeFileSync(path.join(frontendDir, "index.html"), "<!doctype html><title>Virtual Realm</title>");
    const api = request(createServer({ demo: true, frontendDir }));
    await api.get("/").expect(200).expect("Content-Type", /html/);
    await api.get("/product/view/example").expect(200).expect("Content-Type", /html/);
    const health = await api.get("/api/health").expect(200);
    assert.equal(health.body.demo, true);
    const catalogue = await api.get("/api/getProducts").expect(200);
    assert.ok(Array.isArray(catalogue.body));
    await api.get("/api/missing").expect(503).expect("Content-Type", /json/);
    await api.get("/assets/missing.js").expect(404).expect("Content-Type", /json/);
    await api.get("/health").expect(200).expect("Content-Type", /json/);
    await api.get("/getProducts").expect(200).expect("Content-Type", /json/);
    const fullApi = request(createServer({ frontendDir }));
    await fullApi.get("/api/missing").expect(404).expect("Content-Type", /json/);
  } finally {
    fs.rmSync(frontendDir, { recursive: true, force: true });
  }
});
