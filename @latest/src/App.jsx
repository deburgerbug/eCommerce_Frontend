import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import OrdersPage from "./pages/OrdersPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import Navbar from "./components/Navbar";
import { CartProvider } from "./store/CartContext";
import CartPage from "./pages/CartPage";
function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="products/:id" element={<ProductDetailsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="cart" element={<CartPage/>}   />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="page" >
        <Outlet />
      </main>
    </>
  );
}

export default App;