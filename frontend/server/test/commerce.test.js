const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildOrder } = require("../services/commerce");
const { shortlist, recommend } = require("../services/ai");
const { demoProducts } = require("../services/catalog");
const request = require("supertest");
const { createApp } = require("../app");
const address = {
  address: "One Road",
  city: "Kolkata",
  state: "West Bengal",
  country: "India",
  pinCode: 700001,
  phoneNo: 9876543210,
};
test("checkout calculates catalogue prices and refuses browser payment claims", () => {
  const p = demoProducts[0];
  const order = buildOrder(
    [{ _id: p._id, quantity: 2, price: { cost: 1 } }],
    [p],
    "buyer",
    address,
  );
  assert.equal(order.totalPrice, 4998);
  assert.equal(order.paymentInfo.status, "Pending");
  assert.equal(order.paidAt, undefined);
});
test("checkout refuses invalid, duplicate and deleted lines", () => {
  const p = demoProducts[0];
  for (const lines of [
    [{ _id: p._id, quantity: -1 }],
    [{ _id: p._id, quantity: 1.5 }],
    [
      { _id: p._id, quantity: 1 },
      { _id: p._id, quantity: 1 },
    ],
    [],
    [{ _id: demoProducts[1]._id, quantity: 1 }],
  ])
    assert.throws(() => buildOrder(lines, [p], "buyer", address));
});
test("catalogue search respects a rupee budget and returns actual products", async () => {
  assert.equal(shortlist("headphones under 2000", demoProducts).length, 0);
  assert.equal(
    shortlist("headphones under ₹3,000", demoProducts)[0]._id,
    demoProducts[0]._id,
  );
  const result = await recommend("headphones under 3000", demoProducts);
  assert.equal(result.mode, "catalog-search");
});
test("preview loads catalogue, validates helper input and refuses writes", async () => {
  const app = createApp({ demo: true });
  assert.equal((await request(app).get("/health")).body.demo, true);
  assert.equal((await request(app).get("/getProducts")).body.length, 8);
  await request(app)
    .post("/ai/recommend")
    .send({ query: { $ne: "" } })
    .expect(400);
  await request(app).post("/CustomerRegister").send({}).expect(503);
});
test("private commerce endpoints reject anonymous access", async () => {
  const app = createApp();
  for (const endpoint of [
    "/getCartDetail/65a000000000000000000001",
    "/getSellerProducts/65a000000000000000000001",
    "/getOrderedProductsByCustomer/65a000000000000000000001",
  ])
    await request(app).get(endpoint).expect(401);
  await request(app).post("/newOrder").send({}).expect(401);
  await request(app).post("/ProductCreate").send({}).expect(401);
});
test("AI adapter keeps catalogue IDs fixed and falls back on provider failures", async () => {
  const originalFetch = global.fetch;
  const original = { key: process.env.AI_API_KEY, model: process.env.AI_MODEL };
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "test-model";
  try {
    let sent;
    global.fetch = async (url, options) => {
      sent = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: "These headphones match your request." } },
          ],
        }),
      };
    };
    const result = await recommend("headphones under 3000", demoProducts);
    assert.equal(result.mode, "ai");
    assert.equal(result.products[0]._id, demoProducts[0]._id);
    assert.ok(!JSON.stringify(sent).includes("shippingData"));
    global.fetch = async () => {
      throw new Error("timeout");
    };
    assert.equal(
      (await recommend("headphones under 3000", demoProducts)).mode,
      "catalog-search",
    );
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of [
      ["AI_API_KEY", original.key],
      ["AI_MODEL", original.model],
    ])
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
});
