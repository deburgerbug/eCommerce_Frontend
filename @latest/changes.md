# BhikarChot Store: UI Polish Changelog

Scope: React-only frontend polish. No config, package.json or service files were changed. Verified with `vite build` and a headless-browser walkthrough (register, add to cart, checkout, order, wishlist, mobile) with zero console errors.

## Goals applied
- Width: one `.container` rule, `min(94%, 1480px)` (92% on phones), used by navbar, main and footer.
- One design system: tokens in `index.css`, one button system, one form system, shared status components.
- Consistent formatting: prices, categories and dates come from `utils/format.js`.
- Simple and clean: no extra libraries, no animations beyond hover and the slider.

## Bugs found and fixed
1. Login/Register imported `Navbar.css`; the `.auth*` classes existed nowhere, so both forms were unstyled. Now `Auth.css`.
2. `index.css` was imported last and had no reset, leaving an 8px default body margin. Now imported first and holds tokens.
3. Saved-heart `is-saved` class was never applied on cards.
4. Stray `)` rendered after the description on the details page.
5. `aria-level="polite"` should have been `aria-live`.
6. Cart prices had no `$`; every page formatted prices differently.
7. Navbar brand said "Shop", Footer said "BhikarChot Store".
8. Blue and green accents were mixed.
9. `.details-summary button` turned quantity icon buttons blue/green.
10. `allImage={products[1100]}` was out of range, so All products had no image.
11. Carousel marked All products active on Home and `overflow: hidden` blocked touch swipe.
12. Home and Products duplicated one fetch; every navigation refetched all products.
13. Home section had `aria-labelledby` pointing at an id that did not exist.
14. SidebarFilter was mounted on Home but renders nothing useful (`.map` callback uses braces without `return`; sorts arrays with `.name`). Detached from Home; file untouched.

## Not changed, but you should know
The cart is keyed per user and the guest cart is not merged on login. Flow: guest adds items, clicks Proceed to checkout, is redirected to login, comes back to an empty cart. This is logic, not UI, so it was left alone.

Lint: remaining errors are only in the Cart, Wishlist and Auth contexts and pre-date this work (`set-state-in-effect`, `only-export-components`). `ProductsContext` follows your existing provider-plus-hook convention.

