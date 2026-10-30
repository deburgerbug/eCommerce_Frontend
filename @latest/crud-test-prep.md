# CRUD Test Prep: Full Conversation

Context: next-day senior-led test on basic full-stack knowledge (CRUD backend + minimal React UI). Weak areas: React, CSS, translating requirements into code.

---

## Conversation 1: Request

Senior assigns a basic full-stack task tomorrow: CRUD in backend, linked to frontend with minimal UI. Requested: repeated logic, snippets, syntax tricks for frontend and backend, extra explanation for React/CSS, then senior-style pressure tasks (basic, then intermediate).

---

## Part 0. How a senior grades a basic CRUD test

1. It runs end to end: create, list, edit, delete all work from the UI.
2. Correct HTTP semantics: status codes, validation, 404 on a missing id.
3. No crashes on bad input: empty body, non-numeric id, server down.
4. UI handles loading, error and empty states.
5. Folder structure and naming are clean. You can explain every line you wrote.
6. Time management: working and ugly beats pretty and broken.

Test-day order: DB schema, routes and controllers tested in Postman, frontend fetch layer, list, form, edit/delete, CSS last.

---

## Part 1. Backend toolkit (Express + TS + Prisma)

### 1.1 Setup

```bash
npm init -y
npm i express cors dotenv zod @prisma/client
npm i -D typescript tsx prisma @types/express @types/cors @types/node
npx prisma init
# package.json scripts: "dev": "tsx watch src/server.ts"
npx prisma migrate dev --name init
```

Prisma commands to know: `migrate dev`, `generate`, `studio`, `db push` (fast prototyping).

### 1.2 Folder structure

```
src/server.ts            (listen only)
src/app.ts               (middleware + routes)
src/db.ts                (prisma instance)
src/routes/task.routes.ts
src/controllers/task.controller.ts
src/middleware/error.ts
prisma/schema.prisma
```

### 1.3 Schema

```prisma
model Task {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  done        Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Syntax notes: `?` nullable, `@default` default value, `@updatedAt` auto-updates, `@unique` constraint.

### 1.4 db.ts, app.ts, server.ts

```ts
// db.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

// app.ts
import express from "express";
import cors from "cors";
import taskRoutes from "./routes/task.routes";
import { notFound, errorHandler } from "./middleware/error";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());              // without this, req.body is undefined
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/tasks", taskRoutes);
app.use(notFound);
app.use(errorHandler);                // always last
export default app;

// server.ts
import "dotenv/config";
import app from "./app";
app.listen(Number(process.env.PORT) || 4000, () => console.log("up"));
```

### 1.5 Async wrapper

Express 4 does not catch async errors; Express 5 does.

```ts
import { RequestHandler } from "express";
export const wrap = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

### 1.6 Validation with zod

```ts
import { z } from "zod";
const createSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
});
const updateSchema = createSchema.partial().extend({ done: z.boolean().optional() });
// usage: const data = createSchema.parse(req.body);  // throws ZodError -> 400
```

### 1.7 Controller, full CRUD

```ts
const parseId = (v: string) => {
  const id = Number(v);
  if (!Number.isInteger(id) || id <= 0) throw Object.assign(new Error("Invalid id"), { status: 400 });
  return id;
};

export const list = wrap(async (req, res) => {
  const { q, done } = req.query;
  const tasks = await prisma.task.findMany({
    where: {
      ...(q ? { title: { contains: String(q), mode: "insensitive" } } : {}),
      ...(done !== undefined ? { done: done === "true" } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(tasks);
});

export const getOne = wrap(async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: parseId(req.params.id) } });
  if (!task) return res.status(404).json({ message: "Not found" });
  res.json(task);
});

export const create = wrap(async (req, res) => {
  const task = await prisma.task.create({ data: createSchema.parse(req.body) });
  res.status(201).json(task);
});

export const update = wrap(async (req, res) => {
  const task = await prisma.task.update({
    where: { id: parseId(req.params.id) },
    data: updateSchema.parse(req.body),
  });
  res.json(task);
});

export const remove = wrap(async (req, res) => {
  await prisma.task.delete({ where: { id: parseId(req.params.id) } });
  res.status(204).end();
});
```

