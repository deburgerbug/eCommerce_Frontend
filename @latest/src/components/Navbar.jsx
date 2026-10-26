import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Navbar.css";
import { useCart } from "../store/CartContext";
import { useAuth } from "../store/AuthContext";
function Navbar() {
  const { cart } = useCart();
  const { user, logout } = useAuth();
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
          {user ? (
            <>
              <span className="navbar-user" >Hey, {user.name.split(" ")[0]}</span>
              <button className="navbar-logout" onClick={logout}>Logout</button>
            </>
          ):
          (
            <>
            <NavLink to="login" >Login</NavLink>
            <NavLink to="register">Register</NavLink>
            </>
          )}
        </nav>
    </header>
  );
}

export default Navbar;