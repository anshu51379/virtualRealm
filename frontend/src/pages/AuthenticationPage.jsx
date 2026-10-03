import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Alert,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import api, { apiBase } from "../utils/api";
import { authSuccess } from "../redux/userSlice";
const AuthenticationPage = ({ mode, role }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const register = mode === "Register";
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data } = await api.post(`${apiBase}/${role}${mode}`, fields);
      if (!data.token) setError(data.message || "Please check your details.");
      else {
        dispatch(authSuccess(data));
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Cannot connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="main-content" className="auth-page">
      <section className="auth-story">
        <span className="eyebrow">
          YOUR WORLD, WITH A LITTLE MORE POSSIBILITY
        </span>
        <h1>
          {role === "Seller" ? (
            <>
              A home for
              <br />
              your next
              <br />
              <em>big idea.</em>
            </>
          ) : (
            <>
              Your next
              <br />
              favourite
              <br />
              <em>starts here.</em>
            </>
          )}
        </h1>
        <p>
          {role === "Seller"
            ? "Bring your products to a realm of curious shoppers."
            : "Keep your favourite finds close. Build your bag and make everyday a little brighter."}
        </p>
        <img
          src={
            role === "Seller"
              ? "/products/tote.svg"
              : "/products/headphones.svg"
          }
          alt=""
        />
      </section>
      <section className="auth-form">
        <span className="eyebrow">WELCOME TO VIRTUAL REALM</span>
        <h2>
          {register ? "Make yourself at home." : "Good to see you again."}
        </h2>
        <p className="muted">
          {register
            ? "Create your account to get started."
            : "Sign in to pick up where you left off."}
        </p>
        <ToggleButtonGroup
          value={role}
          exclusive
          onChange={(e, value) =>
            value && navigate(`/${value}${register ? "register" : "login"}`)
          }
          fullWidth
        >
          <ToggleButton value="Customer">Shopper</ToggleButton>
          <ToggleButton value="Seller">Seller</ToggleButton>
        </ToggleButtonGroup>
        <form onSubmit={submit}>
          {register && (
            <TextField
              label="Your name"
              name="name"
              autoComplete="name"
              required
              fullWidth
            />
          )}
          {register && role === "Seller" && (
            <TextField label="Shop name" name="shopName" required fullWidth />
          )}
          <TextField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            fullWidth
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            helperText={register ? "Use 8–72 characters." : null}
            required
            fullWidth
            slotProps={{
              htmlInput: { minLength: register ? 8 : 1, maxLength: 72 }
            }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={busy}
            endIcon={<ArrowForward />}
          >
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          </Button>
        </form>
        <p>
          {register ? "Already have an account?" : "New to the realm?"}{" "}
          <Link to={`/${role}${register ? "login" : "register"}`}>
            {register ? "Sign in" : "Create account"}
          </Link>
        </p>
      </section>
    </main>
  );
};
export default AuthenticationPage;
