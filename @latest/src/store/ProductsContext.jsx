import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProducts } from "../services/productService";

const ProductsContext = createContext(null);

function buildCategories(products) {
  const byName = new Map();

  for (const product of products) {
    const existing = byName.get(product.category);

    if (existing) {
      existing.count += 1;
    } else {
      byName.set(product.category, {
        name: product.category,
        count: 1,
        image: product.thumbnail,
      });
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    getProducts()
      .then((data) => {
        if (ignore) return;
        setProducts(data);
        setError("");
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Unable to load products.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [attempt]);

  const categories = useMemo(() => buildCategories(products), [products]);

  function retry() {
    setLoading(true);
    setError("");
    setAttempt((count) => count + 1);
  }

  return (
    <ProductsContext.Provider value={{ products, categories, loading, error, retry }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);

  if (context === null) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }

  return context;
}