### 1.8 Routes

```ts
import { Router } from "express";
const r = Router();
r.get("/", list); r.post("/", create);
r.get("/:id", getOne); r.patch("/:id", update); r.delete("/:id", remove);
export default r;
```

PUT = full replace, PATCH = partial update. Seniors ask this.

### 1.9 Error middleware

Needs 4 arguments or Express will not treat it as an error handler.

```ts
import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export const notFound: RequestHandler = (_req, res) => res.status(404).json({ message: "Route not found" });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ message: "Validation failed", issues: err.issues });
  if (err?.code === "P2025") return res.status(404).json({ message: "Not found" });   // Prisma: record missing
  if (err?.code === "P2002") return res.status(409).json({ message: "Already exists" }); // unique violation
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : "Server error" });
};
```

### 1.10 Status code cheat sheet

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Bad input |
| 401 | Not logged in |
| 403 | Not allowed |
| 404 | Missing |
| 409 | Conflict / duplicate |
| 422 | Semantic validation (optional) |
| 500 | Server bug |

### 1.11 Mongoose equivalent (if the test uses Mongo)

```ts
const taskSchema = new Schema(
  { title: { type: String, required: true, trim: true }, done: { type: Boolean, default: false } },
  { timestamps: true }
);
Task.find({}).sort({ createdAt: -1 });
Task.findById(id);
Task.create(body);
Task.findByIdAndUpdate(id, body, { new: true, runValidators: true });
Task.findByIdAndDelete(id);
```

Gotchas: an invalid ObjectId throws CastError, so check `mongoose.isValidObjectId(id)` first. Without `{ new: true }` you get the old document back.

---

## Part 2. Frontend toolkit (React + TS + Vite)

### Mental model

- A component is a function that returns UI.
- State is data that, when changed, re-renders the component.
- You never edit the DOM. You change state and React redraws.
- Rule 1: never mutate state, always produce a new value.
- Rule 2: UI is a function of state: `list = state.items.map(...)`.

### 2.1 Setup

```bash
npm create vite@latest client -- --template react-ts
cd client && npm i && npm run dev
```

`.env`: `VITE_API_URL=http://localhost:4000/api` (variable must start with `VITE_`).

### 2.2 API layer (all fetch calls in one file)

```ts
// api.ts
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type Task = { id: number; title: string; description?: string | null; done: boolean };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  list:   () => request<Task[]>("/tasks"),
  create: (b: { title: string; description?: string }) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(b) }),
  update: (id: number, b: Partial<Task>) => request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
  remove: (id: number) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};
```

`fetch` does NOT throw on 404 or 500. You must check `res.ok`. Most common beginner bug.

### 2.3 App component, annotated

```tsx
import { useEffect, useState } from "react";
import { api, Task } from "./api";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Runs once after the first render ([] = no dependencies)
  useEffect(() => {
    (async () => {
      try { setTasks(await api.list()); }
      catch (e) { setError((e as Error).message); }
      finally { setLoading(false); }
    })();   // the effect callback itself can't be async, so use an inner async function
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();         // stops the page reload
    if (!title.trim()) return;
    try {
      if (editingId === null) {
        const created = await api.create({ title });
        setTasks(prev => [created, ...prev]);                              // add
      } else {
        const updated = await api.update(editingId, { title });
        setTasks(prev => prev.map(t => t.id === editingId ? updated : t)); // replace
        setEditingId(null);
      }
      setTitle("");
    } catch (e) { setError((e as Error).message); }
  }

  async function toggle(t: Task) {
    const updated = await api.update(t.id, { done: !t.done });
    setTasks(prev => prev.map(x => x.id === t.id ? updated : x));
  }

  async function remove(id: number) {
    await api.remove(id);
    setTasks(prev => prev.filter(t => t.id !== id));                       // delete
  }

  if (loading) return <p>Loading...</p>;

  return (
    <main className="container">
      <h1>Tasks</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="row">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
        <button type="submit">{editingId === null ? "Add" : "Save"}</button>
      </form>
      {tasks.length === 0 ? <p>No tasks yet.</p> : (
        <ul className="list">
          {tasks.map(t => (
            <li key={t.id} className="row">
              <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
              <span className={t.done ? "done" : ""}>{t.title}</span>
              <button onClick={() => { setEditingId(t.id); setTitle(t.title); }}>Edit</button>
              <button onClick={() => remove(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

### 2.4 Three immutable array patterns (memorize)

```ts
// Add
setList(prev => [item, ...prev])
// Replace
setList(prev => prev.map(x => x.id === id ? updated : x))
// Remove
setList(prev => prev.filter(x => x.id !== id))
// Object update
setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
```

### 2.5 Multi-field form with one handler

```tsx
const [form, setForm] = useState({ title: "", description: "" });
const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  setForm(p => ({ ...p, [e.target.name]: e.target.value }));

