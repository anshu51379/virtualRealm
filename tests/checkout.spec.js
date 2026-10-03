const { test, expect } = require("@playwright/test");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");
const { createServer } = require("../frontend/server/server");
const Order = require("../frontend/server/models/orderSchema");
test("production storefront and real API support customer checkout and seller management", async ({
  page,
}) => {
  test.setTimeout(60000);
  process.env.SECRET_KEY = "isolated-browser-test-secret-at-least-32-chars";
  const db = await MongoMemoryServer.create({
    instance: { args: ["--nounixsocket"] },
  });
  let server;
  try {
    await mongoose.connect(db.getUri());
    const app = createServer();
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const open = (path) => page.goto(`${origin}${path}`);
    const api = request(app);
    const seller = (
      await api
        .post("/SellerRegister")
        .send({
          name: "Realm Seller",
          email: "seller@example.com",
          password: "password123",
          shopName: "Realm Studio",
        })
    ).body;
    const product = (
      await api
        .post("/ProductCreate")
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          productName: "Studio Test Headphones",
          category: "Electronics",
          subcategory: "Audio",
          price: { mrp: 3000, cost: 2500 },
          productImage: "/products/headphones.svg",
          description: "Wireless headphones for everyday listening.",
        })
    ).body;
    // Use the actual built React app and same-origin HTTP API. No request
    // interception: broken deployment routing must fail this journey.
    await open("/Customerregister");
    await page.getByLabel(/Your name/).fill("Realm Shopper");
    await page.getByLabel("Email address").fill("shopper@example.com");
    await page.getByLabel(/Password/).fill("password123");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Open account menu" }),
    ).toBeVisible();
    await open(`/product/view/${product._id}`);
    await page.getByRole("button", { name: "Add to your bag" }).click();
    await page
      .getByRole("button", { name: "Open shopping bag, 1 items" })
      .click();
    await page.getByRole("button", { name: "Buy All", exact: true }).click();
    await page.getByLabel(/^Address/).fill("One Road");
    await page.getByLabel(/^City/).fill("Kolkata");
    await page.getByLabel("Zip / Postal code").fill("700001");
    await page.getByLabel(/^Country/).fill("India");
    await page.getByLabel("State/Province/Region").fill("West Bengal");
    await page.getByLabel("Phone number").fill("9876543210");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Order summary")).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("button", { name: "Place order", exact: true })
      .click();
    await expect(page.getByText("Thank you for your order.")).toBeVisible();
    const orders = await Order.find();
    expect(orders).toHaveLength(1);
    expect(orders[0].totalPrice).toBe(2500);
    expect(orders[0].paymentInfo.status).toBe("Pending");
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("menuitem", { name: "My orders" }).click();
    await expect(page.getByText("Studio Test Headphones")).toBeVisible();
    await open("/Logout");
    await page.getByRole("button", { name: "Log Out", exact: true }).click();
    await open("/Sellerlogin");
    await page.getByLabel("Email address").fill("seller@example.com");
    await page.getByLabel(/Password/).fill("password123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "A clearer view of your shop." }),
    ).toBeVisible();
    await expect(page.locator(".seller-metrics").getByText("₹2,500", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Add a product" }).click();
    for (const [label, value] of Object.entries({
      "Product Image URL": "/products/bag.svg",
      "Product Name": "Seller-created Everyday Bag",
      "Description": "A bag created from the seller dashboard.",
      "MRP": "2000", "Cost": "1500", "Discount Percent": "25",
      "Category": "Accessories", "Subcategory": "Bags", "Tagline": "Everyday carry",
    })) {
      await page.getByRole("textbox", { name: label, exact: true }).fill(value);
    }
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Done Successfully")).toBeVisible();
    await open("/Seller/products");
    await expect(page.getByText("Seller-created Everyday Bag")).toBeVisible();
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    await db.stop();
  }
});
