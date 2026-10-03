import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Rating, Snackbar } from "@mui/material";
import { ShoppingBagOutlined } from "@mui/icons-material";
import { getProductDetails } from "../redux/userHandle";
import { addToCart } from "../redux/userSlice";
const ViewProduct = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    productDetails: p,
    loading,
    error,
    responseDetails,
    currentRole,
  } = useSelector((state) => state.user);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    dispatch(getProductDetails(id));
  }, [id, dispatch]);
  if (loading || (!p?._id && !error && !responseDetails))
    return (
      <main className="empty-state" role="status">
        Loading your find…
      </main>
    );
  if (error || responseDetails)
    return (
      <main className="catalog-container">
        <Alert severity="error">This product could not be loaded.</Alert>
        <Button onClick={() => dispatch(getProductDetails(id))}>Retry</Button>
      </main>
    );
  return (
    <main id="main-content" className="catalog-container">
      <Link className="muted" to="/Products">
        Shop all / {p.category}
      </Link>
      <div className="product-detail">
        <div className="detail-art">
          <img src={p.productImage} alt={p.productName} />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {p.seller?.shopName || "INDEPENDENT SELLER"}
          </span>
          <h1>{p.productName}</h1>
          <p className="muted">{p.tagline}</p>
          <div className="detail-price">
            <strong>₹{p.price.cost.toLocaleString("en-IN")}</strong>
            <del>₹{p.price.mrp.toLocaleString("en-IN")}</del>
            <small>{p.price.discountPercent}% off MRP</small>
          </div>
          <p>{p.description}</p>
          <Button
            variant="contained"
            startIcon={<ShoppingBagOutlined />}
            onClick={() => {
              if (currentRole === "Customer") {
                dispatch(addToCart(p));
                setAdded(true);
              } else navigate("/Customerlogin");
            }}
          >
            Add to your bag
          </Button>
          <div className="detail-facts">
            <span>
              Category <strong>{p.category}</strong>
            </span>
            <span>
              Collection <strong>{p.subcategory}</strong>
            </span>
            <span>
              Payment <strong>Cash on delivery</strong>
            </span>
          </div>
        </div>
      </div>
      <section>
        <h2>From the community</h2>
        {p.reviews?.length ? (
          p.reviews.map((r) => (
            <article className="review" key={r._id}>
              <strong>{r.reviewer?.name || "Shopper"}</strong>
              <Rating readOnly value={r.rating} size="small" />
              <p>{r.comment}</p>
            </article>
          ))
        ) : (
          <p className="muted" style={{ marginTop: 20 }}>
            No reviews yet. Purchased items can be reviewed from My Orders.
          </p>
        )}
      </section>
      <Snackbar
        open={added}
        message="Added to your bag"
        onClose={() => setAdded(false)}
        autoHideDuration={2500}
      />
    </main>
  );
};
export default ViewProduct;
