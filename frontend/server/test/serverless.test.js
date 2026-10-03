const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const handler = require("../handler");
const { createApp } = require("../app");

test("deployed API reports configuration failures safely and recovers using legacy collections", { timeout: 120000 }, async () => {
  const original = { mongo: process.env.MONGO_URL, secret: process.env.SECRET_KEY, demo: process.env.DEMO_MODE };
  const api = request(handler);
  let db;
  let connected = 0;
  const countConnection = () => connected++;
  mongoose.connection.on("connected", countConnection);
  try {
    delete process.env.MONGO_URL;
    delete process.env.SECRET_KEY;
    delete process.env.DEMO_MODE;
    const missing = await api.get("/api/health").expect(503).expect("Content-Type", /json/);
    assert.equal(missing.body.code, "CONFIGURATION_MISSING");
    assert.deepEqual(missing.body.missing, ["MONGO_URL", "SECRET_KEY"]);
    assert.equal(missing.headers["cache-control"], "no-store");
    process.env.DEMO_MODE = "true";
    const preview = await api.get("/api/health").expect(503);
    assert.equal(preview.body.code, "PREVIEW_DISABLED");
    delete process.env.DEMO_MODE;
    process.env.SECRET_KEY = "legacy-integration-secret-with-at-least-32-characters";
    process.env.MONGO_URL = "mongodb://127.0.0.1:1/unavailable";
    const unavailable = await api.get("/api/health").expect(503);
    assert.equal(unavailable.body.code, "DATABASE_UNAVAILABLE");
    assert.ok(!JSON.stringify(unavailable.body).includes(process.env.MONGO_URL));
    assert.ok(!JSON.stringify(unavailable.body).includes(process.env.SECRET_KEY));

    db = await MongoMemoryServer.create({ instance: { args: ["--nounixsocket"] } });
    process.env.MONGO_URL = db.getUri();
    const results = await Promise.all(Array.from({ length: 5 }, () => api.get("/api/health").expect(200)));
    assert.equal(connected, 1);
    for (const result of results) assert.equal(result.body.status, "ok");
    const rewrite = await api.get("/api/index?__realm_path=getProducts").expect(200);
    assert.deepEqual(rewrite.body, []);
    await api.get("/api/missing").expect(404).expect("Content-Type", /json/);
    await api.get("/api/getProductDetail/not-an-id").expect(400);

    const sellerId = new mongoose.Types.ObjectId();
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const password = await bcrypt.hash("original-password", 10);
    // Raw inserts preserve the exact field shape from the 2023 backend.
    await mongoose.connection.collection("sellers").insertOne({
      _id: sellerId, name: "Original Seller", email: "Legacy.Seller@Example.com",
      password, role: "Shopcart", shopName: "Original Realm Shop",
    });
    await mongoose.connection.collection("customers").insertOne({
      _id: buyerId, name: "Original Customer", email: "Legacy.Customer@Example.com",
      password, role: "Seller", cartDetails: [],
    });
    await mongoose.connection.collection("products").insertOne({
      _id: productId, productName: "Original Headphones", category: "Electronics",
      subcategory: "Audio", productImage: "/products/headphones.svg",
      price: { mrp: 3000, cost: 2500, discountPercent: 17 }, quantity: 1,
      seller: sellerId, reviews: [], createdAt: new Date("2023-11-27"), updatedAt: new Date("2023-11-27"),
    });
    const shippingData = { address: "One Road", city: "Kolkata", state: "West Bengal", country: "India", pinCode: 700001, phoneNo: 9876543210 };
    const historicOrder = {
      buyer: buyerId, shippingData,
      orderedProducts: [{ _id: productId, productName: "Original Headphones", seller: sellerId, quantity: 2, price: { cost: 2500, mrp: 3000 } }],
      paymentInfo: { id: "historic-order", status: "Successful" },
      paidAt: new Date("2023-11-27"), productsQuantity: 2, totalPrice: 5000, orderStatus: "Processing", createdAt: new Date("2023-11-27"),
    };
    await mongoose.connection.collection("orders").insertOne(historicOrder);

    const login = async (role, email) => (await api.post(`/api/${role}Login`).send({ email, password: "original-password" }).expect(200)).body;
    const seller = await login("Seller", "legacy.seller@example.com");
    const buyer = await login("Customer", "LEGACY.CUSTOMER@EXAMPLE.COM");
    assert.equal(seller.role, "Seller");
    assert.equal(buyer.role, "Customer");
    assert.equal(seller.password, undefined);
    const catalogue = await api.get("/api/getProducts").expect(200);
    assert.equal(catalogue.body[0].seller.shopName, "Original Realm Shop");
    const oldToken = jwt.sign({ userId: sellerId }, process.env.SECRET_KEY, { expiresIn: "10d" });
    const metrics = await api.get("/api/seller/metrics").set("Authorization", `Bearer ${oldToken}`).expect(200);
    assert.equal(metrics.body.orderValue, 5000);
    await api.post("/api/ProductCreate").set("Authorization", `Bearer ${buyer.token}`).send({}).expect(403);
    const history = await api.get(`/api/getOrderedProductsByCustomer/${buyerId}`).set("Authorization", `Bearer ${buyer.token}`).expect(200);
    assert.equal(history.body[0].productName, "Original Headphones");
    await api.post("/api/CustomerRegister").send({ name: "Duplicate", email: "legacy.customer@example.com", password: "password123" }).expect(200).then((result) => assert.equal(result.body.message, "Email already exists"));
    assert.equal(await mongoose.connection.collection("customers").countDocuments(), 1);
    // Original root API routes remain available for existing API clients.
    await request(createApp()).get("/getProducts").expect(200);
    const helper = await api.post("/api/index?__realm_path=ai/recommend").send({ query: "headphones under 3000" }).expect(200);
    assert.equal(helper.body.products[0]._id, String(productId));
  } finally {
    mongoose.connection.removeListener("connected", countConnection);
    await mongoose.disconnect();
    if (db) await db.stop();
    for (const [key, value] of [["MONGO_URL", original.mongo], ["SECRET_KEY", original.secret], ["DEMO_MODE", original.demo]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
