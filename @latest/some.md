
/**
 * Reusable e-commerce product card.
 * Accepts a product object or individual product props.
 */
export default function ProductCard({
	product = {},
	name,
	image,
	price,
	originalPrice,
	rating,
	badge,
	onAddToCart,
	className = '',
}) {
	const item = {
		...product,
		name: name ?? product.name ?? 'Product',
		image: image ?? product.image,
		price: price ?? product.price,
		originalPrice: originalPrice ?? product.originalPrice,
		rating: rating ?? product.rating,
		badge: badge ?? product.badge,
	};

	const formatPrice = (value) => {
		if (typeof value !== 'number') return value;
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: product.currency ?? 'USD',
		}).format(value);
	};

	return (
		<article className={`product-card ${className}`.trim()}>
			<div className="product-card__media">
				{item.image ? (
					<img
						className="product-card__image"
						src={item.image}
						alt={product.imageAlt ?? item.name}
					/>
				) : (
					<div className="product-card__placeholder" aria-hidden="true">
						No image
					</div>
				)}
				{item.badge && <span className="product-card__badge">{item.badge}</span>}
			</div>

			<div className="product-card__content">
				<h2 className="product-card__name">{item.name}</h2>
				{item.rating != null && (
					<p className="product-card__rating" aria-label={`Rated ${item.rating} out of 5`}>
						<span aria-hidden="true">★</span> {item.rating} / 5
					</p>
				)}
				<div className="product-card__prices">
					{item.price != null && (
						<span className="product-card__price">{formatPrice(item.price)}</span>
					)}
					{item.originalPrice != null && (
						<span className="product-card__original-price">
							{formatPrice(item.originalPrice)}
						</span>
					)}
				</div>
				<button
					className="product-card__button"
					type="button"
					onClick={() => onAddToCart?.(product)}
					aria-label={`Add ${item.name} to cart`}
				>
					Add to cart
				</button>
			</div>
		</article>
	);
}
