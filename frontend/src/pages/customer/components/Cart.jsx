import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Button, IconButton } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import {
  addToCart,
  removeFromCart,
  removeAllFromCart,
} from "../../../redux/userSlice";
const Cart = ({ setIsCartOpen }) => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = currentUser.cartDetails;
  const total = items.reduce(
    (value, p) => value + p.quantity * p.price.cost,
    0,
  );
  const checkout = (id) => {
    setIsCartOpen(false);
    navigate(id ? `/product/buy/${id}` : "/Checkout");
  };
  return (
    <div className="shopping-bag">
      {!items.length ? (
        <div className="empty-state">
          <img src="/products/tote.svg" alt="" width="160" />
          <p>Your bag is waiting for your next favourite.</p>
          <Button onClick={() => setIsCartOpen(false)}>Keep exploring</Button>
        </div>
      ) : (
        <>
          <div className="bag-items">
            {items.map((p) => (
              <article className="bag-item" key={p._id}>
                <img src={p.productImage} alt={p.productName} />
                <div>
                  <Link
                    to={`/product/view/${p._id}`}
                    onClick={() => setIsCartOpen(false)}
                  >
                    <h3>{p.productName}</h3>
                  </Link>
                  <p>₹{p.price.cost.toLocaleString("en-IN")} each</p>
                  <div className="bag-quantity">
                    <IconButton
                      size="small"
                      aria-label={`Remove one ${p.productName}`}
                      onClick={() => dispatch(removeFromCart(p))}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <span aria-label={`Quantity ${p.quantity}`}>
                      {p.quantity}
                    </span>
                    <IconButton
                      size="small"
                      aria-label={`Add one ${p.productName}`}
                      disabled={p.quantity >= 99}
                      onClick={() => dispatch(addToCart(p))}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </div>
                  <Button size="small" onClick={() => checkout(p._id)}>
                    Buy this item
                  </Button>
                </div>
                <strong>
                  ₹{(p.price.cost * p.quantity).toLocaleString("en-IN")}
                </strong>
              </article>
            ))}
          </div>
          <div className="bag-total">
            <span>Estimated total</span>
            <strong>₹{total.toLocaleString("en-IN")}</strong>
          </div>
          <p className="muted bag-price-note">
            Current prices are confirmed when your order is placed.
          </p>
          <div className="bag-actions">
            <Button onClick={() => dispatch(removeAllFromCart())}>
              Empty bag
            </Button>
            <Button variant="contained" onClick={() => checkout()}>
              Buy All
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
export default Cart;
