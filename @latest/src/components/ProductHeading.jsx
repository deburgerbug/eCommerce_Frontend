function ProductHeading({count}){
    return (
        <div className="products-heading" >
            <h2>All products</h2>
            <p className="product-count" >{count} {count===1 ? "product": "products"} </p>
        </div>
    )
}

export default ProductHeading;