const express = require("express");
const { loadEnvironment } = require("./config");
loadEnvironment();
const { connectDatabase } = require("./database");
const { createApp } = require("./app");

const app = express();
app.disable("x-powered-by");
app.use(async (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    const url = new URL(req.url, "http://localhost");
    // The rewrite passes the original API path explicitly. Some Vercel runtimes
    // retain the original URL while others expose the function destination.
    const route = url.searchParams.get("__realm_path");
    if (route !== null) {
      url.searchParams.delete("__realm_path");
      const query = url.searchParams.toString();
      const pathname = route.split("/").map(encodeURIComponent).join("/");
      req.url = `/api/${pathname}${query ? `?${query}` : ""}`;
    }
    await connectDatabase();
    next();
  } catch (error) {
    // Connection errors can contain credentials. Return and log only a safe code.
    const configuration = error.code === "CONFIGURATION_MISSING";
    const code = configuration ? "CONFIGURATION_MISSING" : error.code === "PREVIEW_DISABLED" ? "PREVIEW_DISABLED" : "DATABASE_UNAVAILABLE";
    console.error(`Virtual Realm API unavailable: ${code}`);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      status: "unavailable",
      demo: false,
      code,
      ...(configuration ? { missing: error.missing } : {}),
      message: configuration
        ? "The store backend needs its MongoDB and authentication configuration."
        : code === "PREVIEW_DISABLED"
        ? "Turn off preview mode in the server environment to enable the store backend."
        : "The store database is temporarily unavailable. Please try again shortly.",
    }));
  }
});
app.use("/api", createApp({ trustProxy: process.env.VERCEL ? 1 : false }));
app.use((req, res) => res.status(404).json({ message: "Endpoint not found." }));
module.exports = app;
