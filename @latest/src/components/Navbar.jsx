import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Navbar.css";
import { useCart } from "../store/CartContext";

function Navbar() {
  const { cart } = useCart();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") ?? "";

  function handleSearchChange(event) {
    const value = event.target.value;

    navigate(
      {
        pathname: "/",
        search: value ? `?search=${encodeURIComponent(value)}` : "",
      },
      { replace: true },
    );
  }

  return (
    <header className="navbar">
        <Link className="navbar-brand" to="/">Shop</Link>
        <label className="navbar-search">
          <span className="visually-hidden">Search products</span>
          <input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </label>
        <nav className="navbar-links" aria-label="Main navigation" >
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/cart">Cart ({cartCount})</NavLink>
        </nav>
    </header>
  );
}

export default Navbar;