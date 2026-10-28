# How to Build Anything: A Builder's Guide

*Written from reading your actual codebase (`react-practice`, a Vite + React shop). Four takes, each one zooms out further.*

| Take | Question it answers |
|---|---|
| 1 | How is **this** project built, and how would I rebuild it from zero? |
| 2 | How do I approach **any** project in **any** domain? |
| 3 | If this shop needed a **backend**, what would I design? |
| 4 | How do I build **full stack and ship it** (and where does system design start)? |

First, an honest note about your worry, because it shapes how to read everything below.

> "If not for AI I may not have been able to build this."

Two different skills are hiding inside that sentence:

1. **Knowing what to build and in what order** (decomposition, data flow, design). This is the senior skill, and it is what this guide trains.
2. **Recalling syntax** (`useEffect` deps, flexbox properties). This is memory, and it comes from repetition. It is the *least* valuable skill, and the one you can rebuild fastest.

Ten years of MERN, Postgres and Angular means you already own skill 1 in the backend. Angular's services, DI, routing and guards map almost one-to-one onto what you wrote in React (mapping in Take 1). You are not starting from zero. You are missing reps on one framework's syntax and on CSS.

---

# TAKE 1: This Project, Explained for a Newcomer

## 1.1 What is this app?

A frontend-only online shop. There is **no server of your own**. Instead:

- Products come from a public API (`dummyjson.com`).
- Everything the user *creates* (account, cart, wishlist, orders) is saved in the browser's `localStorage`.

User journey:

```
Home -> Products (search/filter) -> Product details -> Add to cart
     -> Cart -> (login required) Checkout -> Order saved -> Orders page
```

**Purpose of the codebase:** practice real application architecture (routing, global state, persistence, auth, protected pages) without needing a backend. `localStorage` is a *pretend database*, a stand-in for a real backend. This matters in Take 3: the code is deliberately shaped so a real backend can replace it.

## 1.2 Tech stack and why each piece exists

| Piece | What it is | Why it's here |
|---|---|---|
| **Vite** | Dev server + bundler | Instant start, hot reload, builds static files. (`vite.config.js`, `index.html`, `src/main.jsx` are its entry chain.) |
| **React 19** | UI library | UI = function of state. When data changes, screens update by themselves. |
| **react-router-dom v7** | Client-side routing | One HTML page, many "screens" chosen by URL, with no page reloads. |
| **Context API** | Global state | Cart, auth and wishlist are needed by many distant components. Context avoids passing props through 5 levels. |
| **localStorage** | Browser key-value store | Makes data survive refresh. Only strings, so you `JSON.stringify` / `JSON.parse`. |
| **fetch + DummyJSON** | Web API call | Real async network data: loading, error, success states. |
| **react-icons / react-feather** | Icon packs | UI polish only. |
| **Plain CSS files** | Styling | One CSS file per feature area in `src/styles/`. |

## 1.3 Folder map: one responsibility per folder

```
src/
  main.jsx            <- entry: mounts <App/> into #root
  App.jsx             <- providers + route table + layout
  pages/              <- one file per URL/screen (smart: fetch, state, compose)
  components/         <- reusable UI pieces (mostly dumb: props in, JSX out)
  store/              <- React Contexts: live app state (Auth, Cart, Wishlist)
  services/           <- plain JS, NO React: talks to localStorage / network
  styles/             <- CSS per feature
  data/products.json  <- leftover sample data (unused now)
```

**The most important idea in this project is the three-layer split:**

```
 pages/components  (what the user sees)
        |  call
      store/        (what the app currently knows, React state)
        |  call
     services/      (how data is stored/fetched, no React at all)
        |  call
  localStorage / fetch
```

Why: if tomorrow `localStorage` becomes a real API, you change **only `services/`**. Pages and stores don't care. This is the single most transferable design idea in the repo.

> **Angular mapping, since you know Angular:**
> `services/` is an Angular injectable service. `store/*Context` is a service holding state (or NgRx store). `ProtectedRoute` is a `CanActivate` guard. `<Outlet/>` is `<router-outlet>`. `useState` is a component property plus change detection. `useEffect` is lifecycle hooks (`ngOnInit`/`ngOnChanges`).

## 1.4 The order to build it (this is the real lesson)

A beginner starts with the Navbar because it's visible. A builder starts with **data and flow**. Build in this order. Each step is runnable and testable before you go on.

### Step 0: Scaffold
```bash
npm create vite@latest shop -- --template react
cd shop && npm i react-router-dom react-icons
npm run dev
```
Delete the demo content. Confirm a blank page works. *Checkpoint: the app boots.*

### Step 1: Write down behaviors before code
Your own `some.md` already says this well, so keep doing it. Write the user's actions as a list:
1. Browse products. 2. Search and filter. 3. Open details. 4. Add to cart, change quantity, remove. 5. Register / login / logout. 6. Checkout only when logged in. 7. See past orders. 8. Wishlist.

This list **is** your task list **and** your manual test plan.

### Step 2: Storage helper (`services/storage.js`): 22 lines
Everything persistent goes through three functions: `readJSON(key, fallback)`, `writeJSON(key, value)`, `removeKey(key)`.
Why first: every later feature saves something. Wrapping `localStorage` once means the `try/catch` (corrupted JSON, blocked storage) lives in **one** place.

### Step 3: Product service + a bare page
`productService.js` has `getProducts()` and `getProductById(id)`. Note the pattern:

```js
const response = await fetch(url);
if (!response.ok) throw new Error("...");   // fetch does NOT throw on 404/500!
const data = await response.json();
```

Then a throw-away `ProductsPage` that just prints `products.length`. *Checkpoint: real data on screen.*

