require("./config").loadEnvironment();
const mongoose = require("mongoose");
const { createServer } = require("./server");
const { connectDatabase } = require("./database");
async function start() {
  const demo = process.env.DEMO_MODE === "true";
  if (demo && process.env.NODE_ENV === "production") {
    const error = new Error("Preview mode cannot run in production.");
    error.code = "PREVIEW_DISABLED";
    throw error;
  }
  if (!demo) {
    await connectDatabase();
    console.log("Connected to MongoDB");
  }
  const server = createServer({ demo }).listen(process.env.PORT || 5000, () =>
    console.log(
      `Virtual Realm API running (${demo ? "read-only preview" : "database connected"})`,
    ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      }),
    );
}
start().catch((err) => {
  console.error(err.code === "CONFIGURATION_MISSING" || err.code === "PREVIEW_DISABLED"
    ? err.message
    : "Virtual Realm could not connect to MongoDB. Check the server connection string and database network access.");
  process.exit(1);
});
