import { Link } from "react-router-dom"
import { useWishlist } from "../store/WishlistContext"
import { useCart } from "../store/CartContext"
import { FiShoppingCart, FiTrash2 } from "react-icons/fi"
import "../styles/wishlist.css"

function WishListPage() {
  const { wishlist, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (wishlist.length === 0) {
    return (
      <section>
        <h1>Your wishlist is empty</h1>
        <Link to="/">Browse products</Link>
      </section>
    )
  }

  return (
    <section className="wishlist">
      <h1>Wishlist ({wishlist.length})</h1>
      <div className="wishlist-items">
        {wishlist.map((item) => (
          <article className="wishlist-item" key={item.id}>
            <img src={item.thumbnail} alt={item.title} />
            <div className="wishlist-item-info">
              <Link to={`/products/${item.id}`}>{item.title}</Link>
              <span>${item.price.toFixed(2)}</span>
            </div>
            <div className="wishlist-item-actions">
              <button type="button" className="wishlist-add" onClick={() => addToCart(item)}
                disabled={item.stock === 0}>
                <FiShoppingCart aria-hidden="true" />
                <span>{item.stock === 0 ? "Out of stock" : "Add to cart"}</span>
              </button>
              <button type="button" className="icon-btn icon-btn-danger"
                aria-label={`Remove ${item.title} from wishlist`}
                onClick={() => toggleWishlist(item)}>
                <FiTrash2 aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default WishListPage