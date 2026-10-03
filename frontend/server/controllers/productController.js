const { productFields } = require("../services/commerce");
const Product = require("../models/productSchema");
const Customer = require("../models/customerSchema");

const productCreate = async (req, res, next) => {
  try {
    const fields = productFields(req.body);
    if (
      !fields.productName ||
      !fields.category ||
      !fields.price ||
      !fields.productImage
    )
      return res
        .status(400)
        .json({
          message: "Product name, category, image, and price are required.",
        });
    const product = new Product({ ...fields, seller: req.user.userId });

    let result = await product.save();

    res.send(result);
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    let products = await Product.find().populate("seller", "shopName");
    res.send(products);
  } catch (err) {
    next(err);
  }
};

const getSellerProducts = async (req, res, next) => {
  try {
    let products = await Product.find({ seller: req.params.id });
    if (products.length > 0) {
      res.send(products);
    } else {
      res.send({ message: "No products found" });
    }
  } catch (err) {
    next(err);
  }
};

const getProductDetail = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id)
      .populate("seller", "shopName")
      .populate({
        path: "reviews.reviewer",
        model: "customer",
        select: "name",
      });

    if (product) {
      res.send(product);
    } else {
      res.send({ message: "No product found" });
    }
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    let result = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productFields(req.body) },
      { returnDocument: "after", runValidators: true },
    );

    res.send(result);
  } catch (error) {
    next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const reviewer = req.user.userId;
    if (
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5 ||
      typeof comment !== "string" ||
      comment.length > 2000
    )
      return res
        .status(400)
        .json({
          message: "Enter a rating of 1–5 and a comment up to 2000 characters.",
        });
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product)
      return res.status(404).json({ message: "Product not found." });
    const existingReview = product.reviews.find(
      (review) => review.reviewer.toString() === reviewer,
    );

    if (existingReview) {
      return res.send({
        message: "You have already submitted a review for this product.",
      });
    }

    const purchased = await require("../models/orderSchema").exists({
      buyer: req.user.userId,
      "orderedProducts._id": productId,
    });
    if (!purchased)
      return res
        .status(403)
        .json({ message: "You can review products you have purchased." });
    product.reviews.push({
      rating,
      comment,
      reviewer,
      date: new Date(),
    });

    const updatedProduct = await product.save();

    res.send(updatedProduct);
  } catch (error) {
    next(error);
  }
};

const searchProduct = async (req, res, next) => {
  try {
    const key = req.params.key
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let products = await Product.find({
      $or: [
        { productName: { $regex: key, $options: "i" } },
        { category: { $regex: key, $options: "i" } },
        { subcategory: { $regex: key, $options: "i" } },
      ],
    }).populate("seller", "shopName");

    if (products.length > 0) {
      res.send(products);
    } else {
      res.send({ message: "No products found" });
    }
  } catch (err) {
    next(err);
  }
};

const searchProductbyCategory = async (req, res, next) => {
  try {
    const key = req.params.key
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let products = await Product.find({
      $or: [{ category: { $regex: key, $options: "i" } }],
    }).populate("seller", "shopName");

    if (products.length > 0) {
      res.send(products);
    } else {
      res.send({ message: "No products found" });
    }
  } catch (err) {
    next(err);
  }
};

const searchProductbySubCategory = async (req, res, next) => {
  try {
    const key = req.params.key
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let products = await Product.find({
      $or: [{ subcategory: { $regex: key, $options: "i" } }],
    }).populate("seller", "shopName");

    if (products.length > 0) {
      res.send(products);
    } else {
      res.send({ message: "No products found" });
    }
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    await Customer.updateMany(
      { "cartDetails._id": deletedProduct._id },
      { $pull: { cartDetails: { _id: deletedProduct._id } } },
    );

    res.send(deletedProduct);
  } catch (error) {
    next(error);
  }
};

