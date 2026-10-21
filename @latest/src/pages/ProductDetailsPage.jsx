import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getProductById } from "../services/productService";

function ProductDetailsPage() {
  const [product, setProduct] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const { id } = useParams();

  useEffect(() =>{
    async function loadProduct(){
      setLoading(true);
      setError("")
        try{
          setProduct(await getProductById((id)))
        }catch(err){
          setError(err.message || "Unable to load product")
        }finally{
          setLoading(false)
        }
    }
   loadProduct()
  },[id])

  if(loading) return <p role="status" >Loading Product...</p>
  if(error) return <p role="alert">Error: {error} </p>
  if(!product) return <p>No product, Ngl</p>

  return (
    <section>
      <Link to="/" >Back to products</Link>
      <img src={product.thumbnail} alt={product.title} />
      <p>{product.category} </p>
      <h1>{product.title} </h1>
      <p>{product.description} </p>
      <p>{product.price.toFixed(2)} </p>
      <p>Rating: {product.rating} </p>
      <p>In Stock: {product.stock} </p>
    </section>
  ); 
}

export default ProductDetailsPage;
