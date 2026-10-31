# Sidebar Filter: How It Was Built (start to end)

Goal: a sidebar filter like the reference screenshot (Category with counts, Brand checkboxes with counts, Price chips plus slider), working on both Home and Products, without breaking navbar search.

Verified with `vite build` and a headless-browser run: category, brand, price chip, slider, navbar search combined with filters, empty state, clear filters, mobile panel.

---

## 1. Read the screenshot as a spec

The picture is four things:

1. A card titled Filters (with a Clear all when something is active).
2. Category: a scrollable list. Each row is a name plus a count. One row is highlighted. "All Products" is on top. Single choice.
3. Brand: a scrollable list of checkboxes, each with a count. Multiple choice.
4. Price: quick range chips, plus a slider with a min label ($0) on the left and the current max in bold on the right.

Two details separate a real filter from a toy:
- Counts are not static. They must change as other filters change.
- The lists scroll inside the card, so the sidebar never gets taller than the screen.

## 2. Decisions made before writing code

### Decision A: where does filter state live? In the URL.
Options: `useState` in the page, a FilterContext, or URL search params.

Chosen: URL search params (`?category=laptops&brand=Apple&brand=Nova&min=25&max=100&search=phone`).

Why:
- Shareable: a shopper can send a filtered view to a friend.
- Back button works.
- Refresh keeps filters.
- Your navbar search and category links already write to the URL (`?search=`, `?category=`). Using the URL means they combine with the sidebar for free. With `useState`, you would have two sources of truth to keep in sync.
- Home and Products need the same filters. The URL is the one place both can read.

Rule to remember: if two parts of the screen need the same data and it can be expressed as a string, the URL is the cheapest shared state.

### Decision B: what does the sidebar do on Home?
Home does not show a full product list, only a few popular products. Filtering that list in place would be confusing (12 items, mostly hidden).

Chosen: on Home, picking a filter navigates to `/products` with the filter applied. The sidebar behaves identically everywhere because it always does the same thing: write to the URL and go to `/products`.

Rejected: filter the Home list in place. It needs a second code path and has no good empty state.

### Decision C: counts per option
Each facet's count answers: "if I click this, how many results would I get, given all my other filters?"
- Category counts ignore the category filter, apply the rest.
- Brand counts ignore the brand filter, apply the rest.

This is why counts change when you pick a price chip or type in search.

### Decision D: zero-count options are hidden
An option with 0 results is not shown, so users cannot click into an empty page. Exception: a currently selected option stays visible at 0, so the user can un-select it. Alternative was greying them out; hiding keeps lists short.

### Decision E: filtering logic is plain functions, not React
`utils/filterProducts.js` has no hooks. Pure functions are easy to read, easy to test, and keep components small.

### Decision F: one wrapper for the layout
`CatalogLayout` renders sidebar plus content and owns the mobile open/close state. Home and Products both wrap their content in it. The sidebar exists once.

---

## 3. Build order (the order I actually worked in)

### Step 1: Define the filter object
Everything revolves around one shape:

```js
{ search: "phone", category: "laptops", brands: ["Apple", "Nova"], min: 25, max: 100 }
```
Defaults: `search: ""`, `category: "all"`, `brands: []`, `min: null`, `max: null`. `null` means "no limit".

### Step 2: URL to object, and object to URL
- `parseFilters(searchParams)` reads the URL into the object above. `getAll("brand")` handles repeated `brand=` params. Numbers are validated, so `?max=abc` becomes `null` instead of crashing.
- `buildSearchParams(filters)` writes the object back, omitting defaults so URLs stay short.

These two functions are the only place that knows the URL format.

### Step 3: One matching function
`matches(product, filters, ignore)` returns true or false. It checks search, category, brands, min, max. The `ignore` argument lets a facet skip its own filter. `applyFilters` is just `products.filter(matches)`.

### Step 4: Facets (the counts)
`getFacets(products, filters)` loops over products once, and for each product:
- if it matches everything except category, count it into that category (and into the All Products total);
- if it matches everything except brand, count it into that brand.

Then `toSortedList` turns the maps into sorted arrays and force-includes the selected option at 0 if needed.

### Step 5: The sidebar component
`SidebarFilter` takes `products` and renders. It owns no filter state: it reads the URL (`useSearchParams` then `parseFilters`), and every control calls one function:

```js
function update(changes) {
  const next = { ...filters, ...changes };
  navigate({ pathname: "/products", search: buildSearchParams(next).toString() },
           { replace: pathname === "/products" });
}
```
- `replace` on the Products page: dragging the slider would otherwise push dozens of history entries.
- On Home it pushes, so Back returns to Home.

Controls:
- Category button: `update({ category: name })`
- Brand checkbox: `toggleBrand` adds or removes the name in `brands`
- Chip: sets `min` and `max`; clicking the active chip clears them
- Slider: sets `max`; at the very top it sets `null` ("no limit")
- Clear all: resets category, brands, min, max (search is kept, it belongs to the navbar)

`useMemo` is used for `filters` and `facets` so counts recompute only when the URL or products change. The hooks are all called before the early `return null` (hooks must not be called conditionally).

### Step 6: CatalogLayout
Two-column grid: 17rem sidebar, flexible content. The sidebar is `position: sticky` under the navbar. On screens under 900px, the sidebar is hidden and a Filters button (with an active-filter badge) toggles it open above the content.

### Step 7: Wire Products
`ProductsPage` now does: `parseFilters` then `applyFilters` (memoized), computes `hasAnyFilter`, renders toolbar, list or empty state, and wraps it all in `<CatalogLayout>`. The old category `<select>` (`ProductFilters.jsx`) is gone; the sidebar replaces it.

`ProductList` is keyed on `searchParams.toString()` so "Show more" resets whenever any filter changes.

### Step 8: Wire Home
Home renders the hero, then `<CatalogLayout>` containing the category carousel and popular products. No filtering code lives in Home.

### Step 9: CSS
- Card, section dividers, uppercase muted headings like the screenshot.
- `max-height: 13rem; overflow-y: auto` on the Category and Brand lists, so they scroll inside the card.
- Active category: soft blue pill. Chips: pills that turn blue when active.
- `accent-color` colours the checkbox and slider in the brand colour with one line.

### Step 10: Test, including the awkward cases
Checked by script: category click from Home navigates and filters; brand checkbox narrows; Clear all resets; price chip changes category counts; navbar search plus sidebar combine; selecting a combination with 0 results shows the empty state and the selected category stays visible at 0; the empty-state button clears everything including search; slider moves the max and label; mobile panel hidden by default and opens on click; no horizontal overflow; no console errors.

---

## 4. Data flow: one click, every hop

User ticks the Apple checkbox:

1. `onChange` calls `toggleBrand("Apple")`.
2. `toggleBrand` builds a new `brands` array and calls `update({ brands })`.
3. `update` merges into the current filters and calls `buildSearchParams`.
4. `navigate` changes the URL to `/products?...&brand=Apple`.
5. React Router updates `useSearchParams`, so every component reading it re-renders.
6. `ProductsPage`: `parseFilters`, then `applyFilters`, then a new product list.
7. `SidebarFilter`: `parseFilters`, then `getFacets`, then new counts, and the checkbox renders checked because `filters.brands` includes it.

There is no "sync step". The URL is the single source of truth, and both the list and the sidebar are derived from it.

## 5. Edge cases and what happens

| Case | Behaviour |
|---|---|
| Filters produce 0 products | Empty state with "Clear filters"; selected options stay visible at 0 so they can be undone |
| Navbar search plus sidebar filter | Both apply; sidebar counts reflect the search |
| Product has no brand (e.g. groceries) | Not listed in Brand; still matches when no brand is selected |
| `?max=abc` or `?min=` in the URL | Parsed as `null` (no limit), no crash |
| Slider dragged to the very top | `max` is removed from the URL (no limit) |
| Chip sets min 25, slider dragged | Slider's lower bound is the min, so max can never go below min |
| Selected category disappears from counts | Kept at 0 so the user can deselect it |
| Brand name with a comma or space | Repeated `brand=` params, URL-encoded, so no splitting problems |
| Filter changes while on page 3 of "Show more" | List is keyed on the URL, so it resets to the first 24 |
| Mobile | Filters button with active-count badge toggles the panel |
| Products still loading or failed | Sidebar renders nothing until products exist |

## 6. Tradeoffs you can revisit later