<input name="title" value={form.title} onChange={onChange} />
<textarea name="description" value={form.description} onChange={onChange} />
```

### 2.6 React traps seniors look for

- Missing `key` in a list, or `key={index}` on a list that can reorder or delete.
- State is not updated immediately after `setState`. Do not read it on the next line.
- `useEffect` with no deps array causes an infinite request loop.
- `value` without `onChange` makes the input read-only.
- `onClick={fn()}` calls it during render. Use `onClick={() => fn()}`.
- Form button without `type="button"` submits the form.
- `{list.length && <X/>}` renders a literal 0. Use `list.length > 0 &&`.
- Do not store derived data in state. Compute it during render.

### 2.7 CSS for a clean minimal UI

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; background: #f5f6f8; color: #222; }
.container { max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
.row { display: flex; align-items: center; gap: 0.5rem; }      /* horizontal layout */
.row input[type="text"], .row input:not([type]) { flex: 1; }   /* input takes remaining space */
.list { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.list li { background: #fff; padding: 0.75rem; border-radius: 8px; justify-content: space-between; }
input, button { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 6px; font: inherit; }
button { cursor: pointer; background: #2563eb; color: #fff; border: none; }
button:hover { background: #1d4ed8; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.done { text-decoration: line-through; color: #888; }
.error { color: #b00020; background: #fde8ea; padding: 0.5rem; border-radius: 6px; }
```

Layout cheat sheet:

- Center a block: `margin: 0 auto` plus `max-width`.
- Center anything: `display:flex; justify-content:center; align-items:center`.
- Row with spacing: `flex` + `gap`. Column: `flex-direction: column`.
- Card grid: `display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem`.
- Push one item to the far end: `margin-left: auto`.
- Use `box-sizing: border-box`, or widths overflow.

---

## Part 3. Intermediate toolkit

### 3.1 One-to-many relation in Prisma

```prisma
model Category { id Int @id @default(autoincrement()) name String @unique tasks Task[] }
model Task { ... categoryId Int?  category Category? @relation(fields: [categoryId], references: [id]) }
```

```ts
prisma.task.findMany({ include: { category: true } })
```

### 3.2 Pagination

```ts
const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(50, Number(req.query.limit) || 10);
const [items, total] = await Promise.all([
  prisma.task.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { id: "desc" } }),
  prisma.task.count(),
]);
res.json({ items, total, page, pages: Math.ceil(total / limit) });
```

### 3.3 Debounced search hook (frontend)

```ts
function useDebounce<T>(value: T, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
// useEffect(() => { load(debouncedQ) }, [debouncedQ]);
```

The `return` inside `useEffect` is the cleanup function. Stale timers and requests die there.

### 3.4 JWT auth, minimum viable

```ts
// register: hash with bcrypt.hash(password, 10), never store the raw password
// login:    bcrypt.compare(pw, user.password) -> jwt.sign({ sub: user.id }, SECRET, { expiresIn: "1d" })
export const auth: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthenticated" });
  try { (req as any).userId = (jwt.verify(token, process.env.JWT_SECRET!) as any).sub; next(); }
  catch { res.status(401).json({ message: "Invalid token" }); }
};
// ownership: where: { id, userId: req.userId }  -> 404 for other users' rows
```

