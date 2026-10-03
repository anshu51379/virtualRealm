const { loadEnvironment, getMongoUrl } = require("../config");
loadEnvironment();
const mongoose = require("mongoose");
const Seller = require("../models/sellerSchema");
const Product = require("../models/productSchema");
const { demoProducts } = require("../services/catalog");
async function seed() {
  if (!getMongoUrl() || !process.env.SEED_SELLER_ID)
    throw new Error(
      "Set MONGO_URL (or MONGODB_URI) and SEED_SELLER_ID for an existing seller. No demo account/password is created.",
    );
  await mongoose.connect(getMongoUrl());
  const seller = await Seller.findById(process.env.SEED_SELLER_ID);
  if (!seller) throw new Error("Seller not found. Register a seller first.");
  for (const product of demoProducts) {
    const { _id, seller: ignored, ...data } = product;
    await Product.updateOne(
      { productName: data.productName, seller: seller._id },
      { $setOnInsert: { ...data, seller: seller._id } },
      { upsert: true },
    );
  }
  console.log("Sample catalogue added (existing products preserved).");
}
seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
