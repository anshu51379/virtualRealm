const jwt = require("jsonwebtoken");
const Customer = require("../models/customerSchema");
const Seller = require("../models/sellerSchema");
const authMiddleware = async (req, res, next) => {
  const header = req.get("Authorization") || "";
  if (!header.startsWith("Bearer "))
    return res.status(401).json({ message: "Please sign in again." });
  try {
    const decoded = jwt.verify(header.slice(7), process.env.SECRET_KEY, {
      algorithms: ["HS256"],
    });
    // Resolve the role from the database, including for tokens issued by the original app.
    const customer = await Customer.findById(decoded.userId).select("_id");
    const user = customer || await Seller.findById(decoded.userId).select("_id");
    if (!user) return res.status(401).json({ message: "Account not found." });
    // The original registration accepted arbitrary role fields. Collection
    // membership is authoritative, including legacy "Shopcart" sellers.
    req.user = { userId: String(user._id), role: customer ? "Customer" : "Seller" };
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please sign in again." });
  }
};
module.exports = authMiddleware;
