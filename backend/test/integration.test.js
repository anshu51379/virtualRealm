const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { createApp } = require("../app");
const Customer = require("../models/customerSchema");
const Order = require("../models/orderSchema");
test(
  "database commerce lifecycle and cross-account protections",
  { timeout: 120000 },
  async () => {
    process.env.SECRET_KEY = "integration-test-secret-at-least-32-characters";
    const db = await MongoMemoryServer.create({
      instance: { args: ["--nounixsocket"] },
    });
    try {
      await mongoose.connect(db.getUri());
      const api = request(createApp());
      const register = async (role, email) => {
        const result = await api
          .post(`/${role}Register`)
          .send({
            name: "Test User",
            email,
            password: "password123",
            shopName: email,
            role: "Shopcart",
          })
          .expect(200);
        assert.equal(result.body.role, role);
        assert.ok(result.body.token);
        assert.equal(result.body.password, undefined);
        return result.body;
      };
      const seller = await register("Seller", "seller@example.com");
      const other = await register("Seller", "other@example.com");
      const buyer = await register("Customer", "buyer@example.com");
      const stranger = await register("Customer", "stranger@example.com");
      const bearer = (u) => `Bearer ${u.token}`;
      const login = await api
        .post("/CustomerLogin")
        .send({ email: "BUYER@EXAMPLE.COM", password: "password123" })
        .expect(200);
      assert.ok(login.body.token);
      const product = (
        await api
          .post("/ProductCreate")
          .set("Authorization", bearer(seller))
          .send({
            productName: "Test headphones",
            price: { cost: 2500, mrp: 3000 },
            category: "Electronics",
            subcategory: "Audio",
            description: "Wireless",
            productImage: "/products/headphones.svg",
            seller: other._id,
          })
          .expect(200)
      ).body;
      assert.equal(product.seller, seller._id);
      await api
        .put(`/ProductUpdate/${product._id}`)
        .set("Authorization", bearer(other))
        .send({ price: { cost: 1, mrp: 1 } })
        .expect(403);
      await api
        .get(`/getCartDetail/${buyer._id}`)
        .set("Authorization", bearer(stranger))
        .expect(403);
      await api
        .put(`/CustomerUpdate/${buyer._id}`)
        .set("Authorization", bearer(buyer))
        .send({
          role: "Shopcart",
          password: "changed",
          cartDetails: [{ ...product, quantity: 2 }],
        })
        .expect(200);
      assert.equal((await Customer.findById(buyer._id)).role, "Customer");
      const payload = {
        buyer: stranger._id,
        shippingData: {
          address: "One Road",
          city: "Kolkata",
          state: "West Bengal",
          country: "India",
          pinCode: 700001,
          phoneNo: 9876543210,
        },
        orderedProducts: [
          { _id: product._id, quantity: 2, price: { cost: 1 } },
        ],
        totalPrice: 2,
        paymentInfo: { status: "Successful" },
      };
      const order = (
        await api
          .post("/newOrder")
          .set("Authorization", bearer(buyer))
          .send(payload)
          .expect(200)
      ).body;
      assert.equal(order.totalPrice, 5000);
      assert.equal(order.buyer, buyer._id);
      assert.equal(order.paymentInfo.status, "Pending");
      assert.equal((await Order.find()).length, 1);
      await api
        .put(`/addReview/${product._id}`)
        .set("Authorization", bearer(stranger))
        .send({ rating: 5, comment: "unverified" })
        .expect(403);
      const reviewed = (
        await api
          .put(`/addReview/${product._id}`)
          .set("Authorization", bearer(buyer))
          .send({ rating: 5, comment: "Good product", reviewer: stranger._id })
          .expect(200)
      ).body;
      assert.equal(reviewed.reviews[0].reviewer, buyer._id);
      await api
        .put(`/deleteProductReview/${product._id}`)
        .set("Authorization", bearer(stranger))
        .send({ reviewId: reviewed.reviews[0]._id })
        .expect(403);
      await api
        .put(`/deleteProductReview/${product._id}`)
        .set("Authorization", bearer(buyer))
        .send({ reviewId: reviewed.reviews[0]._id })
        .expect(200);
      const history = (
        await api
          .get(`/getOrderedProductsByCustomer/${buyer._id}`)
          .set("Authorization", bearer(buyer))
          .expect(200)
      ).body;
      assert.equal(history.length, 1);
      const metrics = (
        await api
          .get("/seller/metrics")
          .set("Authorization", bearer(seller))
          .expect(200)
      ).body;
      assert.equal(metrics.orderValue, 5000);
      assert.equal(metrics.units, 2);
      const otherOrders = (
        await api
          .get(`/getOrderedProductsBySeller/${other._id}`)
          .set("Authorization", bearer(other))
          .expect(200)
      ).body;
      assert.ok(otherOrders.message);
      await api
        .post("/newOrder")
        .set("Authorization", bearer(buyer))
        .send({
          ...payload,
          orderedProducts: [{ _id: product._id, quantity: -1 }],
        })
        .expect(400);
      await api
        .delete(`/DeleteProduct/${product._id}`)
        .set("Authorization", bearer(other))
        .expect(403);
      await api
        .delete(`/DeleteProducts/${seller._id}`)
        .set("Authorization", bearer(seller))
        .expect(200);
      assert.equal((await Customer.findById(buyer._id)).cartDetails.length, 0);
    } finally {
      await mongoose.disconnect();
      await db.stop();
    }
  },
);
