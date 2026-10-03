const Order = require("../models/orderSchema.js");

const newOrder = async (req, res, next) => {
  try {
    const { buildOrder } = require("../services/commerce");
    const Product = require("../models/productSchema");
    const lines = Array.isArray(req.body.orderedProducts)
      ? req.body.orderedProducts
      : [req.body.orderedProducts];
    if (
      !lines.length ||
      lines.length > 100 ||
      lines.some((line) => !require("mongoose").isValidObjectId(line?._id))
    )
      return res.status(400).json({ message: "Invalid cart." });
    const products = await Product.find({
      _id: { $in: lines.map((p) => p._id) },
    });
    const data = buildOrder(
      lines,
      products,
      req.user.userId,
      req.body.shippingData,
    );
    const order = await Order.create(data);

    return res.send(order);
  } catch (err) {
    next(err);
  }
};

const getOrderedProductsByCustomer = async (req, res, next) => {
  try {
    let orders = await Order.find({ buyer: req.params.id });

    if (orders.length > 0) {
      const orderedProducts = orders.reduce((accumulator, order) => {
        accumulator.push(...order.orderedProducts);
        return accumulator;
      }, []);
      res.send(orderedProducts);
    } else {
      res.send({ message: "No products found" });
    }
  } catch (err) {
    next(err);
  }
};

const getOrderedProductsBySeller = async (req, res, next) => {
  try {
    const sellerId = req.params.id;

    const ordersWithSellerId = await Order.find({
      "orderedProducts.seller": sellerId,
    });

    if (ordersWithSellerId.length > 0) {
      const orderedProducts = ordersWithSellerId.reduce(
        (accumulator, order) => {
          order.orderedProducts
            .filter((product) => String(product.seller) === sellerId)
            .forEach((product) => {
              const existingProductIndex = accumulator.findIndex(
                (p) => p._id.toString() === product._id.toString(),
              );
              if (existingProductIndex !== -1) {
                // If product already exists, merge quantities
                accumulator[existingProductIndex].quantity += product.quantity;
              } else {
                // If product doesn't exist, add it to accumulator
                accumulator.push(product);
              }
            });
          return accumulator;
        },
        [],
      );
      res.send(orderedProducts);
    } else {
      res.send({ message: "No products found" });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  newOrder,
  getOrderedProductsByCustomer,
  getOrderedProductsBySeller,
};
