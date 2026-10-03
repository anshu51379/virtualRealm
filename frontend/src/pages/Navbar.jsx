import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Close,
  ShoppingBagOutlined,
  PersonOutline,
  StorefrontOutlined,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import Cart from "./customer/components/Cart";
import api, { apiBase } from "../utils/api";
const Navbar = () => {
  const { currentUser, currentRole } = useSelector((state) => state.user);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [syncError, setSyncError] = useState("");
  const cart = currentUser?.cartDetails;
  const quantity = cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  // Sync only cart changes; do not dispatch an action that changes the effect dependency.
  useEffect(() => {
    if (currentRole !== "Customer") return;
    const timer = setTimeout(
      () =>
        api
          .put(`${apiBase}/CustomerUpdate/${currentUser._id}`, {
            cartDetails: cart,
          })
          .then(() => setSyncError(""))
          .catch(() =>
            setSyncError(
              "Cart is saved on this device. Server sync failed; try again when connected.",
            ),
          ),
      400,
    );
    return () => clearTimeout(timer);
  }, [cart, currentUser?._id, currentRole]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="announcement">
        Good finds. Everyday possibilities.{" "}
        <span>Welcome to your Virtual Realm.</span>
      </div>
      <header className="site-header">
        <div className="nav-inner">
          <Link className="brand" to="/" aria-label="Virtual Realm home">
            <span className="brand-mark">
              v<span>r</span>
            </span>
            <span>
              virtual<span className="brand-light">realm</span>
              <small>A LITTLE MORE EVERYDAY</small>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>
              Discover
            </NavLink>
            <NavLink to="/Products">Shop all</NavLink>
            <NavLink to="/Sellerlogin">
              Become a seller <StorefrontOutlined fontSize="small" />
            </NavLink>
          </nav>
          <div className="nav-actions">
            {currentRole === "Customer" ? (
              <Button
                className="account-link"
                aria-label="Open account menu"
                onClick={(e) => setAccountAnchor(e.currentTarget)}
              >
                <PersonOutline />
                <span>{currentUser.name.split(" ")[0]}</span>
              </Button>
            ) : (
              <Link to="/Customerlogin" className="account-link">
                <PersonOutline />
                <span>Sign in</span>
              </Link>
            )}
            <IconButton
              aria-label={`Open shopping bag, ${quantity} items`}
              onClick={() => setCartOpen(true)}
            >
              <Badge badgeContent={quantity} color="primary">
                <ShoppingBagOutlined />
              </Badge>
            </IconButton>
          </div>
        </div>
      </header>
      {syncError && <Alert severity="warning">{syncError}</Alert>}
      <Dialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Your shopping bag
          <IconButton
            aria-label="Close shopping bag"
            onClick={() => setCartOpen(false)}
            sx={{ float: "right" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentRole === "Customer" ? (
            <Cart setIsCartOpen={setCartOpen} />
          ) : (
            <div className="empty-state">
              <p>Sign in to save your finds and start shopping.</p>
              <Button
                component={Link}
                to="/Customerlogin"
                onClick={() => setCartOpen(false)}
              >
                Sign in
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Menu
        anchorEl={accountAnchor}
        open={!!accountAnchor}
        onClose={() => setAccountAnchor(null)}
      >
        <MenuItem
          component={Link}
          to="/Profile"
          onClick={() => setAccountAnchor(null)}
        >
          My profile
        </MenuItem>
        <MenuItem
          component={Link}
          to="/Orders"
          onClick={() => setAccountAnchor(null)}
        >
          My orders
        </MenuItem>
        <MenuItem
          component={Link}
          to="/Logout"
          onClick={() => setAccountAnchor(null)}
        >
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
};
export default Navbar;