- Slider scale: it is linear. Real data (DummyJSON) has a few very expensive items, so most products sit at the far left of the slider. Chips cover the common ranges. A square-root or log scale would fix this.
- Currency: the screenshot uses rupees; your data is USD, so ranges and labels use `formatPrice` (USD). Change `PRICE_RANGES` and `formatPrice` together if you change currency.
- Brand search box: with 100+ brands the list scrolls. A small search input above it would help.
- Multi-select categories: currently single choice, like the screenshot.

## 7. What this teaches about thinking in React

When you were stuck ("I cannot think of a way to write it"), this is the order of questions that produced the solution:

1. What is the smallest object that describes what the user chose? (the filters object)
2. Where does it already live, or where should it live so more than one component can read it? (URL)
3. What is derived from it? (filtered list, counts, which option is highlighted). Derived values are computed, never stored.
4. What are the user actions? (each one changes one field of the object)
5. Which parts are pure logic, and which are screen? (utils vs components)

Nothing in the feature needed `useEffect`. If you reach for an effect to "sync" two pieces of state, that is usually a sign one of them should be derived.

---

## 8. Files

Replace or add exactly these. Delete `src/components/ProductFilters.jsx` (no longer used).

| File | Status |
|---|---|
| `src/utils/filterProducts.js` | NEW |
| `src/components/SidebarFilter.jsx` | REPLACED (your unfinished version) |
| `src/components/CatalogLayout.jsx` | NEW |
| `src/pages/ProductsPage.jsx` | REPLACED |
| `src/pages/HomePage.jsx` | REPLACED |
| `src/styles/sidebarFilter.css` | REPLACED |
| `src/styles/CatalogLayout.css` | NEW |
| `src/styles/ProductsCatalog.css` | REPLACED (old `.products-filters` rules removed) |
| `src/components/ProductFilters.jsx` | DELETE |

### `src/utils/filterProducts.js` (NEW)

All filtering logic. No React. `parseFilters` and `buildSearchParams` translate between URL and filter object, `matches`/`applyFilters` filter products, `getFacets` produces counts for each sidebar section.

```js
// Pure helpers for the sidebar filter. No React in here, so they are easy to read and test.

// URL -> filter object
export function parseFilters(params) {
  const readNumber = (key) => {
    const raw = params.get(key);
    if (raw === null || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  return {
    search: (params.get("search") ?? "").trim(),
    category: params.get("category") ?? "all",
    brands: params.getAll("brand"),
    min: readNumber("min"),
    max: readNumber("max"),
  };
}

// filter object -> URL
export function buildSearchParams(filters) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category !== "all") params.set("category", filters.category);
  for (const brand of filters.brands) params.append("brand", brand);
  if (filters.min !== null) params.set("min", String(filters.min));
  if (filters.max !== null) params.set("max", String(filters.max));

  return params;
}

// `ignore` lets a facet skip its own filter, so its counts show "what if I changed this one".
function matches(product, filters, ignore) {
  if (filters.search && !product.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
  if (ignore !== "category" && filters.category !== "all" && product.category !== filters.category) return false;
  if (ignore !== "brand" && filters.brands.length > 0 && !filters.brands.includes(product.brand)) return false;
  if (filters.min !== null && product.price < filters.min) return false;
  if (filters.max !== null && product.price > filters.max) return false;
  return true;
}

export function applyFilters(products, filters) {
  return products.filter((product) => matches(product, filters, null));
}

export function countActiveFilters(filters) {
  const hasPrice = filters.min !== null || filters.max !== null;
  return (filters.category !== "all" ? 1 : 0) + filters.brands.length + (hasPrice ? 1 : 0);
}

function toSortedList(counts, selected) {
  // A selected option stays visible even when its count drops to 0, so the user can un-select it.
  for (const name of selected) {
    if (!counts.has(name)) counts.set(name, 0);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getFacets(products, filters) {
  const categoryCounts = new Map();
  const brandCounts = new Map();
  let total = 0;

  for (const product of products) {
    if (matches(product, filters, "category")) {
      categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);
      total += 1;
    }
    if (product.brand && matches(product, filters, "brand")) {
      brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
    }
  }

  return {
    total,
    categories: toSortedList(categoryCounts, filters.category === "all" ? [] : [filters.category]),
    brands: toSortedList(brandCounts, filters.brands),
  };
}
```

### `src/components/SidebarFilter.jsx` (REPLACED)

The sidebar UI. Reads filters from the URL, renders Category, Brand and Price, and sends every change through one `update()` function that navigates to `/products` with new params.

