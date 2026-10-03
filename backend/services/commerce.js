const mongoose = require("mongoose");
const invalid = (message) => {
  const err = new Error(message);
  err.status = 400;
  throw err;
};
function productFields(body) {
  const fields = {};
  for (const key of [
    "productName",
    "subcategory",
    "category",
    "description",
    "tagline",
    "productImage",
  ])
    if (body[key] !== undefined) {
      if (
        typeof body[key] !== "string" ||
        body[key].length > (key === "description" ? 5000 : 2000)
      )
        invalid("Invalid product details.");
      fields[key] = body[key].trim();
    }
  if (
    fields.productImage &&
    !/^(https:\/\/|\/products\/)/.test(fields.productImage)
  )
    invalid("Use an HTTPS image URL.");
  if (body.price !== undefined) {
    const cost = Number(body.price?.cost),
      mrp = Number(body.price?.mrp);
    if (
      !Number.isFinite(cost) ||
      !Number.isFinite(mrp) ||
      cost <= 0 ||
      mrp < cost ||
      mrp > 1e8
    )
      invalid("Invalid price.");
    fields.price = {
      cost,
      mrp,
      discountPercent: Math.round(((mrp - cost) / mrp) * 100),
    };
  }
  return fields;
}
function buildOrder(lines, products, buyer, shippingData) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 100)
    invalid("Your cart is empty or too large.");
  for (const key of ["address", "city", "state", "country"])
    if (
      typeof shippingData?.[key] !== "string" ||
      !shippingData[key].trim() ||
      shippingData[key].length > 300
    )
      invalid("Complete the shipping address.");
  if (
    !/^\d{6}$/.test(String(shippingData.pinCode)) ||
    !/^\d{10}$/.test(String(shippingData.phoneNo))
  )
    invalid("Invalid postal code or phone number.");
  const seen = new Set();
  const orderedProducts = lines.map((line) => {
    if (
      !mongoose.isValidObjectId(line?._id) ||
      seen.has(String(line._id)) ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 99
    )
      invalid("Invalid cart quantity or duplicate product.");
    seen.add(String(line._id));
    const product = products.find((p) => String(p._id) === String(line._id));
    if (
      !product ||
      !Number.isFinite(product.price?.cost) ||
      product.price.cost <= 0
    )
      invalid("A product is no longer available.");
    const data = product.toObject ? product.toObject() : product;
    return { ...data, quantity: line.quantity, reviews: undefined };
  });
  const totalPaise = orderedProducts.reduce(
    (total, p) => total + Math.round(p.price.cost * 100) * p.quantity,
    0,
  );
  return {
    buyer,
    shippingData,
    orderedProducts,
    productsQuantity: orderedProducts.reduce(
      (total, p) => total + p.quantity,
      0,
    ),
    totalPrice: totalPaise / 100,
    paymentInfo: {
      id: `cod-${require("crypto").randomUUID()}`,
      status: "Pending",
      method: "Cash on delivery",
    },
    orderStatus: "Processing",
  };
}
module.exports = { productFields, buildOrder };
