import { useCart } from "../store/CartContext";
import { Link } from "react-router-dom"
import { FiPlus, FiMinus, FiTrash2 } from "react-icons/fi"
import "../styles/Cart.css"
function CartPage() {
    const { cart, removeFromCart, decreaseQuantity, increaseQuantity } = useCart();

    const cartTotal = cart.reduce(
        (total, item) => total + item.price * item.quantity, 0);
    if (cart.length === 0) {
        return <p> Cart is empty.</p>
    }
    return (
        <section className="cart" >
            <h1> Cart</h1>
            <div className="cart-items">
                {cart.map((item) => (
                    <article className="cart-item" key={item.id}>
                        <img src={item.thumbnail} alt={item.title} />
                        <div className="cart-item-info" >
                            <h2>{item.title}</h2>
                            <p>{item.price.toFixed(2)}</p>
                            <p>Quantity: {item.quantity}</p>
                        </div>

                        <div className="cart-item-actions">
                            <button type="button" className="icon-btn" aria-label={`Decrease quantity of ${item.title}`}
                                onClick={() => decreaseQuantity(item.id)}>
                                <FiMinus aria-hidden="true" />
                            </button>
                            <span className="cart-qty">{item.quantity}</span>
                            <button type="button" className="icon-btn" aria-label={`Increase quantity of ${item.title}`}
                                onClick={() => increaseQuantity(item.id)} disabled={item.quantity >= item.stock}>
                                <FiPlus aria-hidden="true" />
                            </button>
                            <button type="button" className="icon-btn icon-btn-danger" aria-label={`Remove ${item.title}`}
                                onClick={() => removeFromCart(item.id)}>
                                <FiTrash2 aria-hidden="true" />
                            </button>
                        </div>
                    </article>
                ))}
            </div>
            <p className="cart-total">Total: ${cartTotal.toFixed(2)}</p>
            <Link to="/checkout" >Proceed to checkout</Link>
        </section>
    )
}

export default CartPage;