import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import Navbar from "./components/Navbar";
import { CartProvider } from "./store/CartContext";
import { AuthProvider } from "./store/AuthContext";
import CartPage from "./pages/CartPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import WishListPage from "./pages/WishListPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CheckoutPage from "./pages/CheckoutPage";
import { WishlistProvider } from "./store/WishlistContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="home" element={<Navigate to="/" replace />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/:id" element={<ProductDetailsPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="wishlist" element={<WishListPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                </Route>
                <Route path="cart" element={<CartPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}

export default App;