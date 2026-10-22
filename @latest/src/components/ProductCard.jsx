import { Link } from "react-router-dom";
import "../styles/ProductCard.css"
function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/products/${product.id}`}>
      <img src={product.thumbnail} alt={product.title} loading="lazy" />
      <div className="product-card-content">
        <span className="product-category">
          {product.category.replaceAll("-", " ")}
        </span>
        <h2>{product.title}</h2>
        <span className="product-price">
          ${product.price.toFixed(2)}
        </span>
      </div>
    </Link>
  );
}

export default ProductCard;