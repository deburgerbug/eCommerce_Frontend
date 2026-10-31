import { useState } from "react";
import { DEFAULT_FILTERS, filterProducts,  } from "../services/filterProducts";
import "../styles/sidebarFilter.css"

const VISIBLE_BRANDS = 7;
const QUICK_PRICES = [10, 50, 100, 200]
function countBy(products, field){
  const counts = new Map()

  for(const product of products){
    const value = product[field]
    if(!value) continue;
    counts.set(value, counts.get(value ?? 0) + 1)
  }
  return [counts.entries()].map((name, count) => ({name, count}))
}

function keepSelected(list, selectedNames) {
  const result = [...list];

  for (const name of selectedNames) {
    if (!result.some((item) => item.name === name)) {
      result.push({ name, count: 0 });
    }
  }
  return result;

}

function SidebarFilter({ products = [], appliedFilters=DEFAULT_FILTERS, onApply }) {


  const[draft, setDraft] = useState(appliedFilters)
  const[showAllBrands, setShowAllBrands] = useState(false)

  const productsForCategories = filterProducts(products, { ...draft, category: "all"})
  const productsForBrands = filterProducts(products, { ...draft, brand:[]})

  const categories = keepSelected(
    countBy(productsForCategories, "category"),
    draft.category === "all" ? [] : [draft.category],
  ).sort((a, b) => a.name.localeCompare(b.name));

  const brands = keepSelected(
    countBy(productsForBrands, "brand"),
    draft.brands,
  ).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));


  const maxProductPrice = Math.ceil(
    Math.max(0, ...products.map((product) => product.price)),
  );
  const sliderValue = draft.maxPrice ?? maxProductPrice

  const visibleBrands = showAllBrands ? brands : brands.slice(0, VISIBLE_BRANDS);

  function selectCategory(category) {
    setDraft({ ...draft, category });
  }

  function toggleBrand(brand) {
    const brands = draft.brands.includes(brand)
      ? draft.brands.filter((name) => name !== brand)
      : [...draft.brands, brand];

    setDraft({ ...draft, brands });
  }


  function changePrice(value) {
    setDraft({ ...draft, maxPrice: value >= maxProductPrice ? null : value });
  }

  function handleClear() {
    setDraft(DEFAULT_FILTERS);
  }

  function handleApply() {
    onApply(draft); 
  }

  return (
    <aside className="sidebar" aria-label="Product filters">
      <div className="sidebar-header">
        <h2>Filters</h2>
        <button type="button" className="sidebar-clear" onClick={handleClear}>
          Clear all
        </button>
      </div>

      <div className="sidebar-body">
        <section aria-labelledby="sidebar-categories-heading">
          <h3 id="sidebar-categories-heading">Categories</h3>
          <ul className="sidebar-categories">
            <li>
              <button
                type="button"
                className={`sidebar-category ${draft.category === "all" ? "is-active" : ""}`}
                onClick={() => selectCategory("all")}
              >
                <span className="sidebar-category-name">All products</span>
                <span className="sidebar-count">{productsForCategories.length}</span>
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.name}>
                <button
                  type="button"
                  className={`sidebar-category ${draft.category === category.name ? "is-active" : ""}`}
                  onClick={() => selectCategory(category.name)}
                >
                  <span className="sidebar-category-name">
                    {category.name.replaceAll("-", " ")}
                  </span>
                  <span className="sidebar-count">{category.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <fieldset className="sidebar-section sidebar-fieldset">
          <legend>Brands</legend>
          {visibleBrands.map((brand) => (
            <label key={brand.name} className="sidebar-brand">
              <input
                type="checkbox"
                checked={draft.brands.includes(brand.name)}
                onChange={() => toggleBrand(brand.name)}
              />
              <span className="sidebar-brand-name">{brand.name}</span>
              <span className="sidebar-count">{brand.count}</span>
            </label>
          ))}
          {brands.length > VISIBLE_BRANDS && (
            <button
              type="button"
              className="sidebar-clear"
              onClick={() => setShowAllBrands(!showAllBrands)}
            >
              {showAllBrands ? "Show fewer" : `Show all ${brands.length} brands`}
            </button>
          )}
        </fieldset>

        <section className="sidebar-section" aria-labelledby="sidebar-price-heading">
          <h3 id="sidebar-price-heading">Price</h3>
          <label className="sidebar-price-label">
            <span>
              {draft.maxPrice === null ? "Any price" : `Up to $${draft.maxPrice}`}
            </span>
            <input type="range" min="0" max={maxProductPrice} step="1" value={sliderValue} onChange={(event) => changePrice(Number(event.target.value))}/>
          </label>
          <div className="sidebar-quick-prices">
            {QUICK_PRICES.map((price) => (
              <button key={price} type="button" className={`sidebar-quick ${draft.maxPrice === price ? "is-active" : ""}`} onClick={() => changePrice(price)}> Under ${price}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-apply" onClick={handleApply}>
          Apply filters
        </button>
      </div>
    </aside>
  );
}
export default SidebarFilter;