```jsx
import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { buildSearchParams, countActiveFilters, getFacets, parseFilters } from "../utils/filterProducts";
import { formatCategory, formatPrice } from "../utils/format";
import "../styles/sidebarFilter.css";

const PRICE_RANGES = [
  { label: "Under $25", min: null, max: 25 },
  { label: "$25 - $100", min: 25, max: 100 },
  { label: "$100 - $500", min: 100, max: 500 },
  { label: "Above $500", min: 500, max: null },
];

function SidebarFilter({ products = [] }) {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const facets = useMemo(() => getFacets(products, filters), [products, filters]);
  const priceCeiling = useMemo(
    () => (products.length ? Math.ceil(Math.max(...products.map((product) => product.price))) : 0),
    [products],
  );

  if (products.length === 0) return null;

  const activeCount = countActiveFilters(filters);
  const sliderValue = Math.min(filters.max ?? priceCeiling, priceCeiling);

  // Single write path: every control calls this. The URL is the state.
  function update(changes) {
    const next = { ...filters, ...changes };
    navigate(
      { pathname: "/products", search: buildSearchParams(next).toString() },
      { replace: pathname === "/products" },
    );
  }

  function toggleBrand(brand) {
    const brands = filters.brands.includes(brand)
      ? filters.brands.filter((name) => name !== brand)
      : [...filters.brands, brand];
    update({ brands });
  }

  function togglePriceRange(range) {
    const isActive = filters.min === range.min && filters.max === range.max;
    update(isActive ? { min: null, max: null } : { min: range.min, max: range.max });
  }

  function handleSlider(event) {
    const value = Number(event.target.value);
    update({ max: value >= priceCeiling ? null : value });
  }

  return (
    <div className="sidebar-filter card">
      <div className="sidebar-filter-header">
        <h2>Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            className="sidebar-filter-reset"
            onClick={() => update({ category: "all", brands: [], min: null, max: null })}
          >
            Clear all
          </button>
        )}
      </div>

      <section className="sidebar-filter-section" aria-labelledby="filter-category">
        <h3 id="filter-category">Category</h3>
        <ul className="sidebar-filter-list">
          <li>
            <button
              type="button"
              className={`sidebar-filter-option ${filters.category === "all" ? "is-active" : ""}`}
              aria-pressed={filters.category === "all"}
              onClick={() => update({ category: "all" })}
            >
              <span>All Products</span>
              <span className="sidebar-filter-count">{facets.total}</span>
            </button>
          </li>
          {facets.categories.map((category) => (
            <li key={category.name}>
              <button
                type="button"
                className={`sidebar-filter-option ${filters.category === category.name ? "is-active" : ""}`}
                aria-pressed={filters.category === category.name}
                onClick={() => update({ category: category.name })}
              >
                <span>{formatCategory(category.name)}</span>
                <span className="sidebar-filter-count">{category.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {facets.brands.length > 0 && (
        <section className="sidebar-filter-section" aria-labelledby="filter-brand">
          <h3 id="filter-brand">Brand</h3>
          <ul className="sidebar-filter-list">
            {facets.brands.map((brand) => (
              <li key={brand.name}>
                <label className="sidebar-filter-option sidebar-filter-check">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand.name)}
                    onChange={() => toggleBrand(brand.name)}
                  />
                  <span>{brand.name}</span>
                  <span className="sidebar-filter-count">{brand.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sidebar-filter-section" aria-labelledby="filter-price">
        <h3 id="filter-price">Price</h3>
        <div className="sidebar-filter-chips">
          {PRICE_RANGES.map((range) => {
            const isActive = filters.min === range.min && filters.max === range.max;
            return (
              <button
                key={range.label}
                type="button"
                className={`sidebar-filter-chip ${isActive ? "is-active" : ""}`}
                aria-pressed={isActive}
                onClick={() => togglePriceRange(range)}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        <input
          className="sidebar-filter-slider"
          type="range"
          aria-label="Maximum price"
          min={filters.min ?? 0}
          max={priceCeiling}
          step="1"
          value={sliderValue}
          onChange={handleSlider}
        />
        <div className="sidebar-filter-range">
          <span>{formatPrice(filters.min ?? 0)}</span>
          <strong>{formatPrice(sliderValue)}</strong>
        </div>
      </section>
    </div>
  );
}

export default SidebarFilter;
```

