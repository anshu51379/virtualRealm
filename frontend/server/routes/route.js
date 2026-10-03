const router = require("express").Router();
router.param("id", (req, res, next, id) =>
  require("mongoose").isValidObjectId(id)
    ? next()
    : res.status(400).json({ message: "Invalid identifier." }),
);
const authMiddleware = require("../middleware/authMiddleware.js");
const { role, self, productOwner } = require("../middleware/access");
const seller = [authMiddleware, role("Seller")];
const customer = [authMiddleware, role("Customer")];

const {
  sellerRegister,
  sellerLogIn,
} = require("../controllers/sellerController.js");

const {
  productCreate,
  getProducts,
  getProductDetail,
  searchProduct,
  searchProductbyCategory,
  searchProductbySubCategory,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  deleteProducts,
  deleteProductReview,
  deleteAllProductReviews,
  addReview,
  getInterestedCustomers,
  getAddedToCartProducts,
} = require("../controllers/productController.js");

const {
  customerRegister,
  customerLogIn,
  getCartDetail,
  cartUpdate,
} = require("../controllers/customerController.js");

const {
  newOrder,
  getOrderedProductsByCustomer,
  getOrderedProductsBySeller,
} = require("../controllers/orderController.js");

// Seller
router.post("/SellerRegister", sellerRegister);
router.post("/SellerLogin", sellerLogIn);

// Product
router.post("/ProductCreate", ...seller, productCreate);
router.get("/getSellerProducts/:id", ...seller, self, getSellerProducts);
router.get("/getProducts", getProducts);
router.get("/getProductDetail/:id", getProductDetail);
router.get(
  "/getInterestedCustomers/:id",
  ...seller,
  productOwner,
  getInterestedCustomers,
);
router.get(
  "/getAddedToCartProducts/:id",
  ...seller,
  self,
  getAddedToCartProducts,
);

router.put("/ProductUpdate/:id", ...seller, productOwner, updateProduct);
router.put("/addReview/:id", ...customer, addReview);

router.get("/searchProduct/:key", searchProduct);
router.get("/searchProductbyCategory/:key", searchProductbyCategory);
router.get("/searchProductbySubCategory/:key", searchProductbySubCategory);

router.delete("/DeleteProduct/:id", ...seller, productOwner, deleteProduct);
router.delete("/DeleteProducts/:id", ...seller, self, deleteProducts);
router.put("/deleteProductReview/:id", authMiddleware, deleteProductReview);
router.delete(
  "/deleteAllProductReviews/:id",
  ...seller,
  productOwner,
  deleteAllProductReviews,
);

// Customer
router.post("/CustomerRegister", customerRegister);
router.post("/CustomerLogin", customerLogIn);
router.get("/getCartDetail/:id", ...customer, self, getCartDetail);
router.put("/CustomerUpdate/:id", ...customer, self, cartUpdate);

// Order
router.post("/newOrder", ...customer, newOrder);
router.get(
  "/getOrderedProductsByCustomer/:id",
  ...customer,
  self,
  getOrderedProductsByCustomer,
);
router.get(
  "/getOrderedProductsBySeller/:id",
  ...seller,
  self,
  getOrderedProductsBySeller,
);

router.get(
  "/seller/metrics",
  ...seller,
  require("../services/sellerMetrics").sellerMetrics,
);
module.exports = router;
