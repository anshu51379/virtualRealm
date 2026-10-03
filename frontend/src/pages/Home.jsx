import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Skeleton,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  ArrowForward,
  Search,
  StorefrontOutlined,
  ShoppingBagOutlined,
  Tune,
} from "@mui/icons-material";
import Products from "../components/Products";
import ShoppingAssistant from "../components/ShoppingAssistant";
import { getProducts } from "../redux/userHandle";
import api, { apiBase } from "../utils/api";
const Home = () => {
  const { productData, loading, error } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [category, setCategory] = useState("All finds");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    api
      .get(`${apiBase}/health`)
      .then(({ data }) => setDemo(data.demo))
      .catch(() => {});
  }, []);
  const filtered = useMemo(() => {
    const items = productData.filter(
      (p) =>
        (category === "All finds" || p.category === category) &&
        `${p.productName} ${p.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return sort === "featured"
      ? items
      : [...items].sort((a, b) =>
          sort === "low"
            ? a.price.cost - b.price.cost
            : b.price.cost - a.price.cost,
        );
  }, [productData, category, query, sort]);
  const browse = (cat) => {
    setCategory(cat);
    document
      .getElementById("collection")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <main id="main-content" className="storefront">
      {demo && (
        <Alert severity="info" className="demo-notice">
          You’re exploring a sample collection. Connect the database to create
          an account, sell, and order.
        </Alert>
      )}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> WELCOME TO A WORLD OF GOOD FINDS
          </span>
          <h1>
            A little more
            <br />
            joy in your
            <br />
            <em>everyday.</em>
          </h1>
          <p>
            Small upgrades. Great discoveries.
            <br />
            Find things you’ll love, from a realm of independent sellers.
          </p>
          <Button
            variant="contained"
            onClick={() => browse("All finds")}
            endIcon={<ArrowForward />}
          >
            Explore the collection
          </Button>
          <div className="hero-note">
            <span>✦</span> Thoughtful finds. All in one place.
          </div>
        </div>
        <div className="hero-art">
          <div className="art-orbit" />
          <div className="hero-art-caption">
            THE EVERYDAY EDIT <span>01 / 08</span>
          </div>
          <img
            className="hero-headphones"
            src="/products/headphones.svg"
            alt="Lavender studio headphones"
          />
          <div className="floating-tag">
            <span className="tiny-label">MAKE ROOM FOR YOUR FAVOURITES</span>
            <strong>
              Good sound.
              <br />
              Better days.
            </strong>
            <Link to="/Products">
              Discover audio <ArrowForward fontSize="small" />
            </Link>
          </div>
          <span className="hero-spark">✳</span>
        </div>
      </section>
      <section className="value-strip" aria-label="Marketplace features">
        <div>
          <ShoppingBagOutlined />
          <span>
            <strong>Your everyday, upgraded</strong>
            <small>Find a little something for every routine</small>
          </span>
        </div>
        <div>
          <StorefrontOutlined />
          <span>
            <strong>Discover independent sellers</strong>
            <small>Meet the shops behind your next favourite</small>
          </span>
        </div>
        <div>
          <Tune />
          <span>
            <strong>Shopping, made simpler</strong>
            <small>Search, save, and find your perfect fit</small>
          </span>
        </div>
      </section>
      <section className="collection" id="collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CURATED FOR YOUR WORLD</span>
            <h2>Find your kind of everyday.</h2>
          </div>
          <Link className="text-link" to="/Products">
            Browse everything <ArrowForward fontSize="small" />
          </Link>
        </div>
        <div className="collection-tools">
          <div
            className="category-tabs"
            role="group"
            aria-label="Filter by category"
          >
            {[
              "All finds",
              ...new Set(productData.map((p) => p.category).filter(Boolean)),
            ].map((c) => (
              <button
                key={c}
                aria-pressed={c === category}
                className={c === category ? "selected" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="search-sort">
            <TextField
              size="small"
              label="Search collection"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <select
              aria-label="Sort collection"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="product-grid">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} variant="rounded" height={340} />
            ))}
          </div>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button onClick={() => dispatch(getProducts())}>Retry</Button>
            }
          >
            The collection could not be loaded. Check your connection and try
            again.
          </Alert>
        ) : (
          <Products productData={filtered} compact />
        )}
      </section>
      <section className="discovery-panel">
        <div>
          <span className="eyebrow">A LITTLE GUIDANCE GOES A LONG WAY</span>
          <h2>
            Got something in mind?
            <br />
            Let’s find it together.
          </h2>
          <p>
            Tell our shopping helper what you’re looking for.
            <br />A new hobby, a thoughtful gift, or a better morning.
          </p>
          <ShoppingAssistant />
        </div>
        <div className="discovery-sample">
          <span>✦ YOUR NEXT FIND</span>
          <p>
            “Something for my desk
            <br />
            under ₹2,000”
          </p>
          <small>A little inspiration is all it takes.</small>
        </div>
      </section>
      <footer className="site-footer">
        <Link className="brand" to="/">
          virtualrealm<span>© {new Date().getFullYear()}</span>
        </Link>
        <p>A realm of possibilities. A little more everyday.</p>
        <Link to="/Sellerregister">
          Start your seller journey <ArrowForward fontSize="small" />
        </Link>
      </footer>
    </main>
  );
};
export default Home;
