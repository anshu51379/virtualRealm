const Product = require("../models/productSchema");
const role = (expected) => (req, res, next) =>
  req.user.role === expected
    ? next()
    : res
        .status(403)
        .json({ message: "This action is not available to your account." });
const self = (req, res, next) =>
  req.params.id === req.user.userId
    ? next()
    : res
        .status(403)
        .json({ message: "You can only access your own account." });
const productOwner = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found." });
  if (String(product.seller) !== req.user.userId)
    return res
      .status(403)
      .json({ message: "You can only manage your own products." });
  next();
};
module.exports = { role, self, productOwner };
