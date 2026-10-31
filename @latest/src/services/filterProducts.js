export const DEFAULT_FILTERS = { category: "all", brands: [], maxPrice: null };

export function hasActiveFilters(filters) {
  return (
    filters.category !== "all" ||
    filters.brands.length > 0 ||
    filters.maxPrice !== null
  );
}

export function filterProducts(products, filters) {
  return products.filter((product) => {
    const matchesCategory =
      filters.category === "all" || product.category === filters.category;
    const matchesBrand =
      filters.brands.length === 0 || filters.brands.includes(product.brand);
    const matchesPrice =
      filters.maxPrice === null || product.price <= filters.maxPrice;

    return matchesCategory && matchesBrand && matchesPrice;
  });
}