Frontend: send header `Authorization: Bearer ${token}`. Token in localStorage for the test. State out loud that httpOnly cookies are the safer production choice.

### 3.5 Optimistic update with rollback

```ts
const prev = tasks;
setTasks(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x));
try { await api.update(t.id, { done: !t.done }); }
catch { setTasks(prev); setError("Update failed"); }
```

### 3.6 Transaction

```ts
prisma.$transaction([ prisma.a.create(/* ... */), prisma.b.update(/* ... */) ])
// all succeed or none do
```

---

## Part 4. Tickets (senior mode, time-boxed, no skipping)

### Basic tier (target: 90 minutes total)

- **B1 (25 min).** Build a Notes API. Fields: title, content, pinned. Full CRUD. Anything that crashes the server on bad input is a defect. Tested with: blank title, 5000-char title, `id=abc`, `id=99999`. State what each returns.
- **B2 (25 min).** Notes UI. List, add, edit, delete, pin toggle. API down must show a visible error, not a white screen. Empty list needs a message.
- **B3 (20 min).** Search by title and a pinned-only filter. Server-side, not `.filter()` in the browser. Explain why.
- **B4 (20 min).** Presentable on a phone. One column under 600px. No CSS framework.

Self-check questions:

- What happens if two users delete the same note at once?
- Why is DELETE 204 and not 200?
- Where do you validate: frontend, backend, or both? Why?
- What does CORS actually block, and who enforces it?

### Intermediate tier (only after basic works without copying snippets)

- **I1 (40 min).** Categories (1-to-many). Note creation needs a category. Deleting a category that still has notes must not orphan them. Decide the behavior, justify it, implement it.
- **I2 (40 min).** Notes table has 50,000 rows. Add pagination with total count and debounced search. UI must not fire one request per keystroke, and an old slow response must not overwrite a newer one.
- **I3 (60 min).** Register/login. Each user sees only their own notes. A user must get 404, not data, when requesting another user's note id. Explain 404 versus 403.
- **I4 (30 min).** Pin toggle must feel instant. Optimistic update, clean recovery on failure.
- **I5 (30 min).** Production review of own code: list five things that would fail in production (rate limiting, input size, secrets, N+1 queries, no tests) and fix two.

### Submission protocol

1. For each ticket, write a 5-line design note first: endpoints, status codes, edge cases, data shape.
2. Then code.
3. Send note and code together for PR-style review.

Start with B1. Send the design note first, not the code.

---

## Conversation 2: Request

Likely test exercises:

1. CRUD backend; UI form fields; submit saves to DB; saved data displayed on a separate page.
2. Auth with backend and frontend.

Most tasks are CRUD, but every problem differs. Problem: struggles with code formation, cannot think of the solution in code, and even when a solution is conceived, forgets basic things.

---

## Part 5. The 5-step pipeline (run on paper, 10 minutes, before any code)

Diagnosis: the jump from requirement straight to code leaves nothing to hold the basics in. A fixed pipeline, identical for every CRUD task, removes the forgetting after a few repetitions.

### Step 1. Nouns to data

Underline every noun in the requirement. Each important noun becomes a table or model. For each, write:

- Field name and type
- Required or optional
- Constraints: unique, max length, default
- Auto fields often forgotten: id, createdAt, updatedAt

### Step 2. Verbs to endpoints

Underline every verb. Each verb becomes a row with these columns:

- Method and path
- Request body or params
- Success status
- Failure statuses (400 bad input, 404 missing, 409 duplicate, 401 not logged in)

If the failure column cannot be filled, thinking is not done.

### Step 3. Backend build order (fixed, never skip)

1. Schema, then migrate
2. Server boots, `/health` route answers
3. `express.json` and `cors` enabled
4. One route: create. Test in Postman
5. List route. Test
6. Single get, update, delete. Test each
7. Validation for each write route
8. Error middleware last

Test every route before moving on. Never write three routes and then test.

### Step 4. Frontend build order

1. List the pages. For each page write what data it needs and what actions it has.
2. For each page write its state: data, loading, error, form fields.
3. Write the API file first, one function per endpoint.
4. Build the page with fake or empty data, then connect it to the API.
5. Every page needs four states: loading, error, empty, success.
6. CSS last.