const deleteProducts = async (req, res, next) => {
  try {
    const deletedProducts = await Product.find({
      seller: req.params.id,
    }).select("_id");
    const deletionResult = await Product.deleteMany({ seller: req.params.id });

    const deletedCount = deletionResult.deletedCount || 0;

    if (deletedCount === 0) {
      res.send({ message: "No products found to delete" });
      return;
    }

    await Customer.updateMany(
      {
        "cartDetails._id": {
          $in: deletedProducts.map((product) => product._id),
        },
      },
      {
        $pull: {
          cartDetails: {
            _id: { $in: deletedProducts.map((product) => product._id) },
          },
        },
      },
    );

    res.send(deletionResult);
  } catch (error) {
    next(error);
  }
};

const deleteProductReview = async (req, res, next) => {
  try {
    const { reviewId } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product)
      return res.status(404).json({ message: "Product not found." });
    const review = product.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found." });
    if (
      String(review.reviewer) !== req.user.userId &&
      String(product.seller) !== req.user.userId
    )
      return res
        .status(403)
        .json({
          message:
            "You can only delete your own reviews or moderate your own products.",
        });
    const updatedReviews = product.reviews.filter(
      (review) => String(review._id) !== reviewId,
    );

    product.reviews = updatedReviews;

    const updatedProduct = await product.save();

    res.send(updatedProduct);
  } catch (error) {
    next(error);
  }
};

const deleteAllProductReviews = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    product.reviews = [];

    const updatedProduct = await product.save();

    res.send(updatedProduct);
  } catch (error) {
    next(error);
  }
};

const getInterestedCustomers = async (req, res, next) => {
  try {
    const productId = req.params.id;

    const interestedCustomers = await Customer.find({
      "cartDetails._id": productId,
    });

    const customerDetails = interestedCustomers
      .map((customer) => {
        const cartItem = customer.cartDetails.find(
          (item) => item._id.toString() === productId,
        );
        if (cartItem) {
          return {
            customerName: customer.name,
            customerID: customer._id,
            quantity: cartItem.quantity,
          };
        }
        return null; // If cartItem is not found in this customer's cartDetails
      })
      .filter((item) => item !== null); // Remove null values from the result

    if (customerDetails.length > 0) {
      res.send(customerDetails);
    } else {
      res.send({ message: "No customers are interested in this product." });
    }
  } catch (error) {
    next(error);
  }
};

const getAddedToCartProducts = async (req, res, next) => {
  try {
    const sellerId = req.params.id;

    const customersWithSellerProduct = await Customer.find({
      "cartDetails.seller": sellerId,
    });

    const productMap = new Map(); // Use a Map to aggregate products by ID
    customersWithSellerProduct.forEach((customer) => {
      customer.cartDetails.forEach((cartItem) => {
        if (cartItem.seller.toString() === sellerId) {
          const productId = cartItem._id.toString();
          if (productMap.has(productId)) {
            // If product ID already exists, update the quantity
            const existingProduct = productMap.get(productId);
            existingProduct.quantity += cartItem.quantity;
          } else {
            // If product ID does not exist, add it to the Map
            productMap.set(productId, {
              productName: cartItem.productName,
              quantity: cartItem.quantity,
              category: cartItem.category,
              subcategory: cartItem.subcategory,
              productID: productId,
            });
          }
        }
      });
    });

    const productsInCart = Array.from(productMap.values());

    if (productsInCart.length > 0) {
      res.send(productsInCart);
    } else {
      res.send({
        message: "No products from this seller are added to cart by customers.",
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  productCreate,
  getProducts,
  getSellerProducts,
  getProductDetail,
  updateProduct,
  addReview,
  searchProduct,
  searchProductbyCategory,
  searchProductbySubCategory,
  deleteProduct,
  deleteProducts,
  deleteProductReview,
  deleteAllProductReviews,
  getInterestedCustomers,
  getAddedToCartProducts,
};
