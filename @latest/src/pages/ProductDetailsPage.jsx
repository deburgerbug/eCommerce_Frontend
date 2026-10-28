import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getProductById } from "../services/productService";
import { useCart } from "../store/CartContext";
import { useWishlist } from "../store/WishlistContext";
import { FiShoppingCart } from "react-icons/fi"
import { FaHeart, FaRegHeart } from "react-icons/fa"
import "../styles/ProductDetails.css"
function ProductDetailsPage() {
  const [product, setProduct] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [cartMessage, setCartMessage] = useState("");
  const { id } = useParams();

  const { isInWishlist, toggleWishlist } = useWishlist()
  function handleAddToCart() {
    const added = addToCart(product);
    setCartMessage(added ? `${product.title} added to cart` : `Only ${product.stock} in stock`)
  }
  const { addToCart, cart } = useCart()
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError("")
      try {
        setProduct(await getProductById((id)))
      } catch (err) {
        setError(err.message || "Unable to load product")
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  if (loading) return <p role="status" >Loading Product...</p>
  if (error) return <p role="alert">Error: {error} </p>
  if (!product) return <p>No product </p>
  const cartItem = cart.find((item) => item.id === product.id)
  return (
    <>
      <section className="details" >
        <Link to="/" className="details-back" > Back </Link>
        <div className="product-details-layout" >
          <div className="details-media">
            <button
              type="button"
              className={`details-wish-button ${isInWishlist(product.id) ? "is-saved" : ""}`}
              onClick={() => toggleWishlist(product)}
              aria-label={isInWishlist(product.id) ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
              aria-pressed={isInWishlist(product.id)}
            >
              {isInWishlist(product.id) ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
            </button>
            <img className="product-details-image" src={product.thumbnail} alt={product.title} />
          </div>
          <div className="details-summary">
            <p className="details-category">{product.category}</p>
            <h1>{product.title} </h1>
            {product.brand && (
              <p className="details-brand" > by {product.brand}</p>
            )}
            <p className="details-price"> ${product.price.toFixed(2)} </p>
            <p>{product.description} </p>
            <p>In Stock: {product.stock} </p>
            <div className="details-actions">
              <button type="button" className="btn-primary" onClick={handleAddToCart}
                disabled={product.stock === 0 || (cartItem?.quantity ?? 0) >= product.stock}>
                <FiShoppingCart aria-hidden="true" />
                {product.stock === 0 ? "Out of stock" : "Add to cart"}
              </button>
            </div>
            {cartItem && (
              <Link to="/cart" >View cart ({cartItem.quantity})</Link>
            )}
            {cartMessage && <p role="status" >{cartMessage}</p>}
          </div>
        </div>
        <section className="details-info">
          <h2 id="details-info-title" >Product Information </h2>
          <dl>
            <div>
              <dt>Rating</dt>
              <dd>{product.rating} / 5 </dd>
            </div>

            {product.sku && (
              <div>
                <dt>SKU</dt>
                <dd>{product.sku}</dd>
              </div>
            )}
            {product.warrantyInformation && (
              <div>
                <dt>WARRANTY</dt>
                <dd>{product.warrantyInformation} </dd>
              </div>
            )}
            {product.shippingInformation && (
              <div>
                <dt>SHIPPING</dt>
                <dd>{product.shippingInformation}</dd>
              </div>
            )}
            {product.returnPolicy && (
              <div>
                <dt>RETURN POLICY</dt>
                <dd>{product.returnPolicy}</dd>
              </div>
            )}
          </dl>
        </section>
        {product.reviews?.length > 0 && (
          <section className="details-reviews" >
            <h2 id="review-title" >Reviews</h2>

            {product.reviews.map((review, index) => (
              <article key={`${review.reviewerEmail} -${review.date} - ${index}`}>
                <h3>{review.reviewerName}</h3>
                <p>{review.rating}</p>
                <p>{review.comment}</p>
              </article>
            ))}
          </section>
        )}
      </section>
    </>
  );
}

export default ProductDetailsPage;
