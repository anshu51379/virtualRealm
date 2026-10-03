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
    const user =
      (await Customer.findById(decoded.userId).select("_id role")) ||
      (await Seller.findById(decoded.userId).select("_id role"));
    if (!user) return res.status(401).json({ message: "Account not found." });
    req.user = { userId: String(user._id), role: user.role };
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please sign in again." });
  }
};
module.exports = authMiddleware;
