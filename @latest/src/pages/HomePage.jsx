import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../services/productService";
import "../styles/ProductsCatalog.css"
import ProductFilters from "../components/ProductFilters";
import ProductList from "../components/ProductList";
import ProductHeading from "../components/ProductHeading";
function HomePage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products],
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <p role="status">Loading products...</p>;
  }

  if (error) {
    return <p role="alert">Error: {error}</p>;
  }
  function handleClearFilters() {
    setSearchTerm("");
    setSelectedCategory("all");
  }
  return (
    <section className="products">

      <ProductHeading count={filteredProducts.length} />

      <ProductFilters searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} selectedCategory={selectedCategory}
        onCategoryChange={(e) => setSelectedCategory(e.target.value)} categories={categories} />

      {filteredProducts.length > 0 ? (
        <ProductList products={filteredProducts} />
      ) : (
        <div className="empty-state">
          <p className="empty-results">No products match your search.</p>
          <button type="button" onClick={handleClearFilters}>Clear filters</button>
        </div>
      )}
    </section>
  );
}

export default HomePage;