### `src/components/CatalogLayout.jsx` (NEW)

Sidebar plus content wrapper used by Home and Products. Owns only the mobile open/close state.

```jsx
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSliders } from "react-icons/fi";
import { useProducts } from "../store/ProductsContext";
import SidebarFilter from "./SidebarFilter";
import { countActiveFilters, parseFilters } from "../utils/filterProducts";
import "../styles/CatalogLayout.css";

// Sidebar + content. Home and Products both wrap their content in this, so the filter exists once.
function CatalogLayout({ children }) {
  const { products } = useProducts();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = useMemo(() => countActiveFilters(parseFilters(searchParams)), [searchParams]);

  return (
    <div className="catalog-layout">
      <button
        type="button"
        className="btn btn-outline catalog-filter-toggle"
        aria-expanded={isOpen}
        aria-controls="catalog-sidebar"
        onClick={() => setIsOpen((open) => !open)}
      >
        <FiSliders aria-hidden="true" />
        Filters
        {activeCount > 0 && <span className="catalog-filter-badge">{activeCount}</span>}
      </button>

      <aside id="catalog-sidebar" className={`catalog-sidebar ${isOpen ? "is-open" : ""}`} aria-label="Product filters">
        <SidebarFilter products={products} />
      </aside>

      <div className="catalog-content">{children}</div>
    </div>
  );
}

export default CatalogLayout;
```

### `src/pages/ProductsPage.jsx` (REPLACED)

Parses filters from the URL, applies them, renders heading, clear button, list or empty state inside `CatalogLayout`.

```jsx
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { useProducts } from "../store/ProductsContext";
import CatalogLayout from "../components/CatalogLayout";
import ProductHeading from "../components/ProductHeading";
import ProductList from "../components/ProductList";
import { Loader, ErrorState, EmptyState } from "../components/PageStatus";
import { applyFilters, parseFilters } from "../utils/filterProducts";
import { formatCategory } from "../utils/format";
import "../styles/ProductsCatalog.css";

const PAGE_SIZE = 24;

function ProductsPage() {
  const { products, loading, error, retry } = useProducts();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const filteredProducts = useMemo(() => applyFilters(products, filters), [products, filters]);

  const hasAnyFilter =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.brands.length > 0 ||
    filters.min !== null ||
    filters.max !== null;

  function clearEverything() {
    navigate("/products", { replace: true });
  }

  let title = "All products";
  if (filters.search) title = `Results for “${filters.search}”`;
  else if (filters.category !== "all") title = formatCategory(filters.category);

  let content;
  if (loading) {
    content = <Loader label="Loading products…" />;
  } else if (error) {
    content = <ErrorState message={error} onRetry={retry} />;
  } else {
    content = (
      <>
        <div className="catalog-toolbar">
          <ProductHeading title={title} count={filteredProducts.length} />
          {hasAnyFilter && (
            <button type="button" className="btn btn-ghost" onClick={clearEverything}>
              Clear filters
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <ProductList key={searchParams.toString()} products={filteredProducts} pageSize={PAGE_SIZE} />
        ) : (
          <EmptyState
            icon={FiSearch}
            title="No products found"
            text="Try a different search term or clear the filters."
            actionLabel="Clear filters"
            onAction={clearEverything}
          />
        )}
      </>
    );
  }

  return <CatalogLayout>{content}</CatalogLayout>;
}

export default ProductsPage;
```

### `src/pages/HomePage.jsx` (REPLACED)

Hero, then `CatalogLayout` wrapping the carousel and popular products. No filtering logic.

```jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../store/ProductsContext";
import HeroSlider from "../components/HeroSlider";
import CatalogLayout from "../components/CatalogLayout";
import CategoryCarousel from "../components/CategoryCarousel";
import SectionHeader from "../components/SectionHeader";
import ProductList from "../components/ProductList";
import { Loader, ErrorState } from "../components/PageStatus";
import { STORE_NAME } from "../constants";
import "../styles/ProductsCatalog.css";

function HomePage() {
  const { products, categories, loading, error, retry } = useProducts();

  const popularProducts = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating).slice(0, 12),
    [products],
  );

  return (
    <>
      <h1 className="visually-hidden">{STORE_NAME}</h1>
      <HeroSlider />

      <CatalogLayout>
        {loading && <Loader label="Loading products…" />}
        {error && <ErrorState message={error} onRetry={retry} />}

        {!loading && !error && (
          <>
            <CategoryCarousel
              categories={categories}
              productCount={products.length}
              allImage={products[0]?.thumbnail}
            />

            <section className="section" aria-labelledby="popular-heading">
              <SectionHeader id="popular-heading" title="Popular products">
                <Link to="/products">View all</Link>
              </SectionHeader>
              <ProductList products={popularProducts} />
            </section>
          </>
        )}
      </CatalogLayout>
    </>
  );
}

export default HomePage;
```

