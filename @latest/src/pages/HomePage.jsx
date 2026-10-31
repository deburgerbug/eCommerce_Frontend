import { useEffect, useMemo, useState } from "react";
import CategoryCarousel from "../components/CategoryCarousel";
import ProductList from "../components/ProductList";
import { getProducts } from "../services/productService";
import HeroSlider from "../components/HeroSlider";
import "../styles/ProductsCatalog.css";
import SidebarFilter from "../components/SidebarFilter";
function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setProducts(await getProducts());
      } catch (err) {
        setError(err.message || "Unable to load products.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const categoriesByName = new Map();

    for (const product of products) {
      const existing = categoriesByName.get(product.category);

      if (existing) {
        existing.count += 1;
      } else {
        categoriesByName.set(product.category, {
          name: product.category,
          label: product.category.replaceAll("-", " "),
          count: 1,
          image: product.thumbnail,
        });
      }
    }

    return [...categoriesByName.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [products]);

  const popularProducts = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating).slice(0, 12),
    [products],
  );

  if (loading) return <p role="status">Loading products...</p>;
  if (error) return <p role="alert">Error: {error}</p>;

  return (
    <section className="products">
      <HeroSlider />

      <CategoryCarousel
        categories={categories}
        productCount={products.length}
        allImage={products[0]?.thumbnail}
      />
      <div className="home-layout" >
        <SidebarFilter products={products} ></SidebarFilter>
        <section aria-labelledby="popular-products-heading">
          <div className="home-layout">
          </div>

          <ProductList products={popularProducts} />
        </section>
      </div>

    </section>
  );
}

export default HomePage; 