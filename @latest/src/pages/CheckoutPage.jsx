import { useState } from "react"
import { Link } from "react-router-dom"
import { useCart } from "../store/CartContext"
import { useAuth } from "../store/AuthContext"
import { saveOrder } from "../services/orderService.js"
import "../styles/Checkout.css"
const PAYMENT_METHODS = [
  { id: 1, label: "UPI", summary: "Pay using any UPI" },
  { id: 2, label: "Card", summary: "Pay with any Card" },
  { id: 3, label: "Netbanking", summary: "Use Netbanking" },
]

function createOrder(items, total, paymentMethod, address) {
  return {
    id: Date.now(),
    date: new Date().toISOString(),
    items,
    total,
    paymentMethod,
    address
  }
}

function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id)
  const [placed, setPlaced] = useState(false)
  const [address, setAddress] = useState({ fullName: "", phone: "", city: "", street: "", pinCode: "", })
  const { user } = useAuth()
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function handlePlaceOrder(e) {
    e.preventDefault()
    const order = createOrder(cart, total, PAYMENT_METHODS.find((m) => m.id === method).label, address)
    saveOrder(user, order)
    setPlaced(true)
    clearCart()
  }

  function handleAddressChange(e) {
    const { name, value } = e.target

    setAddress((current) => ({ ...current, [name]: value }))
  }
  if (placed) {
    return (
      <section>
        <h1>Order placed</h1>
        <p>Thank you for your purchase.</p>
        <Link to="/orders">View orders</Link>
      </section>
    )
  }

  if (cart.length === 0) {
    return (
      <section>
        <h1>Your cart is empty</h1>
        <Link to="/">Back to products</Link>
      </section>
    )
  }

  return (
    <section className="checkout">
      <Link to="/" className="checkout-back">Back to products</Link>
      <h1>Checkout</h1>

      <div className="checkout-layout">
      <aside className="checkout-summary">
      <h2>Order summary</h2>
      <ul>
        {cart.map((item) => (
          <li key={item.id}>
            {item.title} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}
          </li>
        ))}
      </ul>
      <p className="checkout-total">Total: ${total.toFixed(2)}</p>
      </aside>

      <form className="checkout-form" onSubmit={handlePlaceOrder}>
        <h2>Shipping address</h2>
        <label>Name<input type="text" name="fullName" required value={address.fullName} onChange={handleAddressChange} /></label>
        <label>Phone<input type="tel" name="phone" required value={address.phone} onChange={handleAddressChange} /></label>
        <label>City<input type="text" name="city" required value={address.city} onChange={handleAddressChange} /></label>
        <label>Street<input type="text" name="street" required value={address.street} onChange={handleAddressChange} /></label>
        <label>Pin-Code<input type="text" name="pinCode" required inputMode="numeric" value={address.pinCode} onChange={handleAddressChange} /></label>
        <h2>Payment method</h2>
        {PAYMENT_METHODS.map((m) => (

          <label key={m.id} className="checkout-payment"> <input type="radio" name="payment" checked={method === m.id} onChange={() => setMethod(m.id)} />
            {m.label} — {m.summary}
          </label>
          
        ))}
        <button type="submit" className="checkout-submit">Place order</button>
      </form>
      </div>
    </section>
  )
}

export default CheckoutPage