### Step 5. Wiring checklist (the basics that get forgotten)

- [ ] Frontend URL matches backend port and path
- [ ] CORS origin matches frontend port
- [ ] `Content-Type` header set on POST
- [ ] Response status checked (`fetch` does not throw on 404 or 500)
- [ ] Form resets after successful submit
- [ ] Submit button disabled while request is in flight
- [ ] Browser Network tab inspected: status code, payload, response
- [ ] Page refresh: does data survive? Does the page still load?

---

## Exercise 1: Form, save to DB, show on a separate page

Run the pipeline on it.

- **Data:** one entity with 3 to 5 fields, plus id and createdAt.
- **Endpoints:** POST create, GET list. Edit and delete are bonus.
- **Pages:** Page A is the form. Page B is the list.

Commonly forgotten:

- A router is required (`react-router-dom`). Know: `BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate`.
- Page B must fetch on mount. Page B must not rely on state kept in Page A, because state dies when the page changes.
- Decide what happens after successful submit: redirect to the list page, or show a message.
- Form validation exists in two places. Frontend gives quick feedback. Backend is the real gate.
- Number fields arrive from inputs as strings. Convert before sending, or let the backend coerce.
- Date fields: know which format the API expects.
- A direct visit or refresh on `/list` must still work.

---

## Exercise 2: Auth

**Data:** User with email (unique) and password hash. Never a plain password.

**Endpoints:**

| Endpoint | Success | Failures |
|---|---|---|
| `POST /auth/register` | 201 | 409 email exists, 400 bad input |
| `POST /auth/login` | 200 + token | 401 wrong credentials (same message for wrong email and wrong password; know why) |
| `GET /auth/me` or any protected route | 200 | 401 without a valid token |

**Backend order:**

1. User model
2. Register: validate, hash, save, never return the hash
3. Login: find user, compare hash, sign token
4. Auth middleware: read header, verify, attach user id to request
5. Apply middleware to protected routes
6. Test in Postman with and without the header

**Frontend order:**

1. Register page and login page
2. After login, store the token
3. API layer attaches `Authorization` header on every request
4. Protected route component: no token means redirect to `/login`
5. Logout: remove token and redirect
6. Handle a 401 response globally: clear token, go to login
7. Navbar shows different links for logged-in and logged-out users

**Commonly forgotten:**

- The token expires, so decide what the UI does then.
- On page refresh the token must be read back from storage, or the user appears logged out.
- Protected data is filtered by user id on the server, not hidden in the UI.
- The secret lives in `.env`, not in the code.

---

## How to train "thinking in code"

1. **Plan before code, always.** 10 minutes on steps 1 and 2 on paper. Code only transcribes the plan.
2. **Repeat the same shape with different entities:** books, expenses, students, tickets, bookings. Five repetitions make the pipeline automatic. The entity changes, the skeleton stays.
3. **Keep a personal "forgot" list.** Each time something is forgotten, add one line. Review before every build. It becomes the wiring checklist.
4. **Build small, test often.** Forgetting basics comes from writing too much untested code.
5. **Close the snippets.** Re-type the skeleton from memory, compare, note the gaps. Reading snippets builds recognition. Typing from memory builds recall, and the test needs recall.
6. **Time-box.** 90 minutes for Exercise 1, 120 minutes for Exercise 2.

### First assignment

Pick any entity for Exercise 1 and send steps 1 and 2 of the pipeline (fields table and endpoints table), no code. Reviewed senior-style before building starts.




client/script.js

`
const API_URL = "http://localhost:3000/api/students";
const form = document.getElementById("studentForm");
const statusEl = document.getElementById("status");

function clearErrors() {
  document.querySelectorAll(".error").forEach(el => (el.textContent = ""));
  statusEl.textContent = "";
  statusEl.className = "";
}

function showErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const el = document.getElementById(field + "Error");
    if (el) el.textContent = message;
  });
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type;
}

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();

  const data = Object.fromEntries(new FormData(form));
  Object.keys(data).forEach(k => (data[k] = data[k].trim()));

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();

    if (response.ok) {
      showStatus("Student registered successfully", "success");
      form.reset();
    } else if (response.status === 422) {
      showErrors(body.errors);
    } else {
      showStatus(body.message || "Server error", "fail");
    }
  } catch (err) {
    showStatus("Network error. Is the server running?", "fail");
  }
}

form.addEventListener("submit", handleSubmit);
`