## Manual cleanup
- Delete `src/styles/wishlist.css` (wishlist page now reuses ProductCard).
- Delete `src/components/Banner.jsx` (dead file importing nonexistent `.img` assets).
- Optional: `npm uninstall react-feather dotenv`.
- In `index.html`, change `<title>react-practice</title>` to your store name.
- Untouched: services/*, AuthContext, CartContext, WishlistContext, ProtectedRoute, SidebarFilter.jsx, sidebarFilter.css, assets.

## Files
NEW = file did not exist. CHANGED = replace the whole file.

### `src/constants.js` (NEW)

Store name and tagline were hardcoded in two places and disagreed (Navbar said "Shop", Footer said "BhikarChot Store"). Navbar and Footer now import these, so the name changes in one place.

```js
export const STORE_NAME = "BhikarChot Store";
export const STORE_TAGLINE = "Fresh Products on Click";
```

### `src/utils/format.js` (NEW)

Prices were formatted differently in every component (`$` in some, none in cart). `formatPrice` gives one currency format, `formatCategory` turns `home-decor` into `Home Decor` (CSS `capitalize` does not work inside `<option>`), `formatDate` formats order and review dates.

```js
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatPrice(value) {
  return priceFormatter.format(value ?? 0);
}

export function formatCategory(slug = "") {
  return slug.replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
```

### `src/store/ProductsContext.jsx` (NEW)

Home and Products each fetched all products on every mount, causing a loading flash on each navigation. Products are now fetched once and shared. Category list with counts and thumbnails is derived here once. The `ignore` flag prevents a stale response overwriting state (StrictMode runs effects twice). `retry` powers the Try again button. `useProducts` throws if used outside the provider.

```jsx
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
```

### `src/components/ScrollToTop.jsx` (NEW)

Without it, opening a product from the bottom of a list lands mid-page. Depends on `pathname` only, so typing in search does not scroll the page.

```jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
```

### `src/components/SectionHeader.jsx` (NEW)

One heading style for page sections. `children` slot holds a View all link or carousel arrows.

```jsx
function SectionHeader({ id, title, children }) {
  return (
    <div className="section-header">
      <h2 id={id}>{title}</h2>
      {children}
    </div>
  );
}

export default SectionHeader;
```

### `src/components/Rating.jsx` (NEW)

Ratings were inconsistent (bare number in reviews, absent on cards). One component with star icon and accessible label, used on cards, details and reviews.

```jsx
import { FaStar } from "react-icons/fa";

function Rating({ value = 0, count }) {
  return (
    <span className="rating" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <FaStar aria-hidden="true" />
      <span>{value.toFixed(1)}</span>
      {count !== undefined && <span className="rating-count">({count})</span>}
    </span>
  );
}

export default Rating;
```

### `src/components/PageStatus.jsx` (NEW)

Loading, error and empty states were different bare `<p>` tags per page. Now: `Loader` (spinner), `ErrorState` (message + retry), `EmptyState` (icon, text, link or button action). Used by Home, Products, Details, Cart, Wishlist, Orders, Checkout.

```jsx
import { Link } from "react-router-dom";
import "../styles/PageStatus.css";

export function Loader({ label = "Loading…" }) {
  return (
    <div className="status" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="status status-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, actionLabel, to, onAction }) {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-state-icon" aria-hidden="true" />}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {actionLabel &&
        (to ? (
          <Link to={to} className="btn btn-primary">{actionLabel}</Link>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        ))}
    </div>
  );
}
```

### `src/components/QuantityStepper.jsx` (NEW)

The +/- control was written twice (details, cart) with different markup. One component; `+` disables at stock via `max`.

```jsx
import { FiMinus, FiPlus } from "react-icons/fi";

function QuantityStepper({ quantity, max = Infinity, label, onDecrease, onIncrease }) {
  return (
    <div className="stepper" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" className="icon-btn" aria-label={`Decrease quantity of ${label}`} onClick={onDecrease}>
        <FiMinus aria-hidden="true" />
      </button>
      <span className="stepper-value" aria-live="polite">{quantity}</span>
      <button type="button" className="icon-btn" aria-label={`Increase quantity of ${label}`} onClick={onIncrease} disabled={quantity >= max}>
        <FiPlus aria-hidden="true" />
      </button>
    </div>
  );
}

export default QuantityStepper;
```

### `src/main.jsx` (CHANGED)

`index.css` is imported first because it defines the CSS variables and reset every other file uses (it was imported last before). `Forms.css` added to the global imports.

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/Layout.css";
import "./styles/Buttons.css";
import "./styles/Forms.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### `src/App.jsx` (CHANGED)

`ProductsProvider` wraps the app. `ScrollToTop` added inside the router. `<main>` gets `page container` so navbar, content and footer share one width. Routes grouped: public, then protected.

```jsx
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./store/AuthContext";
import { CartProvider } from "./store/CartContext";
import { WishlistProvider } from "./store/WishlistContext";
import { ProductsProvider } from "./store/ProductsContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import WishListPage from "./pages/WishListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="page container">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <ProductsProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="home" element={<Navigate to="/" replace />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/:id" element={<ProductDetailsPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="wishlist" element={<WishListPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ProductsProvider>
  );
}

export default App;
```

### `src/components/Navbar.jsx` (CHANGED)

Layout is brand, search, links, auth, wishlist/cart icons. Badges hide at 0 (previously always showed 0) and cap at 99+. Wishlist and cart stay visible on mobile; only links collapse into the menu. Icon-only tooltips replaced by visible labels. Search wrapped in `role="search"` form. "Shop" replaced by shared store name. Auth buttons use shared `.btn` classes. Escape closes the mobile menu.

```jsx
import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { FiHome, FiGrid, FiPackage, FiHeart, FiShoppingCart, FiSearch, FiUser, FiMenu, FiX } from "react-icons/fi";
import { useCart } from "../store/CartContext";
import { useAuth } from "../store/AuthContext";
import { useWishlist } from "../store/WishlistContext";
import { STORE_NAME } from "../constants";
import "../styles/Navbar.css";

function CountBadge({ count }) {
  if (count === 0) return null;
  return <span className="navbar-badge" aria-hidden="true">{count > 99 ? "99+" : count}</span>;
}

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const searchTerm = searchParams.get("search") ?? "";

  function handleSearchChange(event) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams);

    if (value) params.set("search", value);
    else params.delete("search");

    navigate({ pathname: "/products", search: params.toString() }, { replace: true });
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>
          <span className="navbar-logo" aria-hidden="true">B</span>
          <span>{STORE_NAME}</span>
        </Link>

        <form className="navbar-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search products"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </form>

        <div
          id="primary-navigation"
          className={`navbar-menu ${isMenuOpen ? "is-open" : ""}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeMenu();
          }}
        >
          <nav className="navbar-links" aria-label="Main navigation">
            <NavLink to="/" end className="navbar-link" onClick={closeMenu}>
              <FiHome aria-hidden="true" /> Home
            </NavLink>
            <NavLink to="/products" className="navbar-link" onClick={closeMenu}>
              <FiGrid aria-hidden="true" /> Products
            </NavLink>
            <NavLink to="/orders" className="navbar-link" onClick={closeMenu}>
              <FiPackage aria-hidden="true" /> Orders
            </NavLink>
          </nav>

          <div className="navbar-auth">
            {user ? (
              <>
                <span className="navbar-user">
                  <FiUser aria-hidden="true" /> {user.name.split(" ")[0]}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="navbar-link" onClick={closeMenu}>Login</NavLink>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>Register</Link>
              </>
            )}
          </div>
        </div>

        <div className="navbar-actions">
          <NavLink to="/wishlist" className="navbar-icon-link" aria-label={`Wishlist, ${wishlist.length} items`}>
            <FiHeart aria-hidden="true" />
            <CountBadge count={wishlist.length} />
          </NavLink>
          <NavLink to="/cart" className="navbar-icon-link" aria-label={`Cart, ${cartCount} items`}>
            <FiShoppingCart aria-hidden="true" />
            <CountBadge count={cartCount} />
          </NavLink>
        </div>

        <button
          type="button"
          className="navbar-menu-toggle"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
```

### `src/components/Footer.jsx` (CHANGED)

Uses shared constants. Account column adapts to login state (Login/Register when logged out, Orders when logged in). Columns array built inside the component because it depends on `user`. Copyright bar uses the shared container width.

```jsx
import { Link } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { STORE_NAME, STORE_TAGLINE } from "../constants";
import "../styles/Footer.css";

function Footer() {
  const { user } = useAuth();

  const columns = [
    {
      title: "Shop",
      links: [
        { label: "All products", to: "/products" },
        { label: "Cart", to: "/cart" },
        { label: "Wishlist", to: "/wishlist" },
      ],
    },
    {
      title: "Account",
      links: user
        ? [{ label: "Orders", to: "/orders" }]
        : [
            { label: "Login", to: "/login" },
            { label: "Register", to: "/register" },
          ],
    },
  ];

  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <h2>{STORE_NAME}</h2>
          <p>{STORE_TAGLINE}</p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3>{column.title}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
```

### `src/components/ProductCard.jsx` (CHANGED)

Added Add to cart button (becomes `In cart (n)`, disables at stock or when out of stock). Added rating. `is-saved` class is now actually applied (it never was, so the saved heart did not change colour). Category formatted, price via `formatPrice`. Title is `h3` (cards sit under `h2` sections). Price and button are in a footer outside the link so no button is nested inside an anchor.

```jsx
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FiCheck, FiShoppingCart } from "react-icons/fi";
import { useWishlist } from "../store/WishlistContext";
import { useCart } from "../store/CartContext";
import { formatCategory, formatPrice } from "../utils/format";
import Rating from "./Rating";
import "../styles/ProductCard.css";

function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { cart, addToCart } = useCart();

  const saved = isInWishlist(product.id);
  const inCart = cart.find((item) => item.id === product.id)?.quantity ?? 0;
  const soldOut = product.stock === 0;
  const atLimit = inCart >= product.stock;

  return (
    <article className="product-card">
      <button
        type="button"
        className={`product-card-wish ${saved ? "is-saved" : ""}`}
        onClick={() => toggleWishlist(product)}
        aria-label={saved ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
        aria-pressed={saved}
      >
        {saved ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
      </button>

      <Link className="product-card-link" to={`/products/${product.id}`}>
        <img className="product-card-image" src={product.thumbnail} alt={product.title} loading="lazy" />
        <div className="product-card-body">
          <span className="product-card-category">{formatCategory(product.category)}</span>
          <h3 className="product-card-title">{product.title}</h3>
          {product.rating != null && <Rating value={product.rating} />}
        </div>
      </Link>

      <div className="product-card-footer">
        <span className="product-card-price">{formatPrice(product.price)}</span>
        <button
          type="button"
          className={`btn btn-sm ${inCart > 0 ? "btn-outline" : "btn-primary"}`}
          onClick={() => addToCart(product)}
          disabled={soldOut || atLimit}
        >
          {soldOut ? (
            "Out of stock"
          ) : inCart > 0 ? (
            <><FiCheck aria-hidden="true" /> In cart ({inCart})</>
          ) : (
            <><FiShoppingCart aria-hidden="true" /> Add to cart</>
          )}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
```

### `src/components/ProductList.jsx` (CHANGED)

Optional `pageSize` adds a Show more (n left) button. Products page renders 24 at a time instead of ~194. Home and Wishlist show everything (`pageSize` defaults to `Infinity`).

```jsx
import { useState } from "react";
import ProductCard from "./ProductCard";

function ProductList({ products, pageSize = Infinity }) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const visibleProducts = products.slice(0, visibleCount);
  const remaining = products.length - visibleProducts.length;

  return (
    <>
      <div className="products-grid">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="products-more">
          <button type="button" className="btn btn-outline" onClick={() => setVisibleCount((count) => count + pageSize)}>
            Show more ({remaining} left)
          </button>
        </div>
      )}
    </>
  );
}

export default ProductList;
```

### `src/components/ProductHeading.jsx` (CHANGED)

Takes a `title` prop (was hardcoded) and renders `h1`. Your CSS targeted `h1` but the markup was `h2`, and the page had no `h1`.

```jsx
function ProductHeading({ title, count }) {
  return (
    <div className="products-heading">
      <h1>{title}</h1>
      <p className="product-count">
        {count} {count === 1 ? "product" : "products"}
      </p>
    </div>
  );
}

export default ProductHeading;
```

### `src/components/ProductFilters.jsx` (CHANGED)

Select uses the shared `.input` style. Option labels use `formatCategory`. Clear filters button appears only when a filter or search is active.

```jsx
import { formatCategory } from "../utils/format";

function ProductFilters({ categories, selectedCategory, onCategoryChange, hasFilters, onClear }) {
  return (
    <div className="products-filters">
      <label>
        <span className="visually-hidden">Filter by category</span>
        <select className="input" value={selectedCategory} onChange={onCategoryChange}>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {formatCategory(category)}
            </option>
          ))}
        </select>
      </label>

      {hasFilters && (
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export default ProductFilters;
```

### `src/components/HeroSlider.jsx` (CHANGED)

Interval 5s (was 3s). Pauses on hover and focus. Dot buttons jump between slides. Timer is a `setTimeout` keyed on `index`, so a manual click restarts the countdown. Images decorative (`alt=""`) since the heading says the same thing. Off-screen slides get `aria-hidden` and non-focusable buttons. Button uses shared `.btn`.

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import slide1 from "../assets/slide-1.jpg";
import slide2 from "../assets/slider-2.jpg";
import "../styles/heroSlider.css";

const SLIDES = [
  { image: slide1, title: "Free Shipping on first order", text: "Great deals on anything you need", link: "/products" },
  { image: slide2, title: "Opening Sale discount on 50%", text: "Shop our popular products and save more", link: "/products" },
];

const INTERVAL_MS = 5000;

function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setIndex((current) => (current + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, paused]);

  return (
    <section
      className="hero-slider"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-slider-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((slide, slideIndex) => (
          <div className="hero-slide" key={slide.title} aria-hidden={slideIndex !== index}>
            <img src={slide.image} alt="" />
            <div className="hero-slide-content">
              <h2>{slide.title}</h2>
              <p>{slide.text}</p>
              <Link to={slide.link} className="btn btn-primary btn-lg" tabIndex={slideIndex === index ? 0 : -1}>
                Shop now
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-slider-dots">
        {SLIDES.map((slide, dotIndex) => (
          <button
            key={slide.title}
            type="button"
            className={dotIndex === index ? "is-active" : ""}
            aria-label={`Go to slide ${dotIndex + 1}`}
            aria-current={dotIndex === index}
            onClick={() => setIndex(dotIndex)}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroSlider;
```

### `src/components/CategoryCarousel.jsx` (CHANGED)

Cards are `<Link>`s (they navigate) with URL-encoded category. Fake "active" state removed (Home always highlighted All products). Title is `h2` via SectionHeader, arrows on its right, scroll by 80% of visible width. Missing image falls back to an icon. Uses react-icons instead of react-feather.

```jsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiGrid } from "react-icons/fi";
import SectionHeader from "./SectionHeader";
import { formatCategory } from "../utils/format";
import "../styles/CategoryCarousel.css";

function CategoryCarousel({ categories = [], productCount = 0, allImage = "" }) {
  const listRef = useRef(null);

  const cards = [
    { name: "all", label: "All products", count: productCount, image: allImage, to: "/products" },
    ...categories.map((category) => ({
      ...category,
      label: formatCategory(category.name),
      to: `/products?category=${encodeURIComponent(category.name)}`,
    })),
  ];

  function scroll(direction) {
    const list = listRef.current;
    list.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="section" aria-labelledby="categories-heading">
      <SectionHeader id="categories-heading" title="Shop by category">
        <div className="category-carousel-controls">
          <button type="button" className="icon-btn" aria-label="Scroll categories left" onClick={() => scroll(-1)}>
            <FiChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" aria-label="Scroll categories right" onClick={() => scroll(1)}>
            <FiChevronRight aria-hidden="true" />
          </button>
        </div>
      </SectionHeader>

      <div className="category-carousel-list" ref={listRef}>
        {cards.map((card) => (
          <Link key={card.name} to={card.to} className="category-card">
            <span className="category-card-media">
              {card.image ? <img src={card.image} alt="" loading="lazy" /> : <FiGrid aria-hidden="true" />}
            </span>
            <span className="category-card-name">{card.label}</span>
            <span className="category-card-count">{card.count} products</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategoryCarousel;
```

### `src/pages/HomePage.jsx` (CHANGED)

Fetch and category logic removed; reads from context. Hero renders immediately, only product sections wait for data. SidebarFilter removed from Home (it rendered nothing useful; that task is yours). Hidden `h1` gives the page a heading. Popular products has a visible heading and View all link. `allImage` bug fixed (`products[1100]` was out of range).

```jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../store/ProductsContext";
import HeroSlider from "../components/HeroSlider";
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
    </>
  );
}

export default HomePage;
```

### `src/pages/ProductsPage.jsx` (CHANGED)

Data from context, filtering memoized. Heading reflects state (Results for ..., category name, or All products). Heading and filter in one toolbar. Grid paginates 24 at a time and is keyed on filters so Show more resets when filters change. Empty state has icon and a clear button.

```jsx
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { useProducts } from "../store/ProductsContext";
import ProductHeading from "../components/ProductHeading";
import ProductFilters from "../components/ProductFilters";
import ProductList from "../components/ProductList";
import { Loader, ErrorState, EmptyState } from "../components/PageStatus";
import { formatCategory } from "../utils/format";
import "../styles/ProductsCatalog.css";

const PAGE_SIZE = 24;

function ProductsPage() {
  const { products, categories, loading, error, retry } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = (searchParams.get("search") ?? "").trim();
  const selectedCategory = searchParams.get("category") ?? "all";
  const hasFilters = searchTerm !== "" || selectedCategory !== "all";

  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return products.filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

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

  if (loading) return <Loader label="Loading products…" />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  let title = "All products";
  if (searchTerm) title = `Results for “${searchTerm}”`;
  else if (selectedCategory !== "all") title = formatCategory(selectedCategory);

  return (
    <section>
      <div className="catalog-toolbar">
        <ProductHeading title={title} count={filteredProducts.length} />
        <ProductFilters
          categories={categories.map((category) => category.name)}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          hasFilters={hasFilters}
          onClear={handleClearFilters}
        />
      </div>

      {filteredProducts.length > 0 ? (
        <ProductList
          key={`${selectedCategory}|${searchTerm}`}
          products={filteredProducts}
          pageSize={PAGE_SIZE}
        />
      ) : (
        <EmptyState
          icon={FiSearch}
          title="No products found"
          text="Try a different search term or clear the filters."
          actionLabel="Clear filters"
          onAction={handleClearFilters}
        />
      )}
    </section>
  );
}

export default ProductsPage;
```

### `src/pages/ProductDetailsPage.jsx` (CHANGED)

Breadcrumb replaces bare Back link. Thumbnails switch the main image. Stock status (In stock / Only n left / Out of stock), rating with review count, wishlist button beside Add to cart. Info labels consistent (were mixed `SKU` / `WARRANTY`). Reviews show stars and dates. Stray `)` after description removed; `aria-level="polite"` fixed. Loading is derived (`result.id !== id`) with no synchronous setState in the effect. `ProductDetails` is keyed on `product.id` so gallery state resets between products.

```jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiShoppingCart } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { getProductById } from "../services/productService";
import { useCart } from "../store/CartContext";
import { useWishlist } from "../store/WishlistContext";
import QuantityStepper from "../components/QuantityStepper";
import Rating from "../components/Rating";
import { Loader, ErrorState } from "../components/PageStatus";
import { formatCategory, formatDate, formatPrice } from "../utils/format";
import "../styles/ProductDetails.css";

function StockLabel({ stock }) {
  if (stock === 0) return <span className="stock stock-out">Out of stock</span>;
  if (stock <= 10) return <span className="stock stock-low">Only {stock} left</span>;
  return <span className="stock stock-in">In stock</span>;
}

function ProductDetails({ product }) {
  const [activeImage, setActiveImage] = useState(0);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, cart, increaseQuantity, decreaseQuantity } = useCart();

  const saved = isInWishlist(product.id);
  const cartItem = cart.find((item) => item.id === product.id);
  const soldOut = product.stock === 0;
  const images = product.images?.length ? product.images : [product.thumbnail];
  const mainImage = images[activeImage] ?? images[0];

  const info = [
    ["SKU", product.sku],
    ["Warranty", product.warrantyInformation],
    ["Shipping", product.shippingInformation],
    ["Return policy", product.returnPolicy],
  ].filter(([, value]) => value);

  return (
    <article className="details">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/products">Products</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
          {formatCategory(product.category)}
        </Link>
      </nav>

      <div className="product-details-layout">
        <div className="details-gallery">
          <div className="details-media">
            <img className="product-details-image" src={mainImage} alt={product.title} />
          </div>
          {images.length > 1 && (
            <div className="details-thumbs">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={`details-thumb ${index === activeImage ? "is-active" : ""}`}
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === activeImage}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="details-summary">
          <p className="details-category">{formatCategory(product.category)}</p>
          <h1 className="details-title">{product.title}</h1>
          {product.brand && <p className="details-brand">by {product.brand}</p>}
          {product.rating != null && <Rating value={product.rating} count={product.reviews?.length} />}
          <p className="details-price">{formatPrice(product.price)}</p>
          <p className="details-description">{product.description}</p>
          <StockLabel stock={product.stock} />

          <div className="details-actions">
            {cartItem ? (
              <>
                <QuantityStepper
                  quantity={cartItem.quantity}
                  max={product.stock}
                  label={product.title}
                  onDecrease={() => decreaseQuantity(product.id)}
                  onIncrease={() => increaseQuantity(product.id)}
                />
                <Link to="/cart" className="btn btn-primary btn-lg">View cart</Link>
              </>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={() => addToCart(product)} disabled={soldOut}>
                <FiShoppingCart aria-hidden="true" />
                {soldOut ? "Out of stock" : "Add to cart"}
              </button>
            )}

            <button
              type="button"
              className={`btn btn-outline btn-lg ${saved ? "is-saved" : ""}`}
              onClick={() => toggleWishlist(product)}
              aria-pressed={saved}
            >
              {saved ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
              {saved ? "Saved" : "Add to wishlist"}
            </button>
          </div>
        </div>
      </div>

      <div className="details-lower">
        {info.length > 0 && (
          <section className="card" aria-labelledby="info-heading">
            <h2 id="info-heading">Product information</h2>
            <dl className="details-info">
              {info.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {product.reviews?.length > 0 && (
          <section className="card" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading">Reviews</h2>
            <div className="details-reviews">
              {product.reviews.map((review, index) => (
                <article key={`${review.reviewerEmail}-${index}`}>
                  <div className="review-head">
                    <h3>{review.reviewerName}</h3>
                    <span className="review-date">{formatDate(review.date)}</span>
                  </div>
                  <Rating value={review.rating} />
                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function ProductDetailsPage() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, product: null, error: "" });

  useEffect(() => {
    let ignore = false;

    getProductById(id)
      .then((product) => {
        if (!ignore) setResult({ id, product, error: "" });
      })
      .catch((err) => {
        if (!ignore) setResult({ id, product: null, error: err.message || "Unable to load product." });
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (result.id !== id) return <Loader label="Loading product…" />;
  if (result.error) return <ErrorState message={result.error} />;
  if (!result.product) return <ErrorState message="Product not found." />;

  return <ProductDetails key={result.product.id} product={result.product} />;
}

export default ProductDetailsPage;
```

### `src/pages/CartPage.jsx` (CHANGED)

Two-column layout: items left, sticky order summary right. Item names link to the product. Each row shows line subtotal (duplicated `Quantity:` text removed). Prices carry `$`. Empty state is a proper component.

```jsx
import { Link } from "react-router-dom";
import { FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { useCart } from "../store/CartContext";
import QuantityStepper from "../components/QuantityStepper";
import { EmptyState } from "../components/PageStatus";
import { formatCategory, formatPrice } from "../utils/format";
import "../styles/Cart.css";

function CartPage() {
  const { cart, removeFromCart, decreaseQuantity, increaseQuantity } = useCart();

  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <EmptyState
        icon={FiShoppingCart}
        title="Your cart is empty"
        text="Looks like you haven't added anything yet."
        actionLabel="Start shopping"
        to="/products"
      />
    );
  }

  return (
    <section>
      <h1 className="page-title">
        Cart <span className="page-title-count">({itemCount} {itemCount === 1 ? "item" : "items"})</span>
      </h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <article className="cart-item" key={item.id}>
              <Link to={`/products/${item.id}`} className="cart-item-image">
                <img src={item.thumbnail} alt={item.title} />
              </Link>

              <div className="cart-item-info">
                <h2><Link to={`/products/${item.id}`}>{item.title}</Link></h2>
                <p className="cart-item-category">{formatCategory(item.category)}</p>
                <p className="cart-item-price">{formatPrice(item.price)}</p>
              </div>

              <div className="cart-item-actions">
                <QuantityStepper
                  quantity={item.quantity}
                  max={item.stock}
                  label={item.title}
                  onDecrease={() => decreaseQuantity(item.id)}
                  onIncrease={() => increaseQuantity(item.id)}
                />
                <p className="cart-item-subtotal">{formatPrice(item.price * item.quantity)}</p>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => removeFromCart(item.id)}
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary card">
          <h2>Order summary</h2>
          <dl>
            <div>
              <dt>Items ({itemCount})</dt>
              <dd>{formatPrice(cartTotal)}</dd>
            </div>
            <div className="cart-summary-total">
              <dt>Total</dt>
              <dd>{formatPrice(cartTotal)}</dd>
            </div>
          </dl>
          <Link to="/checkout" className="btn btn-primary btn-lg btn-block">Proceed to checkout</Link>
          <Link to="/products" className="btn btn-ghost btn-block">Continue shopping</Link>
        </aside>
      </div>
    </section>
  );
}

export default CartPage;
```

### `src/pages/CheckoutPage.jsx` (CHANGED)

Order logic identical. Address and payment are cards in a two-column form. `autoComplete` attributes added for browser autofill. Payment options are selectable cards. Place order button lives in the summary, tied to the form with `form="checkout-form"`, so it sits beside the total on mobile too. Success and empty screens styled.

```jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiShoppingCart } from "react-icons/fi";
import { useCart } from "../store/CartContext";
import { useAuth } from "../store/AuthContext";
import { saveOrder } from "../services/orderService.js";
import { EmptyState } from "../components/PageStatus";
import { formatPrice } from "../utils/format";
import "../styles/Checkout.css";

const PAYMENT_METHODS = [
  { id: 1, label: "UPI", summary: "Pay using any UPI app" },
  { id: 2, label: "Card", summary: "Pay with any credit or debit card" },
  { id: 3, label: "Netbanking", summary: "Use your bank's netbanking" },
];

function createOrder(items, total, paymentMethod, address) {
  return {
    id: Date.now(),
    date: new Date().toISOString(),
    items,
    total,
    paymentMethod,
    address,
  };
}

function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);
  const [placed, setPlaced] = useState(false);
  const [address, setAddress] = useState({ fullName: "", phone: "", city: "", street: "", pinCode: "" });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

  function handlePlaceOrder(event) {
    event.preventDefault();
    const paymentLabel = PAYMENT_METHODS.find((m) => m.id === method).label;
    saveOrder(user, createOrder(cart, total, paymentLabel, address));
    setPlaced(true);
    clearCart();
  }

  function handleAddressChange(event) {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
  }

  if (placed) {
    return (
      <section className="checkout-done card">
        <FiCheckCircle className="checkout-done-icon" aria-hidden="true" />
        <h1>Order placed</h1>
        <p>Thank you for your purchase. You can track it from your orders.</p>
        <div className="checkout-done-actions">
          <Link to="/orders" className="btn btn-primary">View orders</Link>
          <Link to="/products" className="btn btn-outline">Continue shopping</Link>
        </div>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <EmptyState
        icon={FiShoppingCart}
        title="Your cart is empty"
        text="Add something to your cart before checking out."
        actionLabel="Browse products"
        to="/products"
      />
    );
  }

  return (
    <section>
      <h1 className="page-title">Checkout</h1>

      <div className="checkout-layout">
        <form id="checkout-form" className="checkout-form" onSubmit={handlePlaceOrder}>
          <fieldset className="card">
            <legend>Shipping address</legend>
            <div className="checkout-fields">
              <label className="field">
                Full name
                <input className="input" type="text" name="fullName" autoComplete="name" required value={address.fullName} onChange={handleAddressChange} />
              </label>
              <label className="field">
                Phone
                <input className="input" type="tel" name="phone" autoComplete="tel" required value={address.phone} onChange={handleAddressChange} />
              </label>
              <label className="field checkout-field-full">
                Street address
                <input className="input" type="text" name="street" autoComplete="street-address" required value={address.street} onChange={handleAddressChange} />
              </label>
              <label className="field">
                City
                <input className="input" type="text" name="city" autoComplete="address-level2" required value={address.city} onChange={handleAddressChange} />
              </label>
              <label className="field">
                Pin code
                <input className="input" type="text" name="pinCode" autoComplete="postal-code" inputMode="numeric" required value={address.pinCode} onChange={handleAddressChange} />
              </label>
            </div>
          </fieldset>

          <fieldset className="card">
            <legend>Payment method</legend>
            <div className="checkout-payments">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} className="payment-option">
                  <input type="radio" name="payment" checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <span className="payment-option-label">{m.label}</span>
                  <span className="payment-option-summary">{m.summary}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </form>

        <aside className="checkout-summary card">
          <h2>Order summary</h2>
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                <span>{item.title} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="checkout-total">
            <span>Total ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
            <span>{formatPrice(total)}</span>
          </p>
          <button type="submit" form="checkout-form" className="btn btn-primary btn-lg btn-block">Place order</button>
          <Link to="/cart" className="btn btn-ghost btn-block">Back to cart</Link>
        </aside>
      </div>
    </section>
  );
}

export default CheckoutPage;
```

### `src/pages/OrdersPage.jsx` (CHANGED)

Each order is a card: header (id, date and payment, total) and body (address, items with thumbnails and `qty x price`). Empty state uses shared component; prices and dates use shared formatters.

```jsx
import { FiPackage } from "react-icons/fi";
import { useAuth } from "../store/AuthContext";
import { loadOrders } from "../services/orderService";
import { EmptyState } from "../components/PageStatus";
import { formatDate, formatPrice } from "../utils/format";
import "../styles/Orders.css";

function OrdersPage() {
  const { user } = useAuth();
  const orders = loadOrders(user);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={FiPackage}
        title="No orders yet"
        text="When you place an order, it will show up here."
        actionLabel="Start shopping"
        to="/products"
      />
    );
  }

  return (
    <section>
      <h1 className="page-title">Orders</h1>

      <div className="orders">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <header className="order-card-header">
              <div>
                <h2 className="order-id">Order #{order.id}</h2>
                <p className="order-meta">{formatDate(order.date)} · {order.paymentMethod}</p>
              </div>
              <p className="order-total">{formatPrice(order.total)}</p>
            </header>

            <div className="order-card-body">
              {order.address && (
                <p className="order-address">
                  Ship to: {order.address.fullName}, {order.address.street}, {order.address.city} - {order.address.pinCode}
                </p>
              )}

              <ul className="order-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.thumbnail && <img src={item.thumbnail} alt="" />}
                    <span className="order-item-title">{item.title}</span>
                    <span className="order-item-qty">{item.quantity} × {formatPrice(item.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default OrdersPage;
```

### `src/pages/WishListPage.jsx` (CHANGED)

Reuses `ProductList`/`ProductCard`, so the wishlist behaves like the rest of the store (add to cart, rating, heart to remove). Deletes a bespoke layout and `wishlist.css`.

```jsx
import { FiHeart } from "react-icons/fi";
import { useWishlist } from "../store/WishlistContext";
import ProductList from "../components/ProductList";
import { EmptyState } from "../components/PageStatus";
import "../styles/ProductsCatalog.css";

function WishListPage() {
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon={FiHeart}
        title="Your wishlist is empty"
        text="Tap the heart on any product to save it for later."
        actionLabel="Browse products"
        to="/products"
      />
    );
  }

  return (
    <section>
      <h1 className="page-title">
        Wishlist <span className="page-title-count">({wishlist.length})</span>
      </h1>
      <ProductList products={wishlist} />
    </section>
  );
}

export default WishListPage;
```

### `src/pages/LoginPage.jsx` (CHANGED)

Imports `Auth.css` (it imported `Navbar.css`, and the `.auth*` classes existed nowhere, so the form was unstyled). Uses shared `field`, `input`, `btn`, `form-error` classes. `autoComplete` added, errors announced with `role="alert"`. Logic unchanged.

```jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import "../styles/Auth.css";

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goBackTo = location.state?.from?.pathname || "/";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(goBackTo, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <section className="auth card">
      <div>
        <h1>Log in</h1>
        <p className="auth-subtitle">Welcome back. Enter your details to continue.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          Email
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          Password
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}

export default LoginPage;
```

### `src/pages/RegisterPage.jsx` (CHANGED)

Same fixes as LoginPage. Logic and validation unchanged.

```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { validateRegistration } from "../services/authService";
import "../styles/Auth.css";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const errorMessage = validateRegistration(name, email, password);
    if (errorMessage) {
      setError(errorMessage);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <section className="auth card">
      <div>
        <h1>Create account</h1>
        <p className="auth-subtitle">Save your cart, wishlist and orders.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          Name
          <input className="input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          Email
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          Password
          <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="field">
          Confirm password
          <input className="input" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}

export default RegisterPage;
```

### `src/index.css` (CHANGED)

Design tokens and reset. Container is `min(94%, 1480px)` (92% under 560px): 90-96% width with a cap for ultra-wide screens. One blue primary replaces the green/blue mix. One radius, shadow and spacing scale. System font stack, `box-sizing: border-box`, zero default margins (body had the browser 8px margin). Global link, button and `:focus-visible` styles.

```css
/* Design tokens + base reset. Imported first in main.jsx so everything else can use these. */
:root {
  --container-width: min(94%, 1480px);

  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-soft: #eff6ff;
  --color-danger: #dc2626;
  --color-danger-soft: #fef2f2;
  --color-success: #15803d;
  --color-warning: #b45309;
  --color-star: #f59e0b;

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-md: 0 8px 24px rgb(15 23 42 / 0.1);

  --space-section: 2.5rem;
  --navbar-height: 4rem;
}

