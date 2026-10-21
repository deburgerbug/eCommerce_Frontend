import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import OrdersPage from "./pages/OrdersPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="products/:id" element={<ProductDetailsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function AppLayout() {
  return (
    <>
      <header className="site-header">
        <Link className="site-brand" to="/">Shop</Link>
        <nav aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/orders">Orders</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default App;