### `src/styles/sidebarFilter.css` (REPLACED)

Card, sections, scrollable lists, chips, slider styles.

```css
.sidebar-filter {
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
}

.sidebar-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sidebar-filter-header h2 {
  font-size: 1.1rem;
}

.sidebar-filter-reset {
  padding: 0;
  background: none;
  border: 0;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 600;
}

.sidebar-filter-reset:hover {
  text-decoration: underline;
}

.sidebar-filter-section {
  display: grid;
  gap: 0.6rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

.sidebar-filter-section h3 {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Long lists scroll inside the card instead of making the sidebar taller than the screen. */
.sidebar-filter-list {
  display: grid;
  gap: 0.15rem;
  max-height: 13rem;
  overflow-y: auto;
  scrollbar-width: thin;
}

.sidebar-filter-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.5rem 0.65rem;
  background: none;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
}

.sidebar-filter-option:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.sidebar-filter-option.is-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

.sidebar-filter-option > span:first-of-type {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-filter-count {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.sidebar-filter-option.is-active .sidebar-filter-count {
  color: inherit;
}

.sidebar-filter-check input {
  width: 1rem;
  height: 1rem;
  margin: 0;
  accent-color: var(--color-primary);
}

.sidebar-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.sidebar-filter-chip {
  padding: 0.3rem 0.7rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 500;
}

.sidebar-filter-chip:hover {
  background: var(--color-surface-muted);
}

.sidebar-filter-chip.is-active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.sidebar-filter-slider {
  width: 100%;
  margin: 0.5rem 0 0;
  accent-color: var(--color-primary);
}

.sidebar-filter-range {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.sidebar-filter-range strong {
  color: var(--color-text);
}
```

### `src/styles/CatalogLayout.css` (NEW)

Two-column grid, sticky sidebar, mobile collapsible panel.

```css
.catalog-layout {
  display: grid;
  grid-template-columns: 17rem minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

/* On Home the hero sits above the layout, so give it the usual section gap. */
.hero-slider + .catalog-layout {
  margin-top: var(--space-section);
}

.catalog-content > .section:first-child {
  margin-top: 0;
}

.catalog-sidebar {
  position: sticky;
  top: calc(var(--navbar-height) + 1rem);
}

.catalog-filter-toggle {
  display: none;
}

.catalog-filter-badge {
  display: grid;
  place-items: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.3rem;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
  color: #fff;
  font-size: 0.72rem;
}

/* Tablet + mobile: sidebar becomes a collapsible panel above the content. */
@media (max-width: 900px) {
  .catalog-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }

  .catalog-filter-toggle {
    display: inline-flex;
    justify-self: start;
  }

  .catalog-sidebar {
    position: static;
    display: none;
  }

  .catalog-sidebar.is-open {
    display: block;
  }
}
```

### `src/styles/ProductsCatalog.css` (REPLACED)

Same as before minus the removed dropdown filter rules.

```css
.products-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.products-more {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.catalog-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.products-heading {
  display: grid;
  gap: 0.25rem;
}

.product-count {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

@media (max-width: 560px) {
  .products-grid {
    gap: 0.75rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

---

## 9. Manual test checklist

1. Home: click a category in the sidebar. You land on `/products` filtered; the heading shows the category.
2. Tick two brands. List narrows; counts in Category change.
3. Click a price chip, then click it again (it should clear).
4. Drag the slider; the bold max label follows; drag fully right to remove the limit.
5. Type in the navbar search while filters are active. Both apply.
6. Pick a combination with no results. Empty state appears; Clear filters resets everything.
7. Copy the URL, open it in a new tab: same filtered view.
8. From Home, apply a filter, then press Back: you return to Home (the first filter pushes one history entry). Further filter changes on Products replace that entry, so Back does not step through every click.
9. Resize under 900px: Filters button appears with a badge when filters are active.
