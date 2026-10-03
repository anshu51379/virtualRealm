import { useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { addStuff, updateCustomer } from "../../../redux/userHandle";
import {
  removeAllFromCart,
  removeSpecificProduct,
} from "../../../redux/userSlice";
const PaymentForm = ({ handleBack }) => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lines = id
    ? currentUser.cartDetails.filter((p) => p._id === id)
    : currentUser.cartDetails;
  const submit = async () => {
    setBusy(true);
    setError("");
    const success = await dispatch(
      addStuff("newOrder", {
        shippingData: currentUser.shippingData,
        orderedProducts: lines.map((p) => ({
          _id: p._id,
          quantity: p.quantity,
        })),
      }),
    );
    if (success) {
      dispatch(id ? removeSpecificProduct(id) : removeAllFromCart());
      const cartDetails = currentUser.cartDetails.filter(
        (p) => id && p._id !== id,
      );
      await dispatch(
        updateCustomer({ ...currentUser, cartDetails }, currentUser._id),
      );
      navigate("/Aftermath");
    } else {
      setError(
        "Order could not be placed. Your cart has been kept. Check your address and try again.",
      );
      setBusy(false);
    }
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Cash on delivery
      </Typography>
      <Alert severity="info">
        Pay when your order arrives. Online payments will be available after a
        payment gateway is connected.
      </Alert>
      <Typography sx={{ my: 3 }}>
        The server confirms current catalogue prices when you place your order.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        <Button disabled={busy} onClick={handleBack}>
          Back
        </Button>
        <Button
          variant="contained"
          disabled={busy || !lines.length}
          onClick={submit}
        >
          {busy ? "Placing order…" : "Place order"}
        </Button>
      </Box>
    </Box>
  );
};
export default PaymentForm;