### Step 4: The async-data pattern (you'll write it 3 times)
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
  async function load() {
    try { setData(await getProducts()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  load();
}, []);

if (loading) return <p>Loading...</p>;
if (error)   return <p>Error: {error}</p>;
```
Every data screen has **three states: loading, error, success** (plus "empty"). A page that only handles success is unfinished. This pattern is in `HomePage`, `ProductsPage`, `ProductDetailsPage`.

### Step 5: Routing (`App.jsx`)
Routes: `/`, `/products`, `/products/:id`, `/cart`, `/login`, `/register`, `/orders`, `/wishlist`, `/checkout`, `*`.
Concepts to understand:
- **Nested layout route:** `AppLayout` renders `<Navbar/>` plus `<Outlet/>` once, and every page appears inside it.
- **`:id` param:** read with `useParams()`.
- **Catch-all `*`** redirects unknown URLs home.

### Step 6: Product list UI
`ProductsPage` -> `ProductList` -> `ProductCard`. Data flows **down as props**, and `key={product.id}` goes on every mapped item.

### Step 7: Search and filter live in the URL
`/products?search=phone&category=beauty`. `useSearchParams()` reads and writes this.
**Why the URL and not `useState`?** Links become shareable, the back button works, and refresh keeps the filter. This is "URL as state" and it's a senior-level habit. The Navbar search box and the category carousel both write to the same URL, and `ProductsPage` just reads it. They never talk to each other directly.

Note the derived-data trick: `filteredProducts` is **computed** from `products + URL` on every render. It is not stored in state. *Never store what you can compute.*

### Step 8: Auth
Build bottom-up:
1. `authService.js`: `registerUser`, `loginUser`, `logoutUser`, `getCurrentUser`. Users live in `localStorage["users"]`, the session in `localStorage["session"]` (just a `userId`).
2. `AuthContext.jsx`: holds `user` in state, initialised **lazily** from storage: `useState(() => getCurrentUser())`. Exposes `login/register/logout/isLoggedIn`.
3. `LoginPage`/`RegisterPage`: controlled forms, validation, loading and error state.
4. `ProtectedRoute`: if not logged in, `<Navigate to="/login" state={{from: location}}/>`. After login, `LoginPage` reads `location.state.from` and sends the user back where they were headed.

Design details worth noticing:
- Passwords are **salted + SHA-256 hashed** via the Web Crypto API (`crypto.subtle`). Good habit, and a real learning exercise. **But it is not real security.** Anyone can open DevTools and read or edit `localStorage`. Real auth needs a server (Take 3). Treat this as a UI exercise.
- Login error says "Invalid email or password" for both cases, so attackers can't learn which emails exist.
- Email is trimmed and lowercased (`normalizedEmail`) so `A@x.com` and `a@x.com` are one account.

### Step 9: Cart
`CartContext` is the best code in the project to study.
- **Per-user keys:** guest uses `cart:guest`, a user uses `cart:<id>`. When `user` changes, `cartKey` changes, and the `useEffect([cartKey])` reloads the right cart.
- **One write path:** every mutation goes through `changeCart(newCart)` = `setCart` + `saveCart`. State and storage can never drift apart.
- **Immutability:** never `cart.push()`. Always make a new array via `map` / `filter` / spread, because React detects change by reference.
- **Business rules in the store:** you can't exceed `stock`, and quantity 0 removes the item (`.filter(q > 0)`).
- `addToCart` **returns true/false** so the UI can show "Only N in stock".

### Step 10: Wishlist
Same shape as the cart (a deliberate copy). If you understood Step 9, this one takes 15 minutes. *That is what "pattern" means.*

### Step 11: Checkout and orders
`CheckoutPage`: a controlled form with one `address` object, updated by one generic handler (`[name]: value`). On submit it builds an `order` snapshot (items, total, payment method, address, date), saves it under `orders:<userId>`, and clears the cart. `OrdersPage` reads it back.
Key idea: **an order is a snapshot.** It copies items and prices at purchase time. If the product price changes tomorrow, the old order must not change.

### Step 12: Navbar + polish + CSS
Last, because it needs everything else: it shows cart count, wishlist count, and login/logout based on state.

## 1.5 How data flows: one complete trace

**"Add to cart" click on the details page:**

```
click button
 -> handleAddToCart()                      [ProductDetailsPage]
 -> addToCart(product)                     [CartContext]
     -> checks stock, builds new array
     -> changeCart(newCart)
         -> setCart(newCart)               (React re-renders everyone using useCart)
         -> saveCart(key, newCart)         [cartServices]
              -> writeJSON(key, items)     [storage] -> localStorage
 -> Navbar badge updates automatically     (it also calls useCart())
```

**Login:**
```
submit form -> login(email,pw) [AuthContext] -> loginUser [authService]
  -> hash typed password with stored salt -> compare -> saveSession
  -> setUser(user) -> CartProvider sees new user -> cartKey changes
  -> useEffect reloads that user's cart -> Navbar shows name
```
Notice the chain reaction: **auth change -> cart change -> navbar change**, with zero manual wiring. That's the payoff of lifting state into Contexts.

## 1.6 Concept cheat-sheet (what and why, in this codebase)

**React**
- *Components* are functions returning JSX. *Props* flow down. *State* is data that triggers re-render.
- `useState`: local memory. Lazy init `useState(() => ...)` runs once.
- `useEffect(fn, [deps])`: side effects (fetching, syncing). The deps array says "re-run when these change".
- `useMemo`: cache a computation (categories, popular products).
- `useRef`: a handle to a DOM node (carousel scrolling) without re-render.
- Context: global state. The custom hook `useCart()` is a clean wrapper that also throws a clear error if used outside its provider.
- Controlled inputs: `value={x} onChange={e => setX(e.target.value)}`. React is the source of truth.

**Web APIs**
- `fetch` (+ `response.ok` check), `localStorage`, `crypto.subtle` / `crypto.randomUUID`, `URLSearchParams`, `Intl`/`toLocaleString`/`toFixed` for display.

**HTML**
- Semantic tags (`section`, `article`, `nav`, `header`, `main`), `label` wrapping inputs (clicking the label focuses the input), `aria-label` / `role="status"` / `role="alert"` for accessibility, `<form onSubmit>` plus `preventDefault()`.

**CSS (your weak spot, so the rules that matter most)**
1. **Box model:** every element is a box (content, padding, border, margin). Most "why is it 8px off" bugs live here. Use `box-sizing: border-box`.
2. **Flexbox** for one-dimensional rows or columns (navbar, cart item): `display:flex; gap; align-items; justify-content`.
3. **Grid** for two-dimensional layouts (product grid): `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))` is the one-liner that makes a responsive grid.
4. **Overflow + scroll** for the carousel: a flex row with `overflow-x:auto` plus `scrollBy`.
5. **Responsive** means a `@media (max-width: ...)` block. Design mobile first.
6. **Naming:** `.product-card-content` style (block-element) keeps CSS global-safe.
Learn these six and you can style 90% of apps. Everything else is decoration.

## 1.7 Honest review of the codebase (things a senior would flag)

Real issues I found while reading, ordered by importance:

1. **Import casing bug:** `wishlistService.js` imports `"./storage.JS"` but the file is `storage.js`. Windows doesn't care. **Linux (Vercel, Netlify, CI) will fail the build.** Fix: `"./storage"`.
2. **`.env` is unused:** `API_URL` is hardcoded in `productService.js`. Also Vite only exposes vars prefixed `VITE_` (via `import.meta.env.VITE_API_URL`), and the `dotenv` package is a Node tool that does nothing in browser code. Remove it from dependencies.
3. **Dead files:** `SliderComponent.jsx` is empty, `data/products.json` is unused, and `README.md` is the Vite default. `index.html` title is still `react-practice`.
4. **Cart stores price/stock copies.** If the real product changes, the cart is stale. Acceptable for a demo, but know it's a trade-off (in Take 3 the server re-prices the cart).
5. **Guest cart is lost on login.** Real shops *merge* guest cart into the user cart. Good feature to add.
6. **Checkout doesn't re-validate stock or recompute total** on submit. Total is computed on the client, which a real backend would never trust.
7. **Currency inconsistency:** `$` is shown but payment methods are UPI/Netbanking. Pick a currency (use `Intl.NumberFormat`).
8. **Order id `Date.now()`** can collide and is guessable. Fine here; a DB uses real IDs.
9. `OrdersPage` reads storage on each render (fine now, but not reactive).

None of these are embarrassing. They're the exact gaps that make good practice exercises.

## 1.8 Exercises: prove you can rebuild it (no AI)

Do these **in order**, offline, with only MDN and the React docs open.
1. Rebuild `storage.js` + a tiny `useLocalStorage(key, initial)` hook from memory.
2. Build the product list with loading/error/empty states.
3. Add the URL-driven search (`?search=`).
4. Build `CartContext` alone, with a plain page of buttons and no CSS.
5. Add guest-cart merge on login.
6. Add a `/products/:id` page and a back link that preserves the filters.
7. Build the whole app again in a **different domain** (e.g. a library or a notes-sharing app). Same skeleton, new nouns. This is the real test.

**Method that actually works:** read a file, close it, rewrite it from memory, diff against the original, and note exactly what you forgot. Repeat the forgotten parts daily. That's how "I don't know React" becomes "I forgot one dependency array".


---

# TAKE 2: First Principles. How to Build Any Project in Any Domain

Forget React for a moment. Every software project, whether a shop, hospital PACS viewer, chat app, game or analytics dashboard, is the same machine with different nouns:

```
   Humans / other systems
          |  (inputs: clicks, files, events, API calls)
          v
   [ Interface ] -> [ Rules / Logic ] -> [ Data storage ]
          ^                 |                  |
          +---- (outputs: screens, files, notifications, other systems)