________________________________________________________________________________________________________________________________

index.css
`
body {
  font-family: sans-serif;
  max-width: 420px;
  margin: 40px auto;
}

.field {
  margin-bottom: 14px;
}

label {
  display: block;
  margin-bottom: 4px;
}

input,
select,
textarea {
  width: 100%;
  padding: 6px;
  box-sizing: border-box;
}

.error {
  color: #c00;
  font-size: 13px;
  display: block;
  min-height: 16px;
}

#status {
  margin-top: 12px;
  font-weight: bold;
}

#status.success {
  color: #070;
}

#status.fail {
  color: #c00;
}
`


_____________________________________________________________________________________________________________________________


server/student.js
`
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    dob: { type: Date, required: true },
    course: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 4 },
    address: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
`


_______________________________________________________________________________________________________________________________


server/server.js

`
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Student = require("./Student");

const app = express();
app.use(cors());
app.use(express.json());

const COURSES = ["Computer", "IT", "Mechanical", "Civil"];

function validateStudent(body) {
  const errors = {};
  const { fullName, email, phone, dob, course, year, address } = body;

  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email";
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    errors.phone = "Phone must be exactly 10 digits";
  }
  if (!dob || isNaN(Date.parse(dob))) {
    errors.dob = "Enter a valid date of birth";
  } else if (new Date(dob) > new Date()) {
    errors.dob = "Date of birth cannot be in the future";
  }
  if (!COURSES.includes(course)) {
    errors.course = "Select a valid course";
  }
  const y = Number(year);
  if (!year || !Number.isInteger(y) || y < 1 || y > 4) {
    errors.year = "Year must be an integer between 1 and 4";
  }
  if (!address || address.trim().length < 5) {
    errors.address = "Address must be at least 5 characters";
  }
  return errors;
}

app.post("/api/students", async (req, res) => {
  const errors = validateStudent(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  try {
    const student = await Student.create({ ...req.body, year: Number(req.body.year) });
    return res.status(201).json({ message: "Created", id: student._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(422).json({ errors: { email: "Email already registered" } });
    }
    if (err.name === "ValidationError") {
      const errs = {};
      Object.values(err.errors).forEach(e => (errs[e.path] = e.message));
      return res.status(422).json({ errors: errs });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

mongoose
  .connect("mongodb://127.0.0.1:27017/studentdb")
  .then(() => app.listen(3000, () => console.log("Server on 3000")))
  .catch(err => console.error("DB connection failed:", err));
`




  __________________________________________________________________________________________________________





server/studentValidation.js

`
  const { z } = require("zod");

const studentSchema = z.object({
  fullName: z.string({ error: "Full name is required" }).trim().min(2, "Full name must be at least 2 characters"),
  email: z.email({ error: "Enter a valid email" }).trim().toLowerCase(),
  phone: z.string({ error: "Phone is required" }).regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  dob: z.coerce.date({ error: "Enter a valid date of birth" }).refine(d => d <= new Date(), "Date of birth cannot be in the future"),
  course: z.enum(["Computer", "IT", "Mechanical", "Civil"], { error: "Select a valid course" }),
  year: z.coerce.number({ error: "Year is required" }).int("Year must be an integer").min(1, "Year must be 1 to 4").max(4, "Year must be 1 to 4"),
  address: z.string({ error: "Address is required" }).trim().min(5, "Address must be at least 5 characters"),
});

function validateStudent(req, res, next) {
  const result = studentSchema.safeParse(req.body);
  if (!result.success) {
    const errors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (!(field in errors)) errors[field] = issue.message;
    }
    return res.status(422).json({ errors });
  }
  req.body = result.data;
  next();
}

module.exports = { validateStudent };
`
