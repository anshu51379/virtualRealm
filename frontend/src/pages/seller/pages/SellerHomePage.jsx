import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import api, { apiBase } from "../../../utils/api";
const SellerHomePage = () => {
  const [metrics, setMetrics] = useState(null),
    [error, setError] = useState("");
  const load = () => {
    setError("");
    api
      .get(`${apiBase}/seller/metrics`)
      .then(({ data }) => setMetrics(data))
      .catch(() => setError("Your shop data could not be loaded."));
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="seller-overview">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR SELLER REALM</span>
          <h1>A clearer view of your shop.</h1>
        </div>
        <Button component={Link} to="/Seller/addproduct" variant="contained">
          Add a product
        </Button>
      </div>
      {error ? (
        <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      ) : !metrics ? (
        <p role="status">Loading shop data…</p>
      ) : (
        <>
          <div className="seller-metrics">
            {[
              ["Products", metrics.products],
              ["Orders containing your products", metrics.orders],
              ["Units ordered", metrics.units],
              ["Order value", `₹${metrics.orderValue.toLocaleString("en-IN")}`],
            ].map(([title, value]) => (
              <Card key={title} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {title}
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 2 }}>
                    {value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card variant="outlined" sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6">Monthly order value</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, mb: 3 }}
            >
              Order value includes unpaid cash-on-delivery orders; it is not
              collected revenue.
            </Typography>
            {metrics.months.length ? (
              metrics.months.map((m) => (
                <div key={m.month} className="metric-row">
                  <span>{m.month}</span>
                  <div>
                    <span
                      style={{
                        width: `${(m.value / Math.max(...metrics.months.map((v) => v.value))) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>₹{m.value.toLocaleString("en-IN")}</strong>
                </div>
              ))
            ) : (
              <p className="muted">
                No orders yet. Add your first product to get started.
              </p>
            )}
          </Card>
          <Button sx={{ mt: 3 }} onClick={load}>
            Refresh shop data
          </Button>
        </>
      )}
    </div>
  );
};
export default SellerHomePage;
