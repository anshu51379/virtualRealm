import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Pagination, Snackbar } from "@mui/material";
import { Add, ArrowOutward } from "@mui/icons-material";
import { addToCart } from "../redux/userSlice";
const Products = ({ productData = [], compact = false }) => {
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentRole } = useSelector((state) => state.user);
  useEffect(() => setPage(1), [productData]);
  const items = compact
    ? productData.slice(0, 4)
    : productData.slice((page - 1) * 12, page * 12);
  return (
    <div className={compact ? "" : "catalog-container"}>
      {!compact && (
        <div className="section-heading">
          <div>
            <small className="eyebrow">THE REALM COLLECTION</small>
            <h1>Something for your everyday.</h1>
          </div>
          <span className="muted">{productData.length} finds</span>
        </div>
      )}
      {!items.length ? (
        <div className="empty-state">
          No products found. Try another search or category.
        </div>
      ) : (
        <div className="product-grid">
          {items.map((p, i) => (
            <article className="product-card" key={p._id}>
              <Link
                className={`product-art art-${i % 4}`}
                to={`/product/view/${p._id}`}
              >
                <span className="product-category">{p.category}</span>
                <img
                  src={p.productImage}
                  alt={p.productName}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/products/bag.svg";
                  }}
                />
                <span className="product-view" aria-label="View product">
                  <ArrowOutward fontSize="small" />
                </span>
              </Link>
              <div className="product-info">
                <p className="muted">
                  {p.subcategory || "Everyday essentials"}
                </p>
                <Link to={`/product/view/${p._id}`}>
                  <h3>{p.productName}</h3>
                </Link>
                <div className="product-bottom">
                  <span>
                    <strong>₹{p.price?.cost?.toLocaleString("en-IN")}</strong>
                    <del>₹{p.price?.mrp?.toLocaleString("en-IN")}</del>
                  </span>
                  <Button
                    size="small"
                    aria-label={`Add ${p.productName} to bag`}
                    onClick={() => {
                      if (currentRole === "Customer") {
                        dispatch(addToCart(p));
                        setMessage("Added to your bag");
                      } else navigate("/Customerlogin");
                    }}
                  >
                    <Add />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {!compact && productData.length > 12 && (
        <Pagination
          count={Math.ceil(productData.length / 12)}
          page={page}
          onChange={(e, value) => setPage(value)}
          sx={{ my: 4, display: "flex", justifyContent: "center" }}
        />
      )}
      <Snackbar
        open={!!message}
        autoHideDuration={2500}
        message={message}
        onClose={() => setMessage("")}
      />
    </div>
  );
};
export default Products;
