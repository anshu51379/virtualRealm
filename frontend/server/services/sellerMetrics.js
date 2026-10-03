const Order = require("../models/orderSchema");
const Product = require("../models/productSchema");
async function sellerMetrics(req, res) {
  const orders = await Order.find({
    "orderedProducts.seller": req.user.userId,
  }).lean();
  const products = await Product.countDocuments({ seller: req.user.userId });
  let units = 0,
    orderValue = 0;
  const monthly = new Map();
  for (const order of orders) {
    const value =
      order.orderedProducts
        .filter((p) => String(p.seller) === req.user.userId)
        .reduce((n, p) => {
          units += p.quantity;
          return n + Math.round(p.price.cost * 100) * p.quantity;
        }, 0) / 100;
    orderValue += value;
    const month = new Date(order.createdAt).toISOString().slice(0, 7);
    monthly.set(month, (monthly.get(month) || 0) + value);
  }
  res.json({
    products,
    orders: orders.length,
    units,
    orderValue,
    months: [...monthly.keys()]
      .sort()
      .map((month) => ({ month, value: monthly.get(month) })),
  });
}
module.exports = { sellerMetrics };
