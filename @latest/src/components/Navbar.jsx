import { Link, NavLink } from "react-router-dom";
import "../styles/Navbar.css"
import { useCart } from "../store/CartContext";
function Navbar() {
  const {cart} = useCart()
  const cartCount = cart.reduce((total,item) => total + item.quantity,0)

  return (
    <>
      <header className="navbar" >
        <Link className="navbar-brand" to="/" >Shop </Link>
        <nav className="navbar-links" aria-label="Main navigation" >
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/orders" >Orders</NavLink>
          <NavLink to="/cart">Cart ({cartCount}) </NavLink>
        </nav>
        
      </header>
    </>
  );
}

export default Navbar;