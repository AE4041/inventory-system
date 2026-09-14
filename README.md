# Multi-Store Inventory & Sales Management System

A simple, modern inventory + POS + expenses + reporting system for a business that runs multiple
store branches, inspired by the simplicity of Loyverse POS.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, PrimeReact 10, React Router, Recharts, Axios
- **Backend:** Node.js, Express, JWT auth, Zod validation
- **Database:** PostgreSQL via Prisma ORM
- **Email:** Resend (transactional receipt emails)
- **PDF:** pdfkit (generated server-side, no headless browser needed)

## Project Structure

```
inventory-system/
├── backend/
│   ├── api/index.js        # Vercel serverless entry point
│   ├── prisma/schema.prisma
│   ├── prisma/seed.js       # demo data
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/      # auth, validation, error handling
│       ├── services/        # inventory, sales, reports, receipts, email
│       └── app.js / server.js
├── frontend/
│   └── src/
│       ├── pages/           # one folder per feature area
│       ├── components/
│       ├── layouts/
│       ├── context/         # auth, current store, toast
│       └── services/        # API client
├── docker-compose.yml       # local Postgres for development
└── README.md
```

## Features

- Multi-store organization: stores have their own inventory, customers, sales, and expenses; admins
  see consolidated data across all stores or drill into one.
- Role-based access (Admin / Manager / Cashier) enforced on the **backend** — the frontend only
  hides UI a role can't use, it never relies on that alone.
- Product catalog with per-store stock levels, low-stock alerts, and stock valuation.
- Inventory operations: additions, deductions, exact-count adjustments, and inter-store transfers
  (with an in-transit "pending" state), all logged to an audit trail (who, when, why, before/after
  quantity).
- POS screen: search/barcode lookup, cart, walk-in or saved customers, discounts (role-gated),
  multiple payment methods, automatic stock deduction.
- Refunds/cancellations restore stock and are excluded from revenue in all reports.
- PDF + emailed HTML receipts.
- Dashboard and Reports (Sales, Expenses, Inventory, Product Performance, Store Performance) with
  date-range presets, store/category/cashier/customer/payment filters, and CSV export.
- Per-store price overrides: a product can charge a different price at each store (e.g. a branch
  in a pricier area), falling back to its default price everywhere it isn't overridden.
