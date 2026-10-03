import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
const Home = lazy(() => import("./pages/Home"));
const ViewProduct = lazy(() => import("./pages/ViewProduct"));
const Navbar = lazy(() => import("./pages/Navbar"));
const AuthenticationPage = lazy(() => import("./pages/AuthenticationPage"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const CustomerSearch = lazy(
  () => import("./pages/customer/pages/CustomerSearch"),
);
const Products = lazy(() => import("./components/Products"));
import { useEffect, lazy, Suspense } from "react";
import { getProducts } from "./redux/userHandle";
const CustomerOrders = lazy(
  () => import("./pages/customer/pages/CustomerOrders"),
);
const CheckoutSteps = lazy(
  () => import("./pages/customer/pages/CheckoutSteps"),
);
const Profile = lazy(() => import("./pages/customer/pages/Profile"));
const Logout = lazy(() => import("./pages/Logout"));
import { isTokenValid } from "./redux/userSlice";
const CheckoutAftermath = lazy(
  () => import("./pages/customer/pages/CheckoutAftermath"),
);
const ViewOrder = lazy(() => import("./pages/customer/pages/ViewOrder"));

const App = () => {
  const dispatch = useDispatch();

  const { isLoggedIn, currentToken, currentRole, productData } = useSelector(
    (state) => state.user,
  );

  useEffect(() => {
    dispatch(getProducts());

    dispatch(isTokenValid());
  }, [dispatch, currentToken]);

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="empty-state" role="status">
            Loading your realm…
          </div>
        }
      >
        {!isLoggedIn && currentRole === null && (
          <>
            <Navbar />

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/Home" element={<Home />} />
              <Route path="*" element={<Navigate to="/" />} />

              <Route
                path="/Products"
                element={<Products productData={productData} />}
              />

              <Route path="/product/view/:id" element={<ViewProduct />} />

              <Route
                path="/Search"
                element={<CustomerSearch mode="Mobile" />}
              />
              <Route
                path="/ProductSearch"
                element={<CustomerSearch mode="Desktop" />}
              />

              <Route
                path="/Customerregister"
                element={<AuthenticationPage mode="Register" role="Customer" />}
              />
              <Route
                path="/Customerlogin"
                element={<AuthenticationPage mode="Login" role="Customer" />}
              />
              <Route
                path="/Sellerregister"
                element={<AuthenticationPage mode="Register" role="Seller" />}
              />
              <Route
                path="/Sellerlogin"
                element={<AuthenticationPage mode="Login" role="Seller" />}
              />
            </Routes>
          </>
        )}

        {isLoggedIn && currentRole === "Customer" && (
          <>
            <Navbar />

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/Home" element={<Home />} />
              <Route path="*" element={<Navigate to="/" />} />

              <Route
                path="/Products"
                element={<Products productData={productData} />}
              />

              <Route path="/product/view/:id" element={<ViewProduct />} />

              <Route
                path="/Search"
                element={<CustomerSearch mode="Mobile" />}
              />
              <Route
                path="/ProductSearch"
                element={<CustomerSearch mode="Desktop" />}
              />

              <Route path="/Checkout" element={<CheckoutSteps />} />
              <Route path="/product/buy/:id" element={<CheckoutSteps />} />
              <Route path="/Aftermath" element={<CheckoutAftermath />} />

              <Route path="/Profile" element={<Profile />} />
              <Route path="/Orders" element={<CustomerOrders />} />
              <Route path="/order/view/:id" element={<ViewOrder />} />
              <Route path="/Logout" element={<Logout />} />
            </Routes>
          </>
        )}

        {isLoggedIn &&
          (currentRole === "Seller" || currentRole === "Shopcart") && (
            <>
              <SellerDashboard />
            </>
          )}
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
