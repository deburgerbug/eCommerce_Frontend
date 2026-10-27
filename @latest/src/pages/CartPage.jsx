import { useCart } from "../store/CartContext";
import "../styles/Cart.css"
function CartPage(){
    const {cart, removeFromCart, decreaseQuantity, increaseQuantity} = useCart();

    const cartTotal = cart.reduce(
        (total, item) => total + item.price * item.quantity, 0);
    if(cart.length === 0){
        return <p> Cart is empty.</p>
    }
    return (
        <section className="cart" >
            <h1> Cart</h1>
            <div className="cart-items">
                {cart.map((item) =>(
                    <article className="cart-item" key={item.id}>
                        <img  src={item.thumbnail} alt={item.title} />
                        <div className="cart-item-info" >
                            <h2>{item.title}</h2>
                            <p>{item.price.toFixed(2)}</p>
                            <p>Quantity: {item.quantity}</p>
                        </div>

                        <div className="cart-item-actions" >
                            <button type="button" onClick={()=>decreaseQuantity(item.id)}> - </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={()=>increaseQuantity(item.id)} disabled={item.quantity >= item.stock} > + </button>
                            <button type="button"  onClick={() =>removeFromCart(item.id)} >Remove</button>
                        </div>
                    </article>
                ))}
            </div>
            <p className="cart-total">Total: ${cartTotal.toFixed(2)}</p>
        </section>
    )
}

export default CartPage;