- Installable as a PWA (manifest + service worker via `vite-plugin-pwa`) — on a phone, "Add to Home
  Screen" gives it a real app icon and a standalone window with no browser chrome, and it opens
  instantly from cache even before the API responds. It always fetches live data over the network
  though — the service worker deliberately never caches `/api/*`, so it won't show stale stock or
  prices. To change the app icon or name later, edit `frontend/public/icon-master.svg` and the
  `manifest` block in `frontend/vite.config.js`, then regenerate the PNGs with
  `npm install -D sharp && node scripts/generate-icons.mjs` (uninstall `sharp` again afterward —
  it's a one-off tool, not a runtime dependency).

## Prerequisites

- Node.js 18+
- A PostgreSQL database. Two easy options:
  - **Local via Docker:** `docker compose up -d` (uses `docker-compose.yml` at the repo root)
  - **Free hosted Postgres:** [Neon](https://neon.tech) — create a project, copy the connection
    string. Neon gives you two: use the **pooled** one (has `-pooler` in the hostname) for the app,
    since serverless/Vercel deployments open many short-lived connections.

## Local Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — any long random string
- `RESEND_API_KEY` — optional locally; without it, "Email Receipt" returns a clear error instead of
  silently failing. Get a free key at [resend.com](https://resend.com) to enable it.

```bash
npx prisma migrate dev --name init   # creates tables
npm run seed                          # demo org, stores, products, sales, expenses
npm run dev                           # starts the API on http://localhost:4000
```

Demo logins (password for all: `password123`):
- `admin@demo.com` — Admin, all stores
- `manager@demo.com` — Manager, Accra Branch only
- `cashier@demo.com` — Cashier, Accra + Kumasi branches

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api to localhost:4000
```

Open http://localhost:5173 and sign in with a demo account, or use **Create an account** to bootstrap
a brand-new organization (this creates its first Admin user; add stores from Stores → Add Store
afterward).

## Deployment

### Database

Use a Neon (or Supabase) Postgres project. Run migrations against it once from your machine:

```bash
cd backend
DATABASE_URL="<production-pooled-url>" npx prisma migrate deploy
```

### Backend (Vercel)

The backend is set up to run as a single Vercel serverless function:
- `backend/api/index.js` exports the Express app; `backend/vercel.json` routes all requests to it.
- Deploy the `backend/` folder as its own Vercel project.
- Set environment variables in the Vercel dashboard: `DATABASE_URL` (pooled), `JWT_SECRET`,
  `CORS_ORIGIN` (your deployed frontend URL), `RESEND_API_KEY`, `RECEIPT_FROM_EMAIL`.
- Vercel's build runs `npm run prisma:generate` (configured in `vercel.json`) so the Prisma client
  matches Vercel's Linux runtime.

If you'd rather run a normal long-lived Node server instead (Render, Railway, Fly.io, a VPS), that
works unmodified too — just run `npm run start` after `npm run prisma:deploy`; nothing here is
Vercel-specific beyond the two files above.

### Frontend (Vercel)

- Deploy the `frontend/` folder as its own Vercel project (framework preset: Vite).
- Set an environment variable or edit `vite.config.js`'s dev proxy is dev-only — in production the
  frontend calls `/api/...` on its own domain, so put the backend behind the **same domain** (e.g.
  via a Vercel rewrite in the frontend project to your backend project's URL), or set
  `VITE_API_BASE_URL` and update `frontend/src/services/api.js` to use it if you deploy the API on a
  different domain.

## MikroTik Voucher Integration (optional)

If a store sells internet vouchers off a MikroTik hotspot router, that router can report sales
into this system directly, so they show up in the same dashboard/reports as everything else —
each store maps 1:1 to a router, each hotspot user-profile (e.g. "24hours") maps to a Product,
and each voucher redemption becomes stock sold.

**Setup:**
1. As an admin, go to **Settings → MikroTik Integration**, pick the store, and generate a token
   (shown once — copy it immediately).
2. On the same page, map each MikroTik profile name to a Product (create the Products first under
   **Inventory → Products** if they don't exist yet — price them there too, since the router never
   sends a price, this system's Product price is always what's used).
3. Add two small blocks to the router's existing hotspot scripts (see in-app page for the exact
   endpoints/snippets): one in the on-login/voucher-redeemed script, one in the end-of-day script.
   Both are wrapped in `on-error` so a brief network hiccup never breaks the router's existing
   Telegram notifications — it just skips that one report and logs a warning.

**How it works:** a redemption is recorded and its stock deducted **immediately** (so "vouchers
remaining" stays live all day), but the revenue is only booked once — when the *router's own*
end-of-day script calls the close-day endpoint, all of that store's not-yet-invoiced redemptions
for the day are rolled into one Sale per plan (`source: MIKROTIK` on the Sale, so it's
distinguishable from POS sales if needed later). A nightly job in `backend/src/jobs/
voucherCloseOut.job.js` also runs as a safety net in case the router's own trigger doesn't fire —
only meaningful if the backend runs as a persistent server (not a serverless deployment); on
Vercel, wire `POST /api/integrations/mikrotik/close-day-all` (auth: `X-Cron-Secret` header, see
`CRON_SECRET` in `.env.example`) to Vercel Cron instead.

**Deliberately not built:** live stock-in tracking from voucher *generation*. That would need
either editing the generation tool's own source to call this system's API, or a poller reaching
into the router's RouterOS API — the latter needs the router's API port reachable from wherever
this backend runs, which usually means a VPS/VPN, not a two-router small-business setup. Simplest
path for now: top up stock manually (**Inventory → Stock Adjustments**) whenever a new voucher
batch is generated.

## Known Simplifications (MVP scope)

These are deliberate to keep the system simple, per the project's own "don't over-engineer" goal:

- Refunds/cancellations are whole-sale (no partial-item refunds).
- Payment methods are a fixed list (Cash, Mobile Money, Card, Bank Transfer, Other) rather than
  admin-configurable.
- Product/receipt images are pasted URLs, not a file upload pipeline — this avoids needing an
  object-storage integration (S3, Vercel Blob, etc.) for an MVP; add one later if needed.
- Reports use the server's local timezone for date-range boundaries (no per-organization timezone
  setting yet).
- Negative inventory is always blocked (the spec's optional "allow negative stock" override was
  left out as an unnecessary toggle for a first version).

## Verifying the Full Business Logic Loop

A quick end-to-end smoke test after seeding:
1. Log in as `admin@demo.com`, open **New Sale**, pick a store, add a product, complete a cash sale.
2. Check **Stock** for that store — quantity should have dropped by the sale quantity.
3. Open **Sales History**, refund that sale — stock should be restored, and the Dashboard's
   "Net Sales" should exclude it.
4. Try the same sale as `cashier@demo.com` on **Takoradi Branch** (a store they don't have access
   to) — the API rejects it with 403, proving store-level access control is enforced server-side.
