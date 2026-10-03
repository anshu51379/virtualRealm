import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
} from "@mui/material";
import { AutoAwesome, Close } from "@mui/icons-material";
import { Link } from "react-router-dom";
import api, { apiBase } from "../utils/api";
export default function ShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.post(`${apiBase}/ai/recommend`, { query });
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "The shopping helper is unavailable. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        className="assistant-trigger"
        onClick={() => setOpen(true)}
        startIcon={<AutoAwesome />}
      >
        Help me find it
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Find your next favourite
          <IconButton
            aria-label="Close shopping helper"
            onClick={() => setOpen(false)}
            sx={{ float: "right" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <p className="muted">
            Tell us what you need and your budget. Please leave out personal or
            payment details.
          </p>
          <form onSubmit={submit} className="assistant-form">
            <TextField
              fullWidth
              autoFocus
              label="What are you looking for?"
              placeholder="Headphones under 3000"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputProps={{ maxLength: 500 }}
              required
            />
            <Button
              type="submit"
              variant="contained"
              disabled={busy || !query.trim()}
            >
              {busy ? "Finding matches…" : "Find matches"}
            </Button>
          </form>
          {error && <Alert severity="error">{error}</Alert>}
          <div aria-live="polite">
            {result && (
              <>
                <small className="result-label">
                  {result.mode === "ai"
                    ? "AI-assisted suggestions · check product details"
                    : "Catalogue search · no AI provider connected"}
                </small>
                <p>{result.message}</p>
                <div className="assistant-results">
                  {result.products.map((p) => (
                    <Link
                      key={p._id}
                      to={`/product/view/${p._id}`}
                      onClick={() => setOpen(false)}
                    >
                      <img src={p.productImage} alt="" />
                      <span>
                        {p.productName}
                        <strong>₹{p.price.cost.toLocaleString("en-IN")}</strong>
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
