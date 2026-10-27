import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Navbar.css";
import { useCart } from "../store/CartContext";
import { useAuth } from "../store/AuthContext";
import { useWishlist } from "../store/WishlistContext";
import { FiHome, FiShoppingCart, FiGrid, FiHeart, FiPackage, FiLogIn, FiUserPlus, FiLogOut, FiSearch, FiUser } from "react-icons/fi"
function Navbar() {
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

  return (
    <header className="navbar">
      <Link className="navbar-brand" to="/">Shop</Link>
      <label className="navbar-search"> <FiSearch aria-hidden="true" />
        <span className="visually-hidden">Search products</span>
        <input
          type="search"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </label>
      <nav className="navbar-links" aria-label="Main navigation" >
        <NavLink to="/" end aria-label="Home" title="Home"><FiHome aria-hidden="true" /></NavLink>
        <NavLink to="/products" aria-label="products" title="products" ><FiGrid aria-hidden="true" /></NavLink>
        <NavLink to="/orders" aria-label="Orders" title="Orders"><FiPackage aria-hidden="true" /></NavLink>
        <NavLink to="/cart" aria-label={`Cart, ${cartCount} items`} title="Cart">
          <FiShoppingCart aria-hidden="true" /> <span className="navbar-badge">{cartCount}</span>
        </NavLink>
        <NavLink to="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} title="Wishlist">
          <FiHeart aria-hidden="true" /> <span className="navbar-badge">{wishlist.length}</span>
        </NavLink>
        {user ? (
          <>
            <span className="navbar-user"><FiUser aria-hidden="true" /> {user.name.split(" ")[0]}</span>
            <button type="button" className="navbar-logout" aria-label="Logout" onClick={logout}>
              <FiLogOut aria-hidden="true" /> <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" aria-label="Login"><FiLogIn aria-hidden="true" /> <span>Login</span></NavLink>
            <NavLink to="/register" aria-label="Register"><FiUserPlus aria-hidden="true" /> <span>Register</span></NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;