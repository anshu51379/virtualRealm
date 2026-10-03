const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const helmet = require("helmet");
const { createApp } = require("./app");

function createServer({ demo = false, frontendDir = path.resolve(__dirname, "../dist") } = {}) {
  const api = createApp({ demo });
  const server = express();
  server.disable("x-powered-by");
  server.use(helmet({ contentSecurityPolicy: { directives: {
    "img-src": ["'self'", "data:", "https:"],
    "connect-src": ["'self'", "https:"],
  } } }));
  server.use("/api", api);
  // Keep the original API URLs for separately hosted clients and Vite's proxy.
  server.use((req, res, next) => {
    const legacyRead = /^\/(?:health(?:\/|$)|get[A-Z]|searchProduct|seller\/metrics(?:\/|$))/i.test(req.path);
    if (legacyRead || !["GET", "HEAD"].includes(req.method)) return api(req, res, next);
    next();
  });
  if (!fs.existsSync(path.join(frontendDir, "index.html"))) {
    server.use((req, res) => res.status(404).json({ message: "Not found." }));
    return server;
  }
  server.use(express.static(frontendDir));
  server.get("/{*route}", (req, res, next) => {
    // Missing assets must not receive index.html with a successful status.
    if (path.extname(req.path) || !req.accepts("html")) return next();
    res.sendFile(path.join(frontendDir, "index.html"));
  });
  server.use((req, res) => res.status(404).json({ message: "Not found." }));
  return server;
}

module.exports = { createServer };