```

**Software = take input, apply rules, store and retrieve state, produce output, reliably, for N users.**

## 2.1 The universal process (10 questions, in order)

### Q1. WHO and WHY? (Users + goal)
Who uses it? What pain does it remove? What does success look like in one sentence?
*Shop: "A visitor finds a product and buys it in under 2 minutes."*
Different users imply different projects: a clinician reading medical images (precision, speed, compliance) vs. a shopper (conversion, trust) vs. an internal tool (fast to build, ugly is fine).

### Q2. WHAT can they do? (Behaviors, as verbs)
Write user stories as plain verbs: *browse, search, add, pay, cancel, review*. Mark each **must / should / could**. Build the *must* list first. This is your MVP.

### Q3. WHAT things exist? (Entities = nouns)
Underline the nouns in your behavior list: User, Product, Cart, Order, Address, Payment. Each noun is an **entity** with fields, an identity (ID), and **relationships** (a User has many Orders; an Order has many Items). Drawing this *before* code is the most valuable 20 minutes in any project.

### Q4. WHAT are the rules? (Invariants)
The business truths that must **never** be violated: *stock can't go negative; an order total equals the sum of its items; one email = one account; a refund can't exceed payment.* Rules are where bugs and lawsuits come from. Write them down; decide where they're enforced.

### Q5. WHAT are the constraints? (This is why domains differ)

| Dimension | Ask | Examples of how it changes the build |
|---|---|---|
| **Scale** | 10 users or 10 million? | Single DB vs. caching, queues, sharding |
| **Latency** | Is 2s okay or must it be 50ms? | Real-time (WebSocket) vs. request/response |
| **Consistency** | Is stale data okay? | Feed: yes. Bank balance: never. |
| **Security / compliance** | Money? Health data? Children? | Encryption, audit logs, HIPAA/GDPR, access control |
| **Data size / shape** | Text rows or 2GB image studies? | Relational DB vs. object storage + streaming |
| **Availability** | What if it's down 1 hour? | Redundancy, backups, failover |
| **Team / budget / deadline** | 1 dev, 2 weeks? | Boring tech, monoliths, managed services |
| **Offline / device** | Phones, bad networks? | Local-first, sync, PWAs |

Two projects with the same screens can be totally different *architectures* because of this table. A blog and a stock exchange both "show lists", yet nothing else is alike.

### Q6. HOW does data flow? (Draw it, always)
For each behavior draw: `Trigger -> Validation -> Rule -> Storage change -> Response -> UI update.` If you can't draw it, you can't build it. (Take 1 section 1.5 is an example.)

### Q7. WHAT is the thinnest working slice? (Vertical slice)
Never build "all the database, then all the API, then all the UI" (horizontal layers; nothing works until the end). Build **one behavior end-to-end through every layer** (e.g. "list products": table -> endpoint -> fetch -> screen), then the next. You always have something demoable.

### Q8. WHICH decisions are expensive to reverse? (Decide those carefully)
Cheap to change later: button colors, folder names, a library. **Expensive:** database choice, data model, auth approach, public API shape, ID strategy, multi-tenancy. Spend design time on the expensive ones; move fast on the rest.

### Q9. HOW will I know it works? (Verification)
Per behavior, an acceptance check. Manual list first, then automated tests for the **rules** in Q4 (not for button colors). Also test the *unhappy* paths: empty, huge, duplicate, malformed, concurrent, offline, unauthorized.

### Q10. HOW will it run in the real world? (Operations)
Deploy, configure, monitor, back up, update, and recover. Software nobody can run is a demo. (Take 4.)

## 2.2 Multiple approaches to one question: how seniors think

You said you want to "know multiple approaches to a single question". That's a *habit*, and you can train it with one routine. For any design decision, force yourself to write:

```
DECISION:  Where does the cart live?
OPTIONS:   A) React state only
           B) localStorage
           C) Server DB (per user)
           D) Server session + DB for logged-in users
