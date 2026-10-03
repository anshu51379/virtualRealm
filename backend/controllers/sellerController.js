const bcrypt = require("bcrypt");
const Seller = require("../models/sellerSchema.js");
const { createNewToken } = require("../utils/token.js");

const sellerRegister = async (req, res, next) => {
  try {
    if (
      typeof req.body.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim()) ||
      typeof req.body.password !== "string" ||
      req.body.password.length < 8 ||
      req.body.password.length > 72 ||
      typeof req.body.name !== "string" ||
      !req.body.name.trim() ||
      typeof req.body.shopName !== "string" ||
      !req.body.shopName.trim()
    )
      return res
        .status(400)
        .json({
          message:
            "Enter a name, valid email, and password of 8–72 characters.",
        });
    req.body.email = req.body.email.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);

    const seller = new Seller({
      name: req.body.name,
      email: req.body.email.trim().toLowerCase(),
      role: "Seller",
      shopName: req.body.shopName,
      password: hashedPass,
    });

    const existingSellerByEmail = await Seller.findOne({
      email: req.body.email.trim().toLowerCase(),
    });
    const existingShop = await Seller.findOne({ shopName: req.body.shopName });

    if (existingSellerByEmail) {
      res.send({ message: "Email already exists" });
    } else if (existingShop) {
      res.send({ message: "Shop name already exists" });
    } else {
      let result = await seller.save();
      result.password = undefined;

      const token = createNewToken(result._id);

      result = {
        ...result._doc,
        token: token,
      };

      res.send(result);
    }
  } catch (err) {
    next(err);
  }
};

const sellerLogIn = async (req, res, next) => {
  try {
    if (
      typeof req.body.email === "string" &&
      typeof req.body.password === "string"
    ) {
      let seller = await Seller.findOne({
        email: req.body.email.trim().toLowerCase(),
      });
      if (seller) {
        const validated = await bcrypt.compare(
          req.body.password,
          seller.password,
        );
        if (validated) {
          seller.password = undefined;

          const token = createNewToken(seller._id);

          seller = {
            ...seller._doc,
            token: token,
          };

          res.send(seller);
        } else {
          res.send({ message: "Invalid email or password" });
        }
      } else {
        res.send({ message: "Invalid email or password" });
      }
    } else {
      res.send({ message: "Email and password are required" });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { sellerRegister, sellerLogIn };