@media (max-width: 560px) {
  :root {
    --container-width: 92%;
    --space-section: 2rem;
  }
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
p,
dl,
dd,
figure {
  margin: 0;
}

h1 { font-size: 1.75rem; line-height: 1.2; }
h2 { font-size: 1.25rem; line-height: 1.3; }
h3 { font-size: 1rem; line-height: 1.4; }

ul,
ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

img {
  display: block;
  max-width: 100%;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### `src/styles/Layout.css` (CHANGED)

`.container` is the single width rule for navbar, page and footer so edges align (before: navbar 2rem padding vs page max-width 1200px). Also: page padding, section spacing, section header, `.card`, `.rating`, `.breadcrumb`, `.visually-hidden` (moved here from ProductsCatalog.css since it is global).

```css
#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* One width rule for navbar, page and footer so everything lines up. */
.container {
  width: var(--container-width);
  margin-inline: auto;
}

.page {
  flex: 1;
  padding-block: 1.5rem 3rem;
}

.section {
  margin-top: var(--space-section);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 1.4rem;
}

.page-title {
  margin-bottom: 1.25rem;
}

.page-title-count {
  color: var(--color-text-muted);
  font-size: 1.1rem;
  font-weight: 400;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.rating {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.rating svg {
  color: var(--color-star);
}

.rating-count {
  color: var(--color-text-muted);
  font-weight: 400;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.visually-hidden {
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
```

### `src/styles/Buttons.css` (CHANGED)

Buttons were styled four ways and `.details-summary button` leaked styles onto icon buttons. One system: `.btn` with `-primary`/`-outline`/`-ghost`, `-sm`/`-lg`, `-block`; `.icon-btn`, `.icon-btn-danger`; `.stepper`.

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
}

.btn:hover {
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-outline {
  background: var(--color-surface);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.btn-outline:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.btn-outline.is-saved {
  border-color: #fecaca;
  color: var(--color-danger);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.btn-sm {
  min-height: 2.25rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.875rem;
}

.btn-lg {
  min-height: 3rem;
  padding: 0.65rem 1.5rem;
  font-size: 1rem;
}

.btn-block {
  width: 100%;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
}

.icon-btn:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.icon-btn:disabled {
  opacity: 0.4;
}

.icon-btn-danger:hover:not(:disabled) {
  background: var(--color-danger-soft);
  border-color: #fecaca;
  color: var(--color-danger);
}

.stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.stepper-value {
  min-width: 2rem;
  font-weight: 600;
  text-align: center;
}
```

### `src/styles/Forms.css` (NEW)

`.field`, `.input`, `.form-error` shared by login, register, checkout and the category select.

```css
.field {
  display: grid;
  gap: 0.375rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.55rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 400;
}

.input:focus-visible {
  border-color: var(--color-primary);
  outline: 3px solid #bfdbfe;
  outline-offset: 0;
}

.form-error {
  padding: 0.65rem 0.85rem;
  background: var(--color-danger-soft);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: #b91c1c;
  font-size: 0.9rem;
}
```

### `src/styles/PageStatus.css` (NEW)

Spinner, error and empty-state styles. Spinner slows under `prefers-reduced-motion`.

```css
.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  text-align: center;
}

.status-error {
  color: #b91c1c;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 2.4s; }
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  padding: 3.5rem 1rem;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  text-align: center;
}

.empty-state-icon {
  color: var(--color-text-muted);
  font-size: 2.5rem;
}

.empty-state p {
  max-width: 28rem;
  color: var(--color-text-muted);
}
```

### `src/styles/Navbar.css` (CHANGED)

Sticky white bar aligned to the container, growing pill search, active-link pills, badges over icons. Under 1080px: brand + cart icons + menu button on row 1, search on row 2, links in a dropdown. Brand uses `flex: 1 1 0` so it shrinks with an ellipsis instead of pushing the menu button to a new row. Smaller brand text under 420px.

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.navbar-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: var(--navbar-height);
}

.navbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
  color: var(--color-text);
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.navbar-brand:hover {
  text-decoration: none;
}

.navbar-brand span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-logo {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 1rem;
}

.navbar-search {
  position: relative;
  flex: 1;
  max-width: 34rem;
}

.navbar-search svg {
  position: absolute;
  top: 50%;
  left: 0.9rem;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.navbar-search input {
  width: 100%;
  min-height: 2.5rem;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  background: var(--color-surface-muted);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-size: 0.95rem;
}

.navbar-search input:focus {
  background: var(--color-surface);
  border-color: var(--color-primary);
  outline: 3px solid #bfdbfe;
  outline-offset: 0;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.navbar-links,
.navbar-auth,
.navbar-actions {
  display: flex;
  align-items: center;
}

.navbar-links { gap: 0.25rem; }
.navbar-auth { gap: 0.5rem; }
.navbar-actions { gap: 0.25rem; }

.navbar-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 0.95rem;
  font-weight: 500;
  transition: background-color 150ms ease, color 150ms ease;
}

.navbar-link:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
  text-decoration: none;
}

.navbar-link.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.navbar-user {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-pill);
  font-size: 0.9rem;
  font-weight: 500;
}

.navbar-icon-link {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 1.3rem;
  transition: background-color 150ms ease, color 150ms ease;
}

.navbar-icon-link:hover {
  background: var(--color-surface-muted);
  text-decoration: none;
}

.navbar-icon-link.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.navbar-badge {
  position: absolute;
  top: 0.1rem;
  right: 0.05rem;
  display: grid;
  place-items: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
}

.navbar-menu-toggle {
  display: none;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: 1.25rem;
}

/* Tablet + mobile: brand, cart icons and menu button on row 1, search on row 2, links in a dropdown. */
@media (max-width: 1080px) {
  .navbar-inner {
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    padding-block: 0.6rem;
  }

  .navbar-brand { order: 1; flex: 1 1 0; min-width: 0; }
  .navbar-actions { order: 2; }
  .navbar-menu-toggle { order: 3; display: grid; }

  .navbar-search {
    order: 4;
    flex-basis: 100%;
    max-width: none;
  }

  .navbar-menu {
    order: 5;
    display: none;
    flex-basis: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    margin-left: 0;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .navbar-menu.is-open { display: flex; }

  .navbar-links { flex-direction: column; align-items: stretch; }
  .navbar-link { padding: 0.7rem 0.75rem; }

  .navbar-auth > * { flex: 1; justify-content: center; text-align: center; }
}

@media (max-width: 420px) {
  .navbar-brand { gap: 0.45rem; font-size: 1rem; }
}
```

### `src/styles/Footer.css` (CHANGED)

Matches container width. 3-column grid (wide brand column, Shop, Account), 2 columns on mobile. Small uppercase headings, hover and focus states for links.

```css
.footer {
  background: #0f172a;
  color: #cbd5e1;
  font-size: 0.95rem;
}

.footer-inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 2rem;
  padding-block: 2.5rem 2rem;
}

.footer h2 {
  margin-bottom: 0.5rem;
  color: #fff;
}

.footer h3 {
  margin-bottom: 0.9rem;
  color: #fff;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.footer ul {
  display: grid;
  gap: 0.6rem;
}

.footer a {
  color: inherit;
}

.footer a:hover {
  color: #fff;
  text-decoration: underline;
}

.footer a:focus-visible {
  outline-color: #93c5fd;
}

.footer-copy {
  padding-block: 1rem;
  border-top: 1px solid #1e293b;
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 720px) {
  .footer-inner {
    grid-template-columns: 1fr 1fr;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }
}
```

### `src/styles/ProductCard.css` (CHANGED)

Heavy green hover shadow replaced by a subtle one. Fixed square image on muted background. Title clamps to 2 lines with reserved height so cards in a row align. Footer holds price and button.

```css
.product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease;
}

.product-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.product-card-link {
  display: flex;
  flex: 1;
  flex-direction: column;
  color: inherit;
}

.product-card-link:hover {
  text-decoration: none;
}

.product-card-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 1rem;
  background: var(--color-surface-muted);
  object-fit: contain;
}

.product-card-body {
  display: grid;
  flex: 1;
  align-content: start;
  gap: 0.35rem;
  padding: 0.9rem 1rem 0.5rem;
}

.product-card-category {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.product-card-title {
  display: -webkit-box;
  min-height: 2.7em;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-card-footer {
  display: grid;
  gap: 0.6rem;
  padding: 0.25rem 1rem 1rem;
}

.product-card-price {
  font-size: 1.15rem;
  font-weight: 700;
}

.product-card-wish {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  background: var(--color-surface);
  border: 0;
  border-radius: 50%;
  box-shadow: var(--shadow-sm), 0 0 0 1px var(--color-border);
  color: var(--color-text-muted);
  transition: color 150ms ease, transform 150ms ease;
}

.product-card-wish:hover {
  color: var(--color-danger);
  transform: scale(1.08);
}

.product-card-wish.is-saved {
  color: var(--color-danger);
}
```

### `src/styles/ProductsCatalog.css` (CHANGED)

Carousel CSS moved out. Grid is `auto-fill minmax(220px, 1fr)`: column count follows width (about 6 on a wide monitor), 2 columns on phones. Toolbar and Show more styles.

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
  margin-bottom: 1.5rem;
}

.products-heading {
  display: grid;
  gap: 0.25rem;
}

.product-count {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.products-filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.products-filters select {
  width: 13rem;
  text-transform: none;
}

@media (max-width: 560px) {
  .products-grid {
    gap: 0.75rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .products-filters,
  .products-filters label,
  .products-filters select {
    width: 100%;
  }
}
```

### `src/styles/CategoryCarousel.css` (NEW)

Category card styles. List scrolls horizontally with hidden scrollbar so touch swipe works (old `overflow: hidden` blocked it) and arrows still work.

```css
.category-carousel-controls {
  display: flex;
  gap: 0.5rem;
}

.category-carousel-list {
  display: flex;
  gap: 1rem;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.category-carousel-list::-webkit-scrollbar {
  display: none;
}

.category-card {
  display: grid;
  flex: 0 0 9.5rem;
  justify-items: center;
  align-content: start;
  gap: 0.35rem;
  padding: 0.9rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-align: center;
  scroll-snap-align: start;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.category-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
}

.category-card-media {
  display: grid;
  place-items: center;
  width: 5rem;
  height: 5rem;
  margin-bottom: 0.25rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 1.75rem;
}

.category-card-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.category-card-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.category-card-count {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

@media (max-width: 560px) {
  .category-card { flex-basis: 8rem; }
}
```

### `src/styles/heroSlider.css` (CHANGED)

Height scales with width (`clamp(15rem, 30vw, 26rem)`) instead of fixed 20rem. Dot styles. Stronger white gradient on mobile so text stays readable over the photo.

```css
.hero-slider {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.hero-slider-track {
  display: flex;
  transition: transform 600ms ease;
}

.hero-slide {
  position: relative;
  flex: 0 0 100%;
  height: clamp(15rem, 30vw, 26rem);
}

.hero-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-slide::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgb(255 255 255 / 0.88), rgb(255 255 255 / 0) 70%);
  pointer-events: none;
}

.hero-slide-content {
  position: absolute;
  top: 50%;
  left: clamp(1rem, 4vw, 3.5rem);
  z-index: 1;
  display: grid;
  justify-items: start;
  gap: 0.75rem;
  max-width: 30rem;
  transform: translateY(-50%);
}

.hero-slide-content h2 {
  font-size: clamp(1.25rem, 3.2vw, 2.5rem);
  line-height: 1.15;
}

.hero-slide-content p {
  color: #334155;
  font-size: clamp(0.85rem, 1.6vw, 1.1rem);
}

.hero-slider-dots {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  z-index: 2;
  display: flex;
  gap: 0.5rem;
  transform: translateX(-50%);
}

.hero-slider-dots button {
  width: 0.65rem;
  height: 0.65rem;
  padding: 0;
  background: rgb(255 255 255 / 0.7);
  border: 1px solid rgb(15 23 42 / 0.35);
  border-radius: 50%;
  transition: background-color 150ms ease, width 150ms ease;
}

.hero-slider-dots button.is-active {
  width: 1.5rem;
  background: var(--color-primary);
  border-color: var(--color-primary);
  border-radius: var(--radius-pill);
}

@media (max-width: 600px) {
  .hero-slide::after {
    background: linear-gradient(90deg, rgb(255 255 255 / 0.92), rgb(255 255 255 / 0.55) 65%, rgb(255 255 255 / 0.1));
  }

  .hero-slide-content { max-width: 70%; gap: 0.5rem; }
  .hero-slide-content .btn-lg { min-height: 2.5rem; padding: 0.4rem 1rem; font-size: 0.9rem; }
}
```

### `src/styles/ProductDetails.css` (CHANGED)

Two-column layout with a bordered fixed-height image box. Image is `width/height: 100%; object-fit: contain` inside a flex box. Thumbnail active state. Cards for info and reviews. Stock colours from tokens. One column under 800px.

```css
.details {
  display: grid;
  gap: 1.5rem;
}

.product-details-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: start;
}

.details-gallery {
  display: grid;
  gap: 0.75rem;
}

.details-media {
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(20rem, 38vw, 34rem);
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.product-details-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.details-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.details-thumb {
  width: 4.25rem;
  height: 4.25rem;
  padding: 0.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.details-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.details-thumb:hover {
  border-color: var(--color-border-strong);
}

.details-thumb.is-active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.details-summary {
  display: grid;
  gap: 0.85rem;
  justify-items: start;
  align-content: start;
}

.details-category {
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.details-title {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
}

.details-brand {
  color: var(--color-text-muted);
}

.details-price {
  font-size: 2rem;
  font-weight: 800;
}

.details-description {
  color: #334155;
}

.stock {
  font-size: 0.9rem;
  font-weight: 600;
}

.stock-in { color: var(--color-success); }
.stock-low { color: var(--color-warning); }
.stock-out { color: var(--color-danger); }

.details-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.details-lower {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.details-lower h2 {
  margin-bottom: 0.75rem;
}

.details-info > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--color-border);
}

.details-info > div:last-child {
  border-bottom: 0;
}

.details-info dt {
  color: var(--color-text-muted);
}

.details-info dd {
  text-align: right;
}

.details-reviews {
  display: grid;
}

.details-reviews article {
  display: grid;
  gap: 0.25rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-border);
}

.details-reviews article:first-child { padding-top: 0; }
.details-reviews article:last-child { padding-bottom: 0; border-bottom: 0; }

.review-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.review-date {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

@media (max-width: 800px) {
  .product-details-layout,
  .details-lower {
    grid-template-columns: minmax(0, 1fr);
  }

  .product-details-layout { gap: 1.5rem; }
}
```

### `src/styles/Cart.css` (CHANGED)

Two-column layout with sticky summary below the navbar. Rows are cards. On mobile, row actions drop to their own line.

```css
.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22rem;
  gap: 1.5rem;
  align-items: start;
}

.cart-items {
  display: grid;
  gap: 0.75rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.cart-item-image {
  padding: 0.4rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-sm);
}

.cart-item-image img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
}

.cart-item-info {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.cart-item-info h2 {
  font-size: 1rem;
}

.cart-item-info h2 a {
  color: var(--color-text);
}

.cart-item-category {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.cart-item-price {
  font-weight: 600;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-item-subtotal {
  min-width: 5.5rem;
  font-weight: 700;
  text-align: right;
}

.cart-summary {
  position: sticky;
  top: calc(var(--navbar-height) + 1rem);
  display: grid;
  gap: 0.9rem;
}

.cart-summary dl {
  display: grid;
  gap: 0.6rem;
}

.cart-summary dl > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.cart-summary dt {
  color: var(--color-text-muted);
}

.cart-summary-total {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  font-size: 1.15rem;
  font-weight: 700;
}

.cart-summary-total dt {
  color: var(--color-text);
}

@media (max-width: 900px) {
  .cart-layout { grid-template-columns: minmax(0, 1fr); }
  .cart-summary { position: static; }
}

@media (max-width: 560px) {
  .cart-item { grid-template-columns: 4.5rem minmax(0, 1fr); }
  .cart-item-actions { grid-column: 1 / -1; justify-content: space-between; }
  .cart-item-subtotal { margin-left: auto; }
}
```

### `src/styles/Checkout.css` (CHANGED)

Form left, sticky summary right (DOM order is form first so mobile reads top to bottom). Floated `legend` keeps section titles inside the card instead of on the border. `.payment-option:has(input:checked)` highlights the chosen method. Success card styled.

```css
.checkout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24rem;
  gap: 1.5rem;
  align-items: start;
}

.checkout-form {
  display: grid;
  gap: 1.5rem;
}

.checkout-form fieldset {
  min-width: 0;
  margin: 0;
}

/* Floated legend keeps the title inside the card instead of sitting on its border. */
.checkout-form legend {
  float: left;
  width: 100%;
  margin-bottom: 1rem;
  padding: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.checkout-form legend + * {
  clear: both;
}

.checkout-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.checkout-field-full {
  grid-column: 1 / -1;
}

.checkout-payments {
  display: grid;
  gap: 0.6rem;
}

.payment-option {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.payment-option:has(input:checked) {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.payment-option-label {
  font-weight: 600;
}

.payment-option-summary {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.checkout-summary {
  position: sticky;
  top: calc(var(--navbar-height) + 1rem);
  display: grid;
  gap: 1rem;
}

.checkout-summary ul {
  display: grid;
  gap: 0.6rem;
}

.checkout-summary li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.95rem;
}

.checkout-summary li span:last-child {
  font-weight: 600;
  white-space: nowrap;
}

.checkout-total {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  font-size: 1.1rem;
  font-weight: 700;
}

.checkout-done {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 32rem;
  margin: 2rem auto;
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.checkout-done p {
  color: var(--color-text-muted);
}

.checkout-done-icon {
  color: var(--color-success);
  font-size: 3rem;
}

.checkout-done-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 900px) {
  .checkout-layout { grid-template-columns: minmax(0, 1fr); }
  .checkout-summary { position: static; }
}

@media (max-width: 560px) {
  .checkout-fields { grid-template-columns: minmax(0, 1fr); }
  .payment-option { grid-template-columns: auto 1fr; }
  .payment-option-summary { grid-column: 2; }
}
```

### `src/styles/Orders.css` (CHANGED)

Order cards with shaded header and body. Orders saved without thumbnails still lay out correctly via `:has(img)`.

```css
.orders {
  display: grid;
  gap: 1rem;
}

.order-card {
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.order-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border);
}

.order-id {
  font-size: 1.05rem;
  overflow-wrap: anywhere;
}

.order-meta {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.order-total {
  font-size: 1.15rem;
  font-weight: 700;
}

.order-card-body {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.order-address {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.order-items {
  display: grid;
  gap: 0.75rem;
}

.order-items li {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
}

.order-items li:not(:has(img)) {
  grid-template-columns: minmax(0, 1fr) auto;
}

.order-items img {
  width: 3.5rem;
  height: 3.5rem;
  padding: 0.25rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-sm);
  object-fit: contain;
}

.order-item-qty {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .order-card-body,
  .order-card-header { padding: 1rem; }
}
```

### `src/styles/Auth.css` (NEW)

Styling login and register never had: centered 26rem card.

```css
.auth {
  display: grid;
  gap: 1.25rem;
  width: min(100%, 26rem);
  margin: 2rem auto;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.auth h1 {
  font-size: 1.5rem;
}

.auth-subtitle {
  margin-top: 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.auth-form {
  display: grid;
  gap: 1rem;
}

.auth-switch {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 560px) {
  .auth { margin-block: 1rem; padding: 1.5rem; }
}
```

__________________________________________________________________________________________________________________________________________________________________________________________________________________________________


# SidebarFilter: Apply button, URL-remembered filters, sticky sidebar

## 1. What the problem is asking

| | |
|---|---|
| **Input** | Filter choices (category, brands, max price) picked in the sidebar |
| **Output** | Home: sidebar + Popular products. Products page: sidebar + products matching the applied filters |
| **Rules** | Nothing changes until **Apply** is clicked. Apply on Home redirects to `/products` and the choices are still selected there. Sidebar stays in view while products scroll. |
| **Edge cases** | Products with no brand; selected brand/category that ends up with 0 products; navbar `?search=` must survive; unknown `maxPrice` in the URL; brand names with `&` or spaces |

## 2. Solution design

Two kinds of filter state:

- **Draft**: what the user is picking right now. Lives **inside** `SidebarFilter` (`useState`).
- **Applied**: what is really filtering the products. Lives **in the URL** (`?category=..&brand=..&maxPrice=..`).

The URL is the "memory". Because Home and Products both read/write the same URL format, the filters survive the redirect, a page refresh and the back button, and there is no new context or global store.

```text
SidebarFilter:
  draft = copy of appliedFilters
  click category / brand / price  -> change draft only
  click "Clear all"               -> draft = defaults
  click "Apply"                   -> onApply(draft)       (parent decides what that means)

HomePage.onApply(filters):
  url = buildSearchParams(empty, filters)
  navigate("/products?" + url)

ProductsPage:
  filters = parseFilters(URL)
  searched = products matching navbar search
  shown    = filterProducts(searched, filters)
  onApply(filters) -> setSearchParams(buildSearchParams(current URL, filters))
```

## 3. Concepts and patterns

- **Draft vs applied state** (a "staged edit"). Reusable in any form with a Save/Apply button.
- **URL as state** (`useSearchParams`). Good when state should be shareable, bookmarkable and survive refresh. This is how real shop filters work.
- **Callback props** (`onApply`). The sidebar doesn't know where it lives; the page decides what Apply does.
- **Faceted counts**. Each group's counts ignore its own selection but respect the other groups.
- **`key` to reset a component**. Changing `key` makes React rebuild the component, so its draft re-syncs with the URL.
- **Sticky + flex column layout** for a sidebar that doesn't scroll with the page.

## 4. Files changed

| File | Change |
|---|---|
| `src/utils/filterProducts.js` | Was an empty `parseFilters()`. Now `parseFilters` (URL → filters) and `buildSearchParams` (filters → URL) |
| `src/components/SidebarFilter.jsx` | Rewritten: draft state, facets, Apply button |
| `src/pages/HomePage.jsx` | Apply → navigate to `/products?...`; layout bug fixed |
| `src/pages/ProductsPage.jsx` | Uses the sidebar instead of the `<select>`; reads filters from URL |
| `src/styles/SidebarFilter.css` | Sticky sidebar, scrolling body, fixed Apply footer |
| `src/styles/ProductsCatalog.css` | `.home-layout` renamed to `.catalog-layout` (used by both pages) |

Not changed: `services/filterProducts.js` (already had `DEFAULT_FILTERS`, `filterProducts`), `CategoryCarousel.jsx` (its `?category=` links already match the new URL format).

**Bugs fixed along the way**

- `import "../styles/sidebarFilter.css"` didn't match the real file name `SidebarFilter.css`. It works on Windows but breaks on Linux/Mac builds and deployment.
- In `HomePage`, `<ProductList>` sat outside the `<section>`, so it became a separate grid cell under the sidebar. It is now inside the section.
- `aria-labelledby="popular-produccts-heading"` had a typo and didn't match the heading id.

`components/ProductFilters.jsx` (the old `<select>`) is now unused. You can delete it when you're ready.

## 5. How the parts talk to each other

```text
HomePage / ProductsPage
   │  products, appliedFilters, onApply
   ▼
SidebarFilter ── user clicks ──► draft (local state)
   │ Apply
   ▼
onApply(draft) ──► Home: navigate("/products?...")      Products: setSearchParams(...)
                                   │                                  │
                                   └────────────► URL ◄───────────────┘
                                                    │ parseFilters
                                                    ▼
                                      ProductsPage filters the list
```

## 6. Design decisions

- **Draft inside the sidebar, applied in the URL.** The page never re-renders the product grid while the user is still choosing.
- **`Clear all` only resets the draft.** Same rule as everything else: nothing changes until Apply. (Alternative: make Clear apply immediately. Easy to change: `onApply(DEFAULT_FILTERS)`.)
- **No `useMemo` in the sidebar.** About 200 products, so the loops are cheap. Add `useMemo` only if you measure a slowdown.
- **Facets use `searchedProducts`**, so counts match what the user sees when a navbar search is active.
- **Selected-but-empty items stay visible** (count 0) via `keepSelected`, otherwise a ticked brand could silently disappear and still filter the list.
- **Alternatives:** a Context (`FiltersContext`) would also work, but it is lost on refresh and can't be shared as a link. `localStorage` survives refresh but is invisible and can go stale.

**Common mistakes**

- Using the draft to filter the list directly (then Apply does nothing).
- Forgetting to keep `?search=` when building the URL (`buildSearchParams` starts from the current params for this reason).
- Putting `overflow: hidden` on a parent of a sticky element (sticky then stops working).
- Storing brands as one string in the URL. Use repeated `?brand=` and `getAll`.

## 7. Practice

**Similar problem.** Build a "Sort by" dropdown (price low→high, high→low, rating) that also uses an Apply button and is remembered in the URL (`?sort=price-asc`).

**Modified requirement.** Add a "Minimum rating" filter (stars) to the sidebar. Which files need to change? (Hint: count them before you start.)

**Check yourself**

1. Why is `key={JSON.stringify(filters)}` on `SidebarFilter` needed on Products, but not on Home?
2. What would break if `buildSearchParams` started from `new URLSearchParams()` instead of `currentParams`?
3. Why do the category counts ignore the category choice but the brand counts respect it?
4. Where would the code change if "Clear all" should apply immediately?

## 8. Reusability

- `parseFilters` / `buildSearchParams`: any list page (orders, users, tickets) with filters in the URL.
- `countBy` + `keepSelected`: any facet list.
- Draft + `onApply` callback: any "edit then confirm" panel.
- **How to recognise the pattern:** the requirement says "after confirming", "remember", "shareable link" or "survive refresh". That means staged draft state + state in the URL.

## 9. Final code

### `utils/filterProducts.js`

```js
// These two functions convert between the URL and the "filters" object.
// The URL is where we REMEMBER the applied filters.
//
//   filters object:  { category: "beauty", brands: ["Essence"], maxPrice: 50 }
//   URL:             /products?category=beauty&brand=Essence&maxPrice=50

// URL  ->  filters object
export function parseFilters(searchParams) {
  const rawPrice = searchParams.get("maxPrice");
  const price = Number(rawPrice);

  return {
    category: searchParams.get("category") ?? "all",
    brands: searchParams.getAll("brand"), // ?brand=A&brand=B  ->  ["A", "B"]
    maxPrice: rawPrice && !Number.isNaN(price) ? price : null,
  };
}




// filters object  ->  URL
// We start from the current params so other params (like ?search=) are kept.
export function buildSearchParams(currentParams, filters) {
  const next = new URLSearchParams(currentParams);

  // remove the old filter values first, then add the new ones
  next.delete("category");
  next.delete("brand");
  next.delete("maxPrice");

  if (filters.category !== "all") next.set("category", filters.category);
  for (const brand of filters.brands) next.append("brand", brand);
  if (filters.maxPrice !== null) next.set("maxPrice", String(filters.maxPrice));

  return next;
}

```

### `components/SidebarFilter.jsx`

```jsx
import { useState } from "react";
import { DEFAULT_FILTERS, filterProducts } from "../services/filterProducts";
import "../styles/SidebarFilter.css";

const VISIBLE_BRANDS = 7;
const QUICK_PRICES = [10, 50, 100, 500];

// Count how many products have each value of a field.
// countBy(products, "brand") -> [{ name: "Apple", count: 3 }, ...]
function countBy(products, field) {
  const counts = new Map();

  for (const product of products) {
    const value = product[field];
    if (!value) continue; // some products have no brand
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

// If something is selected but has no products left, still show it (count 0)
// so the user can see it and un-select it.
function keepSelected(list, selectedNames) {
  const result = [...list];

  for (const name of selectedNames) {
    if (!result.some((item) => item.name === name)) {
      result.push({ name, count: 0 });
    }
  }

  return result;
}

function SidebarFilter({
  products = [],
  appliedFilters = DEFAULT_FILTERS,
  onApply,
}) {
  // "draft" = what the user is picking right now (not applied yet).
  // "appliedFilters" (from the parent) = what is currently applied.
  const [draft, setDraft] = useState(appliedFilters);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // ---------- Faceted counts ----------
  // Category counts ignore the category choice, brand counts ignore the brand
  // choice. Every other choice is respected, so numbers match what you'd get.
  const productsForCategories = filterProducts(products, { ...draft, category: "all" });
  const productsForBrands = filterProducts(products, { ...draft, brands: [] });

  const categories = keepSelected(
    countBy(productsForCategories, "category"),
    draft.category === "all" ? [] : [draft.category],
  ).sort((a, b) => a.name.localeCompare(b.name));

  const brands = keepSelected(
    countBy(productsForBrands, "brand"),
    draft.brands,
  ).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const visibleBrands = showAllBrands ? brands : brands.slice(0, VISIBLE_BRANDS);

  const maxProductPrice = Math.ceil(
    Math.max(0, ...products.map((product) => product.price)),
  );
  const sliderValue = draft.maxPrice ?? maxProductPrice;

  // ---------- Handlers: they only change the DRAFT ----------
  function selectCategory(category) {
    setDraft({ ...draft, category });
  }

  function toggleBrand(brand) {
    const brands = draft.brands.includes(brand)
      ? draft.brands.filter((name) => name !== brand) // remove it
      : [...draft.brands, brand]; // add it

    setDraft({ ...draft, brands });
  }

  function changePrice(value) {
    // slider at the far right means "any price"
    setDraft({ ...draft, maxPrice: value >= maxProductPrice ? null : value });
  }

  function handleClear() {
    setDraft(DEFAULT_FILTERS);
  }

  function handleApply() {
    onApply(draft); // the PARENT decides what "apply" means
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
            <input
              type="range"
              min="0"
              max={maxProductPrice}
              step="1"
              value={sliderValue}
              onChange={(event) => changePrice(Number(event.target.value))}
            />
          </label>
          <div className="sidebar-quick-prices">
            {QUICK_PRICES.map((price) => (
              <button
                key={price}
                type="button"
                className={`sidebar-quick ${draft.maxPrice === price ? "is-active" : ""}`}
                onClick={() => changePrice(price)}
              >
                Under ${price}
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

```

### `pages/HomePage.jsx`

```jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CategoryCarousel from "../components/CategoryCarousel";
import ProductList from "../components/ProductList";
import { getProducts } from "../services/productService";
import HeroSlider from "../components/HeroSlider";
import "../styles/ProductsCatalog.css";
import SidebarFilter from "../components/SidebarFilter";
import { buildSearchParams } from "../utils/filterProducts";

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  // The homepage does NOT filter anything itself.
  // It saves the chosen filters in the URL and sends the user to /products.
  function handleApply(filters) {
    const params = buildSearchParams(new URLSearchParams(), filters);
    navigate({ pathname: "/products", search: params.toString() });
  }

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

      <div className="catalog-layout">
        <SidebarFilter products={products} onApply={handleApply} />

        <section aria-labelledby="popular-products-heading">
          <div className="products-heading">
            <h2 id="popular-products-heading">Popular Products</h2>
            <p className="product-count">{popularProducts.length} Products</p>
          </div>

          <ProductList products={popularProducts} />
        </section>
      </div>
    </section>
  );
}

export default HomePage;

```

### `pages/ProductsPage.jsx`

```jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../services/productService";
import SidebarFilter from "../components/SidebarFilter";
import ProductList from "../components/ProductList";
import ProductHeading from "../components/ProductHeading";
import { filterProducts } from "../services/filterProducts";
import { buildSearchParams, parseFilters } from "../utils/filterProducts";
import "../styles/ProductsCatalog.css";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
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

  // The URL is the single source of truth for the applied filters.
  const searchTerm = searchParams.get("search") ?? "";
  const filters = parseFilters(searchParams);

  // Step 1: navbar search.  Step 2: sidebar filters.
  const searchedProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );
  const filteredProducts = filterProducts(searchedProducts, filters);

  function handleApply(newFilters) {
    setSearchParams(buildSearchParams(searchParams, newFilters));
  }

  function handleClearFilters() {
    setSearchParams({});
  }

  if (loading) return <p role="status">Loading products...</p>;
  if (error) return <p role="alert">Error: {error}</p>;

  return (
    <section className="products">
      <div className="catalog-layout">
        {/* key: when the applied filters change (carousel click, back button...)
            the sidebar is re-created, so its draft matches the URL again. */}
        <SidebarFilter
          key={JSON.stringify(filters)}
          products={searchedProducts}
          appliedFilters={filters}
          onApply={handleApply}
        />

        <section aria-label="Product results">
          <ProductHeading count={filteredProducts.length} />
          {filteredProducts.length > 0 ? (
            <ProductList products={filteredProducts} />
          ) : (
            <div className="empty-state">
              <p className="empty-results">No products match your search.</p>
              <button type="button" onClick={handleClearFilters}>Clear filters</button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default ProductsPage;

```

### `styles/SidebarFilter.css`

```css
/* The sidebar stays in view while the products scroll.
   - position: sticky  -> sticks below the navbar (navbar is sticky at top: 0)
   - max-height        -> never taller than the screen
   - .sidebar-body     -> scrolls inside the sidebar if filters are long
   - .sidebar-footer   -> Apply button is always visible */
.sidebar {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 6rem);
  padding: 1rem;
  position: sticky;
  top: 5rem;
}

.sidebar-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.sidebar-body {
  flex: 1;
  min-height: 0; /* lets a flex child shrink so overflow works */
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.25rem;
}

.sidebar-footer {
  border-top: 1px solid #e2e8f0;
  margin-top: 1rem;
  padding-top: 1rem;
}

.sidebar-apply {
  background: #166534;
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  padding: 0.65rem 1rem;
  width: 100%;
}

.sidebar-apply:hover {
  background: #14532d;
}

.sidebar h2,
.sidebar h3 {
  margin: 0;
}

.sidebar h2 {
  font-size: 1.15rem;
}

.sidebar h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.sidebar-clear {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}

.sidebar-clear:hover {
  text-decoration: underline;
}

.sidebar-section {
  border-top: 1px solid #e2e8f0;
  margin-top: 1rem;
  padding-top: 1rem;
}

.sidebar-categories {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar-category {
  align-items: center;
  background: none;
  border: none;
  border-radius: 0.5rem;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  justify-content: space-between;
  padding: 0.45rem 0.5rem;
  text-align: left;
  width: 100%;
}

.sidebar-category:hover {
  background: #f1f5f9;
}

.sidebar-category.is-active {
  background: #f0fdf4;
  color: #166534;
  font-weight: 700;
}

.sidebar-category:focus-visible,
.sidebar-quick:focus-visible,
.sidebar-apply:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.sidebar-category-name {
  text-transform: capitalize;
}

.sidebar-fieldset {
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  display: grid;
  gap: 0.4rem;
  margin-inline: 0;
  min-width: 0;
  padding-inline: 0;
}

.sidebar-fieldset legend {
  font-size: 1rem;
  font-weight: 700;
  padding: 0;
}

.sidebar-brand {
  align-items: center;
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
}

.sidebar-brand-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-price-label {
  display: grid;
  gap: 0.5rem;
}

.sidebar-price-label input {
  width: 100%;
}

.sidebar-quick-prices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.sidebar-quick {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
  padding: 0.3rem 0.7rem;
}

.sidebar-quick:hover {
  border-color: #166534;
}

.sidebar-quick.is-active {
  background: #f0fdf4;
  border-color: #166534;
  color: #166534;
}

.sidebar-count {
  color: #64748b;
  font-size: 0.85rem;
}

/* On small screens the sidebar sits above the products, so no sticky. */
@media (max-width: 800px) {
  .sidebar {
    max-height: none;
    position: static;
  }

  .sidebar-body {
    overflow-y: visible;
  }
}

```

### `src/styles/ProductsCatalog.css`

Only one change: replace every `.home-layout` with `.catalog-layout` (2 places).

## 10. Not tested in a browser

I could not run `npm install` here, so the UI was not run. I tested the URL helpers (round trip, `&` in brand names, `?search=` kept, bad `maxPrice`). Please run `npm run dev` and try: pick filters on Home → Apply → check Products shows them ticked; scroll to confirm the sidebar stays; use the navbar search; refresh the page.