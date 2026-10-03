require("dotenv").config();
const mongoose = require("mongoose");
const { createApp } = require("./app");
async function start() {
  const demo = process.env.DEMO_MODE === "true";
  if (demo && process.env.NODE_ENV === "production")
    throw new Error("Preview mode cannot run in production.");
  if (!demo) {
    if (
      !process.env.MONGO_URL ||
      !process.env.SECRET_KEY ||
      process.env.SECRET_KEY.length < 32
    )
      throw new Error(
        "Set MONGO_URL and a SECRET_KEY of at least 32 characters. See backend/.env.example.",
      );
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log("Connected to MongoDB");
  }
  const server = createApp({ demo }).listen(process.env.PORT || 5000, () =>
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
  console.error(err.message);
  process.exit(1);
});
