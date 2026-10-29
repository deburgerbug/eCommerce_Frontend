import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Navbar.css";
import { useCart } from "../store/CartContext";
import { useAuth } from "../store/AuthContext";
import { useWishlist } from "../store/WishlistContext";
import { FiHome, FiShoppingCart, FiGrid, FiHeart, FiPackage, FiLogIn, FiUserPlus, FiLogOut, FiSearch, FiUser, FiMenu, FiX } from "react-icons/fi"
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist()
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") ?? "";

  function handleSearchChange(event) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set("search", value)
    }
    else {
      params.delete("search")
    }
    navigate(
      { pathname: "/products", search: params.toString() },
      { replace: true },
    );
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="navbar">
      <Link className="navbar-brand" to="/">Shop</Link>
      <button
        type="button"
        className="navbar-menu-toggle"
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMenuOpen}
        aria-controls="primary-navigation"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {isMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
      </button>
      <label className="navbar-search"> <FiSearch aria-hidden="true" />
        <span className="visually-hidden">Search products</span>
        <input
          type="search"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </label>
      <nav
        id="primary-navigation"
        className={`navbar-links ${isMenuOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
        onKeyDown={(event) => {
          if (event.key === "Escape") closeMenu();
        }}
      >
        <NavLink to="/" end aria-label="Home" title="Home" onClick={closeMenu}><FiHome aria-hidden="true" /><span className="navbar-link-label">Home</span></NavLink>
        <NavLink to="/products" aria-label="Products" title="Products" onClick={closeMenu}><FiGrid aria-hidden="true" /><span className="navbar-link-label">Products</span></NavLink>
        <NavLink to="/orders" aria-label="Orders" title="Orders" onClick={closeMenu}><FiPackage aria-hidden="true" /><span className="navbar-link-label">Orders</span></NavLink>
        <NavLink to="/cart" aria-label={`Cart, ${cartCount} items`} title="Cart" onClick={closeMenu}>
          <FiShoppingCart aria-hidden="true" /><span className="navbar-link-label">Cart</span><span className="navbar-badge">{cartCount}</span>
        </NavLink>
        <NavLink to="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} title="Wishlist" onClick={closeMenu}>
          <FiHeart aria-hidden="true" /><span className="navbar-link-label">Wishlist</span><span className="navbar-badge">{wishlist.length}</span>
        </NavLink>
        {user ? (
          <>
            <span className="navbar-user"><FiUser aria-hidden="true" /> {user.name.split(" ")[0]}</span>
            <button type="button" className="navbar-logout" aria-label="Logout" onClick={() => { closeMenu(); logout(); }}>
              <FiLogOut aria-hidden="true" /> <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" aria-label="Login" onClick={closeMenu}><FiLogIn aria-hidden="true" /> <span>Login</span></NavLink>
            <NavLink to="/register" aria-label="Register" onClick={closeMenu}><FiUserPlus aria-hidden="true" /> <span>Register</span></NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;