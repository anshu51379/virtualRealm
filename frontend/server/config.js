const path = require("node:path");

// Resolve files explicitly; npm workspaces and direct Node starts use different cwd values.
function loadEnvironment() {
  if (process.env.VERCEL) return;
  require("dotenv").config({
    path: [
      path.join(__dirname, "../../backend/.env"),
      path.join(__dirname, ".env"),
      path.join(__dirname, "../../.env"),
    ],
    quiet: true,
  });
}

// Vercel's MongoDB integration supplies MONGODB_URI. An explicit legacy
// MONGO_URL takes priority so attaching an integration cannot switch databases.
function getMongoUrl() {
  return process.env.MONGO_URL || process.env.MONGODB_URI || "";
}

function validateConfiguration() {
  const missing = [];
  if (!/^mongodb(?:\+srv)?:\/\//.test(getMongoUrl())) missing.push("MONGO_URL");
  if (!process.env.SECRET_KEY || process.env.SECRET_KEY.length < 32) missing.push("SECRET_KEY");
  if (process.env.DEMO_MODE === "true") {
    const error = new Error("Read-only preview mode cannot run in the deployed API.");
    error.code = "PREVIEW_DISABLED";
    throw error;
  }
  if (missing.length) {
    const error = new Error("Set MONGO_URL (or MONGODB_URI) and a SECRET_KEY of at least 32 characters in the server environment.");
    error.code = "CONFIGURATION_MISSING";
    error.missing = missing;
    throw error;
  }
}

module.exports = { loadEnvironment, getMongoUrl, validateConfiguration };
