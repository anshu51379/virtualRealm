const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
const routes = require("./routes/route");
const { demoProducts } = require("./services/catalog");
const { recommend } = require("./services/ai");
const createApp = ({ demo = false, trustProxy = false } = {}) => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", trustProxy);
  // Authenticated API responses must never be cached by an intermediary.
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000").split(",").map((origin) => origin.trim()),
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.get("/health", (req, res) =>
    res
      .status(demo || mongoose.connection.readyState === 1 ? 200 : 503)
      .json({
        status: demo
          ? "demo"
          : mongoose.connection.readyState === 1
            ? "ok"
            : "unavailable",
        demo,
        ai: process.env.AI_API_KEY ? "provider-configured" : "catalog-search",
      }),
  );
  app.use(
    ["/CustomerLogin", "/SellerLogin", "/CustomerRegister", "/SellerRegister"],
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 30,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.post(
    "/ai/recommend",
    rateLimit({
      windowMs: 60_000,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    async (req, res) => {
      if (
        typeof req.body?.query !== "string" ||
        !req.body.query.trim() ||
        req.body.query.length > 500
      )
        return res
          .status(400)
          .json({
            message: "Describe what you are looking for in 1–500 characters.",
          });
      const products = demo
        ? demoProducts
        : await require("./models/productSchema")
            .find()
            .select(
              "productName category subcategory description price productImage",
            )
            .limit(100)
            .lean();
      res.json(await recommend(req.body.query, products));
    },
  );
  if (demo) {
    app.get("/getProducts", (req, res) => res.json(demoProducts));
    app.get("/getProductDetail/:id", (req, res) => {
      const product = demoProducts.find((p) => p._id === req.params.id);
      res
        .status(product ? 200 : 404)
        .json(product || { message: "Product not found." });
    });
    for (const [path, field] of [
      ["searchProduct", "productName"],
      ["searchProductbyCategory", "category"],
      ["searchProductbySubCategory", "subcategory"],
    ]) {
      app.get(`/${path}/:key`, (req, res) =>
        res.json(
          demoProducts.filter((p) =>
            p[field].toLowerCase().includes(req.params.key.toLowerCase()),
          ),
        ),
      );
    }
    app.use((req, res) =>
      res
        .status(503)
        .json({
          message:
            "Preview mode is read-only. Connect MongoDB to sign in, sell, and place orders.",
        }),
    );
  } else {
    app.param("id", (req, res, next, id) =>
      mongoose.isValidObjectId(id)
        ? next()
        : res.status(400).json({ message: "Invalid identifier." }),
    );
    app.use("/", routes);
    app.use((req, res) =>
      res.status(404).json({ message: "Endpoint not found." }),
    );
  }
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status =
      err.status ||
      (err.name === "ValidationError" || err.name === "CastError"
        ? 400
        : err.code === 11000
          ? 409
          : 500);
    res
      .status(status)
      .json({
        message:
          status < 500
            ? "Please check the submitted details."
            : "Request could not be completed.",
      });
  });
  return app;
};
module.exports = { createApp };
