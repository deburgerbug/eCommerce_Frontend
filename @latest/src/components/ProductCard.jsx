import { Link } from "react-router-dom";
import { useWishlist } from "../store/WishlistContext";
import { FaHeart, FaRegHeart} from "react-icons/fa"
import "../styles/ProductCard.css"

function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const saved = isInWishlist(product.id)

  return (
    <article className="product-card">
      <button type="button" className="product-card-wish" onClick={() => toggleWishlist(product)} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={saved}>
        {saved ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" /> }
      </button>
      <Link className="product-card-link" to={`/products/${product.id}`}>
        <img src={product.thumbnail} alt={product.title} loading="lazy" />
        <div className="product-card-content">
          <span className="product-category">{product.category.replaceAll("-", " ")}</span>
          <h2>{product.title}</h2>
          <span className="product-price">${product.price.toFixed(2)}</span>
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;