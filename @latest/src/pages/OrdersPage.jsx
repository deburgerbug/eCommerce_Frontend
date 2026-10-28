import { Link } from "react-router-dom"
import { useAuth } from "../store/AuthContext"
import { loadOrders } from "../services/orderService"
import "../styles/Orders.css"

function OrdersPage() {
  const { user } = useAuth()
  const orders = loadOrders(user)

  if (orders.length === 0) {
    return (
      <section>
        <h1>Orders</h1>
        <p>No orders yet.</p>
        <Link to="/">Start shopping</Link>
      </section>
    )
  }

  return (
    <section  className="orders" >
      <div className="orders-info" >
        <h1 className="orders-heading" >Orders</h1>
      </div>
      {orders.map((order) => (
        <article className="order-card" key={order.id}>
          <h2 className="orders-id" >Order #{order.id}</h2>
          <p className="order-meta">{new Date(order.date).toLocaleString()} · {order.paymentMethod}</p>
          {order.address &&(
            <p className="order-address">Ship to:{order.address.fullName}, {order.address.street} {order.address.city} - {order.address.pinCode}  </p>
          )} 
          <ul className="order-items">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.title} × {item.quantity}
              </li>
            ))}
          </ul>
          <p className="order-total">Total: ${order.total.toFixed(2)}</p>
        </article>
      ))}
    </section>
  )
}

export default OrdersPage