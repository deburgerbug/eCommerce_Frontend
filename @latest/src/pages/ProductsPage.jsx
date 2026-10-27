import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../services/productService";
import ProductFilters from "../components/ProductFilters";
import ProductList from "../components/ProductList";
import ProductHeading from "../components/ProductHeading";
import "../styles/ProductsCatalog.css";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchTerm = searchParams.get("search") ?? "";
  const selectedCategory = searchParams.get("category") ?? "all";

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

  function handleCategoryChange(event) {
    const value = event.target.value;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value === "all") next.delete("category");
      else next.set("category", value);
      return next;
    });
  }

  function handleClearFilters() {
    setSearchParams({});
  }

  if (loading) return <p role="status">Loading products...</p>;
  if (error) return <p role="alert">Error: {error}</p>;

  return (
    <section className="products">
      <ProductHeading count={filteredProducts.length} />
      <ProductFilters
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        categories={categories}
      />
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

export default ProductsPage;