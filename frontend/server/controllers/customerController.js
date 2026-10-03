const bcrypt = require("bcrypt");
const Customer = require("../models/customerSchema.js");
const { createNewToken } = require("../utils/token.js");
const { emailQuery } = require("../services/accounts");

const customerRegister = async (req, res, next) => {
  try {
    if (
      typeof req.body.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim()) ||
      typeof req.body.password !== "string" ||
      req.body.password.length < 8 ||
      req.body.password.length > 72 ||
      typeof req.body.name !== "string" ||
      !req.body.name.trim()
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

    const customer = new Customer({
      name: req.body.name,
      email: req.body.email.trim().toLowerCase(),
      role: "Customer",
      password: hashedPass,
    });

    const existingcustomerByEmail = await Customer.findOne(emailQuery(req.body.email));

    if (existingcustomerByEmail) {
      res.send({ message: "Email already exists" });
    } else {
      let result = await customer.save();
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

const customerLogIn = async (req, res, next) => {
  try {
    if (
      typeof req.body.email === "string" &&
      typeof req.body.password === "string"
    ) {
      let customer = await Customer.findOne(emailQuery(req.body.email));
      if (customer) {
        const validated = await bcrypt.compare(
          req.body.password,
          customer.password,
        );
        if (validated) {
          customer.password = undefined;

          const token = createNewToken(customer._id);

          customer = {
            ...customer._doc,
            role: "Customer",
            token: token,
          };

          res.send(customer);
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

const getCartDetail = async (req, res, next) => {
  try {
    let customer = await Customer.findById(req.params.id);
    if (customer) {
      res.send(customer.cartDetails);
    } else {
      res.send({ message: "No customer found" });
    }
  } catch (err) {
    next(err);
  }
};

const cartUpdate = async (req, res, next) => {
  try {
    let customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(req.body.cartDetails !== undefined
            ? { cartDetails: req.body.cartDetails }
            : {}),
          ...(req.body.shippingData !== undefined
            ? { shippingData: req.body.shippingData }
            : {}),
        },
      },
      { returnDocument: "after" },
    );

    return res.send(customer.cartDetails);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  customerRegister,
  customerLogIn,
  getCartDetail,
  cartUpdate,
};
