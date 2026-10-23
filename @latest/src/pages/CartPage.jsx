import { useCart } from "../store/CartContext";

function CartPage(){
    const {cart, removeFromCart, decreaseQuantity, increaseQuantity} = useCart();

    if(cart.length === 0){
        return <p> Cart is empty.</p>
    }
    return (
        <section>
            <h1>Cart</h1>
            {cart.map((item) =>(
                <div key={item.id} >
                    <img  src={item.img} alt={item.title} style={{width: "200px"}} />
                    <h2>{item.title}</h2>
                    <p>Price ${item.price.toFixed(2)}</p>
                    <div> <button type="button" onClick={()=>decreaseQuantity(item.id)} aria-label={`Decrease the count of ${item.title}`} >-</button> 
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => increaseQuantity(item.id)} aria-label={`Increase the count of ${item.title}`} >+</button>
                    <button type="button" onClick={()=> removeFromCart(item.id)} aria-label={`Remove item from the cart ${item.id}`}  >Remove</button>
                    </div>
                    
                </div>
                
            ))}
        </section>
    )
}

export default CartPage;