CRITERIA:  survives refresh? works across devices? works for guests? trustworthy? effort?
CHOICE:    B for the prototype, D for production
WHY:       ...
REVISIT WHEN: we need cross-device carts
```

Notice the pattern: **options -> criteria -> choice -> revisit trigger.** After ~50 of these you will *automatically* see alternatives. Experience is mostly stored decisions plus their consequences. You can compress it by (a) writing these down, (b) reading other people's architecture decision records (ADRs) and postmortems, (c) asking "what would break at 100x?".

Useful lenses to generate options fast:
- **Where does it run?** client / server / edge / background job
- **When does it run?** now (sync) / soon (async queue) / on schedule (cron) / on demand (lazy)
- **Who owns the truth?** one source of truth; everything else is a cache
- **Push or pull?** polling, webhooks, WebSockets, SSE
- **Build, buy, or borrow?** library, SaaS, or custom
- **Strict or flexible?** typed schema or documents; validate at boundaries

## 2.3 Domain families: what changes

| Domain | What dominates the design |
|---|---|
| **E-commerce / marketplace** | Catalog + inventory + cart + payments + orders (state machine) + search; money correctness; idempotency |
| **Social / content / feed** | Users graph, fan-out, ranking, moderation, read-heavy, caching |
| **Chat / collaboration** | Real-time, ordering, presence, offline sync, conflict resolution |
| **Fintech / banking** | Ledger (double-entry), ACID transactions, audit trail, compliance, never lose a cent |
| **Healthcare / medical imaging (like MedPACS)** | Privacy and compliance, huge binary files, DICOM standards, streaming, role-based access, audit |
| **SaaS / B2B** | Multi-tenancy, roles/permissions, billing/subscriptions, integrations, admin tools |
| **Booking / scheduling** | Time and timezones, availability, double-booking prevention (locks/transactions) |
| **Data / analytics** | Ingestion pipelines, warehouses, aggregation, dashboards, freshness vs. cost |
| **IoT / telemetry** | High-volume writes, time-series, unreliable devices, batching |
| **Games** | Real-time loop, state sync, latency hiding, anti-cheat |
| **AI products** | Prompt/context management, streaming, cost and latency, evaluation, safety, retrieval |
| **Internal tools / CRUD** | Speed of delivery; forms, tables, auth; keep it boring |

The skeleton (Q1-Q10) is identical. Only the *dominant force* changes. A good builder asks, "What's the one thing in this domain that would be catastrophic to get wrong?" and designs around that first. (Shop: charging twice or overselling. Healthcare: leaking patient data. Chat: losing or reordering messages.)

## 2.4 The frontend-first vs. backend-first question

- **UI-heavy product (dashboards, editors):** prototype UI with fake data first to validate the experience. (You did this: DummyJSON + localStorage.)
- **Rules-heavy product (payments, bookings):** design data model and API first; the UI is thin.
- **Either way:** agree on the **contract** (the shape of the data between them) early. A contract such as `GET /products -> { products: [{id,title,price,...}] }` lets both sides be built in parallel.

## 2.5 Decomposition toolkit (turning "big" into "doable")

1. **Nouns -> entities -> tables/models.**
2. **Verbs -> use cases -> endpoints/functions.**
3. **Use cases -> screens -> routes/components.**
4. **Repeated shapes -> reusable components/functions.** Don't abstract until the second or third repeat.
5. **Risky unknowns -> spike first.** Unsure if you can stream a 500MB file? Prototype *that* for 2 hours before designing anything around it.
6. **Walking skeleton:** deploy a "hello world" through every layer (UI -> API -> DB -> hosting) in week one. Integration pain surfaces early.

## 2.6 Debugging is the other half of building

A systematic loop beats guessing:
1. **Reproduce** reliably. 2. **Locate** by bisecting the flow (is the data wrong at the service? the store? the render?). 3. **Hypothesize** one cause. 4. **Test** that one thing (log, breakpoint, Network tab). 5. **Fix**, then **add a check** so it can't return.
In frontend work, the three tools are the **Network tab** (what did the server really send?), **React DevTools** (what's the state/props?), and **Application -> localStorage** (what's actually stored?).

## 2.7 How to *learn* this with your time constraint

You said you don't have time for slow experience. Compress it:
- **The Rebuild Method:** each week, rebuild one slice of a known app from a blank folder, offline. 5 hours/week beats 30 hours of tutorials.
- **Domain-swap drills:** same skeleton, new nouns (shop -> library -> clinic booking -> expense tracker). You learn the *pattern* instead of the *product*.
- **Write the design doc before code, even if 1 page** (Q1-Q10). It's the senior skill and costs 30 minutes.
- **Read one real codebase per month** (a small open-source app). Time-box: find the entry point, trace one feature.
- **Use AI as a reviewer, not an author.** Write it yourself, *then* ask for critique ("what did I miss, what breaks at scale?"). The learning happens in the struggle.
- **Keep a decision log and a "things I forgot" list.** Review it weekly.

---

# TAKE 3: If This Shop Needed a Backend

Your frontend already tells you what the backend must be. Every `services/*.js` function is a **future API endpoint**. That's the value of the layering from Take 1.

| Today (frontend service) | Tomorrow (backend) |
|---|---|
| `registerUser / loginUser / logoutUser / getCurrentUser` | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me` |
| `getProducts / getProductById` | `GET /products`, `GET /products/:id` |
| `loadCart / saveCart` | `GET/POST/PATCH/DELETE /cart/items` |
| `loadWishlist / saveWishlist` | `GET /wishlist`, `PUT/DELETE /wishlist/:productId` |
| `saveOrder / loadOrders` | `POST /orders` (checkout), `GET /orders`, `GET /orders/:id` |

I'll use your stack (Node/Express or NestJS + PostgreSQL) but the thinking is language-agnostic.

## 3.1 Requirements pass (Q1-Q4 applied)

**Actors:** Guest, Customer, Admin (manage catalog and orders), (later) Seller.
**Must:** auth, catalog, cart, checkout with payment, orders, wishlist.
**Should:** search/filter/sort/pagination, reviews, addresses book, email receipts, admin panel.
**Could:** coupons, recommendations, returns/refunds, multi-vendor, multi-currency.

**Invariants (the rules the server must enforce, because the client can lie):**
- Price is **always read from the DB**, never trusted from the client.
- Stock can't go below 0, even with two buyers at once.
- Order total = sum(item price x qty) + tax + shipping - discount, computed server-side.
- A user can only see **their own** carts, orders, addresses.
- Payment is charged **at most once** per order.
- Order items freeze price and title at purchase time.

## 3.2 Entities and relationships

```
User 1---* Address
User 1---1 Cart 1---* CartItem *---1 Product
User 1---* WishlistItem *---1 Product
User 1---* Order 1---* OrderItem *---1 Product (snapshot copy of price/title)
Order 1---* Payment
Product *---1 Category
Product 1---* Review *---1 User
Product 1---* ProductImage
(Coupon, InventoryMovement, AuditLog, RefreshToken: supporting tables)
```

## 3.3 PostgreSQL schema (core)

```sql
CREATE TABLE users (
  id             BIGSERIAL PRIMARY KEY,           -- or UUID v7 for non-guessable ids
  email          CITEXT UNIQUE NOT NULL,          -- case-insensitive uniqueness
  password_hash  TEXT NOT NULL,                   -- argon2id / bcrypt, never SHA-256 alone
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ                      -- soft delete
);

CREATE TABLE categories (
  id    BIGSERIAL PRIMARY KEY,
  slug  TEXT UNIQUE NOT NULL,
  name  TEXT NOT NULL
);

CREATE TABLE products (
  id           BIGSERIAL PRIMARY KEY,
  category_id  BIGINT NOT NULL REFERENCES categories(id),
  title        TEXT NOT NULL,
  description  TEXT,
  price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),  -- MONEY AS INTEGER, never float
  currency     CHAR(3) NOT NULL DEFAULT 'USD',
  stock        INTEGER NOT NULL CHECK (stock >= 0),        -- DB enforces the invariant
  rating_avg   NUMERIC(3,2) DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_title_trgm ON products USING gin (title gin_trgm_ops); -- fast search

CREATE TABLE carts (
  id        BIGSERIAL PRIMARY KEY,
  user_id   BIGINT UNIQUE REFERENCES users(id),   -- NULL for guest carts
  guest_token UUID UNIQUE,                         -- cookie id for guests
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cart_items (
  cart_id     BIGINT REFERENCES carts(id) ON DELETE CASCADE,
  product_id  BIGINT REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_id)                -- one row per product per cart
);

CREATE TABLE wishlist_items (
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE orders (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  subtotal_cents   INTEGER NOT NULL,
  shipping_cents   INTEGER NOT NULL DEFAULT 0,
  tax_cents        INTEGER NOT NULL DEFAULT 0,
  total_cents      INTEGER NOT NULL,
  shipping_address JSONB NOT NULL,                 -- snapshot, not a FK (address may change later)
  idempotency_key  TEXT UNIQUE,                    -- prevents double submit
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);

CREATE TABLE order_items (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id),
  title       TEXT NOT NULL,                       -- snapshot
  unit_price_cents INTEGER NOT NULL,               -- snapshot
  quantity    INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE payments (
  id            BIGSERIAL PRIMARY KEY,
  order_id      BIGINT NOT NULL REFERENCES orders(id),
  provider      TEXT NOT NULL,                     -- stripe / razorpay
  provider_ref  TEXT UNIQUE,                       -- provider's payment id
  status        TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Modelling concepts demonstrated:** primary/foreign keys, composite keys, constraints as safety nets, normalization (3NF) vs. deliberate denormalization (order snapshots), JSONB for flexible snapshots, indexes (B-tree, GIN trigram), soft deletes, `TIMESTAMPTZ`, money as integer cents.

## 3.4 API design (REST, versioned)

```
POST   /api/v1/auth/register      POST /auth/login     POST /auth/refresh    POST /auth/logout
GET    /api/v1/me                 PATCH /me            POST /me/addresses ...

GET    /api/v1/products?search=&category=&minPrice=&maxPrice=&sort=rating&page=1&limit=20
GET    /api/v1/products/:id
GET    /api/v1/categories
POST/PATCH/DELETE /api/v1/admin/products[/:id]       (admin only)

GET    /api/v1/cart
POST   /api/v1/cart/items         { productId, quantity }
PATCH  /api/v1/cart/items/:productId   { quantity }
DELETE /api/v1/cart/items/:productId
POST   /api/v1/cart/merge         (guest -> user on login)

GET    /api/v1/wishlist           PUT/DELETE /wishlist/:productId

POST   /api/v1/orders             Idempotency-Key header; body: { addressId|address, paymentMethod }
GET    /api/v1/orders?page=       GET /orders/:id        POST /orders/:id/cancel
POST   /api/v1/payments/webhook   (called by the payment provider, signature-verified)
```

**API design rules worth memorizing:**
- Nouns for resources, HTTP verbs for actions. Correct status codes: `200/201/204`, `400` (bad input), `401` (not logged in), `403` (not allowed), `404`, `409` (conflict, e.g. out of stock), `422`, `429` (rate-limited), `5xx` (our fault).
- **Consistent error shape:** `{ "error": { "code": "OUT_OF_STOCK", "message": "...", "details": [...] } }`.
- **Pagination** on every list (offset for simple, cursor for large/infinite feeds).
- **Validate at the edge** (Zod/Joi/class-validator): never trust body, query, or params.
- **Idempotency** for anything that moves money (retry-safe).
- **Versioning** (`/v1`) so you can evolve without breaking clients.
- Document with **OpenAPI/Swagger**; generate types for the frontend.

## 3.5 Authentication and authorization (the right way)

**Authentication (who are you?)**
- Hash with **argon2id** (or bcrypt). Your frontend's salted SHA-256 is a good *idea* but a *fast* hash; attackers want **slow** hashes.
- **Option A: Server sessions + HttpOnly cookie.** Simple, revocable, great for web. Needs a session store (Redis/DB).
- **Option B: JWT access token (short, ~15 min) + refresh token (long, rotating, stored hashed in DB, HttpOnly cookie).** Scales statelessly; revocation is harder.
- Store tokens in **HttpOnly, Secure, SameSite cookies**, **not** `localStorage` (XSS can read it).
- Defenses: rate-limit login, lockout/backoff, CSRF protection when using cookies, email verification, password reset via signed single-use tokens, optional 2FA, OAuth ("Sign in with Google") via OIDC.

**Authorization (what may you do?)**
- **RBAC:** role -> permissions (`customer`, `admin`).
- **Ownership checks:** `WHERE orders.user_id = :currentUserId` on *every* query. Skipping this is the #1 real-world bug (IDOR).
- Middleware order: `rateLimit -> auth -> authorize -> validate -> controller`.

## 3.6 The checkout transaction (the heart of the backend)

This is the one place worth studying deeply, because correctness is hard here:

```
POST /orders  (with Idempotency-Key)
 BEGIN TRANSACTION
   1. Load the cart items for this user, JOIN products (get REAL prices)
   2. For each item:  UPDATE products SET stock = stock - :qty
                      WHERE id = :id AND stock >= :qty      -- atomic; 0 rows updated => OUT_OF_STOCK (409)
   3. INSERT orders (status 'pending', totals computed here)
   4. INSERT order_items (snapshot price/title)
   5. DELETE the cart items
 COMMIT   (any failure => ROLLBACK, nothing half-done)
 Then: create a payment intent with the provider; the webhook marks the order 'paid'
```

Concepts: **ACID transactions, atomic conditional updates (avoids race conditions / overselling), isolation levels, row locks (`SELECT ... FOR UPDATE`), idempotency keys, webhooks (never trust the browser saying "payment done"; trust the signed server-to-server callback), state machine for order status** (`pending -> paid -> shipped -> delivered`, with only legal transitions).

For stock under high contention: **reservation** (hold stock for 10-15 minutes during payment, release on timeout) or a queue.

## 3.7 Backend architecture and project layout

A layered structure mirrors your frontend's discipline:

```
src/
  config/         env validation (fail fast if DB_URL missing)
  modules/
    auth/   products/   cart/   orders/   payments/   users/
       *.routes.ts     -> URL + middleware wiring
       *.controller.ts -> HTTP in/out only (parse, call service, respond)
       *.service.ts    -> business rules (the part that matters)
       *.repository.ts -> DB queries (Prisma/Knex/SQL)
       *.schema.ts     -> validation (Zod)
  middleware/     auth, error handler, rate limit, request-id, logging
  jobs/           background workers (emails, stock release)
  lib/            db, redis, mailer, payment-provider clients
```
**Rule:** controllers are thin, services hold rules, repositories hold SQL. Dependencies point inward (the same idea as your pages -> store -> services).

Choices to consider (write an ADR for each):
- **Framework:** Express (minimal) vs. NestJS (structure, DI, close to your Angular instincts) vs. Fastify (speed).
- **DB access:** raw SQL/Knex (control) vs. Prisma/Drizzle/TypeORM (productivity, type safety).
- **TypeScript** end-to-end, with shared types between API and frontend.
- **Monolith first.** A modular monolith beats microservices until you have a real reason (team size, scale hotspots).

## 3.8 Intermediate to advanced backend topics

- **Caching:** HTTP caching headers/ETags, Redis for hot reads (product lists, sessions), cache invalidation strategies (TTL, write-through, event-based).
- **Search:** Postgres full-text/trigram first; Elasticsearch/OpenSearch/Meilisearch when relevance and facets matter.
- **Background jobs and queues:** BullMQ/RabbitMQ/SQS for emails, invoices, image processing, stock release, retries, dead-letter queues.
- **File uploads:** presigned URLs straight to S3/R2 (the server never proxies big files), image resizing, CDN.
- **Rate limiting and abuse protection:** token bucket, per-IP and per-user.
- **Observability:** structured logs with request IDs, metrics (latency, errors, saturation), tracing (OpenTelemetry), alerts. *You can't fix what you can't see.*
- **Testing pyramid:** unit tests for services/rules, integration tests with a real test DB, a few end-to-end tests. Test the checkout transaction hardest.
- **Security checklist (OWASP):** parameterized queries (SQL injection), output encoding/CSP (XSS), CSRF, IDOR checks, secrets in env/secret manager, dependency scanning, HTTPS everywhere, helmet headers, CORS allow-list, input size limits.
- **DB operations:** migrations (never edit prod by hand), connection pooling (pgBouncer), `EXPLAIN ANALYZE` for slow queries, backups + tested restore, read replicas later.
- **Data integrity extras:** soft delete + audit log, optimistic locking (`version` column), unique constraints as the last line of defense.
- **Real-time (optional):** order-status updates via SSE/WebSocket.
- **Events:** emit domain events (`OrderPaid`) to decouple email/inventory/analytics (outbox pattern for reliability).
- **Multi-vendor/multi-currency/tax/shipping:** each is its own sub-domain. Add only when needed.

## 3.9 Moving *this* frontend onto the backend (migration plan)

1. Keep UI; replace each `services/*.js` body with `fetch('/api/...')`. Pages and stores barely change (the payoff of layering).
2. Change auth: remove password hashing from the browser; call `/auth/login`; rely on the cookie; `getCurrentUser()` becomes `GET /me` (async), so `AuthContext` needs a `loading` state at startup.
3. Cart: server is the source of truth; add optimistic UI (update screen instantly, roll back if the server rejects).
4. Replace per-render `loadOrders` with an async fetch + loading/error states.
5. Introduce a data-fetching library (**TanStack Query**) for caching, retries, loading flags, and invalidation. It replaces much of the hand-written `useEffect` fetching.
6. Handle `401` globally (redirect to login) and show server error messages.

---

# TAKE 4: Full Stack, End to End, Then Deployment

Take 2's process, now with a backend and production in the picture.

## 4.1 The build sequence (vertical slices)

**Phase 0: Foundations (day 1-2)**
- One-page design doc (Q1-Q10), entity diagram, API list, a clickable wireframe (even on paper).
- Repo layout: monorepo (`/apps/web`, `/apps/api`, `/packages/shared`) or two repos. Set up Git, `.gitignore`, `.env.example`, ESLint/Prettier, TypeScript.
- **Walking skeleton:** React page -> calls `GET /health` -> API -> `SELECT 1` on Postgres -> deployed on a free tier. If this works end-to-end, everything else is incremental.

**Phase 1: Auth slice**
DB `users` -> `register/login/me` endpoints -> login/register pages -> protected routes -> session persistence -> logout. *Demo: create account, refresh, still logged in.*

**Phase 2: Catalog slice**
`categories/products` tables + seed script -> `GET /products` with search/filter/pagination -> product list/detail pages with loading/error/empty states.

**Phase 3: Cart slice**
Cart tables -> endpoints -> cart UI (optimistic updates) -> guest cart + merge on login.

**Phase 4: Checkout and orders slice**
The transaction in 3.6 -> address form -> payment (start with a **mock** provider; switch to Stripe/Razorpay test mode) -> webhook -> order history. *This slice deserves the most tests.*

**Phase 5: Secondary features**
Wishlist, reviews, admin CRUD, emails.

**Phase 6: Hardening**
Validation everywhere, rate limiting, error pages, logging, tests, security pass, performance pass (indexes, caching, image sizes, code splitting).

**Phase 7: Ship and operate**
Deploy, monitor, back up, iterate.

## 4.2 Contracts between frontend and backend

- Define the API **first** in OpenAPI (or shared Zod schemas); generate types for both sides. Mismatched shapes are the #1 integration bug.
- Frontend uses a single `api.js` wrapper around `fetch` (base URL from `import.meta.env.VITE_API_URL`, attach credentials, parse errors, handle 401). Your `services/` folder is exactly the right home.
- Use **mock servers** (MSW) so the frontend never blocks on the backend.
- **CORS:** if the web app and API are on different origins, configure an allow-list and `credentials: true`; or serve both behind one domain with a reverse proxy (simpler, safer cookies).

## 4.3 Deployment: from laptop to the internet

### Environments
`local` -> `staging` (production clone for testing) -> `production`. Config via **environment variables** (12-factor). Secrets never in Git.

### Options (pick by budget and learning goal)

| Stage | Frontend | Backend | Database |
|---|---|---|---|
| **Free / hobby** | Vercel, Netlify, Cloudflare Pages | Render, Railway, Fly.io | Neon, Supabase, Railway Postgres |
| **Simple production** | Same, plus a CDN | A VPS (Hetzner/DigitalOcean) with Docker + Caddy/Nginx | Managed Postgres |
| **Cloud-native** | S3 + CloudFront | ECS/Fargate, Cloud Run, or Kubernetes | RDS / Cloud SQL |

For learning: deploy the **static frontend on Vercel/Netlify**, the **API in a Docker container on Render/Fly/Railway**, and **Postgres on Neon/Supabase**. Later, rebuild the same on a bare VPS to understand what the platforms hide.

### Docker (reproducible runtime)
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
USER node
CMD ["node","dist/server.js"]
```
`docker-compose.yml` for local dev: `api + postgres + redis` with one command (`docker compose up`).

### CI/CD
GitHub Actions pipeline: on every push -> install -> lint -> type-check -> test -> build. On merge to `main` -> deploy automatically (or with an approval gate for prod). Database **migrations run as a deploy step**, never by hand.

### Production checklist
- [ ] HTTPS and HSTS; custom domain and DNS
- [ ] Env vars/secrets in the host's secret manager
- [ ] DB migrations applied; **automated backups and a tested restore**
- [ ] Health check endpoint; graceful shutdown; restart policy
- [ ] CORS allow-list; security headers (helmet); rate limiting
- [ ] Error tracking (Sentry), logs, uptime monitor, basic metrics and alerts
- [ ] Frontend: hashed asset filenames (Vite does this), gzip/brotli, lazy-loaded routes, SPA fallback rewrite (`/* -> /index.html`, otherwise refreshing `/cart` gives a 404)
- [ ] Rollback plan (previous image/version one click away)
- [ ] Cost alarm (cloud bills surprise people)

## 4.4 Beyond this prompt: how this grows into system design

You said system design is the future goal. Here is the bridge. System design is just Q5 (constraints) asked with **numbers**, plus the vocabulary to answer.

**The estimation habit.** Practice back-of-envelope math:
`1M users x 10 requests/day = 10M/day ~ 115 req/s average, ~500 req/s peak.` One small Postgres handles that. So you don't need microservices. At 50k req/s you do need to think differently. Numbers kill hype.

**The scaling ladder (climb only when metrics force you):**
1. One server + one DB (handles far more than people think).
2. Add indexes, fix slow queries, add a CDN for static files.
3. Cache hot reads (Redis).
4. Separate the DB onto its own machine; add connection pooling.
5. Horizontally scale stateless API servers behind a load balancer.
6. Read replicas for read-heavy load.
7. Move slow work to queues and background workers.
8. Partition/shard data; split hot domains into services.
9. Multi-region, CDN edge compute, disaster recovery.

**Core vocabulary to learn (in roughly this order):**
latency vs. throughput, stateless vs. stateful, load balancing, caching and invalidation, CAP/PACELC and consistency models (strong vs. eventual), replication, partitioning/sharding, indexing internals, message queues and pub/sub, idempotency and retries/backoff, circuit breakers, rate limiting, CDN, object storage, search indexes, event-driven architecture, CQRS/outbox, saga pattern for distributed transactions, observability (SLI/SLO), and capacity planning.

**Classic design exercises to try (on paper, with Q1-Q10 and numbers):** URL shortener, chat system, news feed, e-commerce checkout (you've now done this one), ride matching, video streaming, rate limiter, notification service, file storage (Drive/Dropbox), and for your own domain, **a cloud medical-imaging viewer** (huge files, streaming, access control, audit).

**A system-design answer template:**
1. Clarify requirements (functional and non-functional) and ask about scale.
2. Estimate load and storage.
3. Define API and data model.
4. Draw the high-level diagram (client -> LB -> services -> DB/cache/queue).
5. Deep-dive the hardest 1-2 parts (bottleneck, consistency, failure).
6. Discuss trade-offs, failure modes, and what you'd monitor.
7. State what you'd build first and what you'd defer.

## 4.5 Your 12-week path (realistic for someone with a job)

| Weeks | Goal | Proof |
|---|---|---|
| 1-2 | React fundamentals by rebuilding Take 1's cart + auth slice from memory, offline | You can build it with only MDN/React docs open |
| 3-4 | CSS: flexbox, grid, responsive; rebuild 3 real pages from screenshots | Pixel-close layouts, no copy-paste |
| 5-6 | Build a **new-domain** frontend (e.g. clinic booking) with fake data | Same skeleton, new nouns, done in a weekend |
| 7-8 | Add the backend (Express/Nest + Postgres) with the auth + one resource | Deployed walking skeleton |
| 9-10 | Checkout-style transaction + tests + CI/CD | A rule that survives concurrent requests |
| 11-12 | Deploy it, add monitoring, write a design doc and 2 ADRs | A project you can explain end to end |

**Daily micro-habits (20-30 min):** rewrite one file from memory; write one decision record; read one section of docs; look at one network request in DevTools and explain every header.

## 4.6 Closing thought

The question is not "can I build it without AI?" The question is **"do I understand every layer well enough to explain, change and debug it?"** The way to get there is to build things with AI *absent* in the first draft, and present for review afterwards. You already have the harder half: a decade of backend and database reasoning. The frontend syntax is a few weeks of deliberate reps away. The thing that separates builders from coders is the habit you're already starting: writing down how the whole thing fits together.

Build anything first. Design systems second. The second grows out of the first.
