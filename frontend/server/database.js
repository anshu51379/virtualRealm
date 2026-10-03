const mongoose = require("mongoose");
const { validateConfiguration } = require("./config");
let pending;

async function connectDatabase() {
  validateConfiguration();
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!pending) {
    pending = mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
    }).finally(() => { pending = undefined; });
  }
  // Concurrent cold-start requests share the same promise. Failed connections
  // can retry on the next request instead of poisoning the warm function.
  return pending;
}

module.exports = { connectDatabase };
