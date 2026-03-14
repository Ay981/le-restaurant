# POS Build Roadmap
**Stack:** Next.js 14 · Supabase · Tailwind CSS · TypeScript · Vercel

---

## Phase 1 — Environment Setup
**Timeline: Day 1**

- [ ] Install Node.js, VS Code, Git
- [ ] Create Next.js 14 app with TypeScript + Tailwind
  ```bash
  npx create-next-app@latest pos-app --typescript --tailwind
  ```
- [ ] Create Supabase project, grab API keys
- [ ] Install Supabase JS client
  ```bash
  npm i @supabase/supabase-js
  ```
- [ ] Connect Next.js to Supabase via `.env.local`
  ```env
  NEXT_PUBLIC_SUPABASE_URL=your_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
  ```

> **Tip:** Run `npx create-next-app@latest pos-app --typescript --tailwind` — you're good to go in 5 mins.

---

## Phase 2 — Database Schema
**Timeline: Day 2**

- [ ] Create tables: `restaurants`, `categories`, `products`, `orders`, `order_items`
- [ ] Set up foreign keys and relationships in Supabase dashboard
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Seed database with dummy menu items to test with

> **Tip:** The core tables you need — `products` belongs to `categories`, `order_items` belongs to `orders` and `products`. Get this right early to avoid painful migrations later.

---

## Phase 3 — Auth + Layout
**Timeline: Days 3–4**

- [ ] Set up Supabase auth (email/password login)
- [ ] Create `/login` page and protect dashboard routes
- [ ] Build the main app shell: sidebar, top bar, layout
- [ ] Set up Next.js App Router folder structure
  ```
  app/
  ├── (auth)/
  │   └── login/
  ├── (dashboard)/
  │   ├── menu/
  │   ├── dashboard/
  │   └── settings/
  └── layout.tsx
  ```

> **Tip:** Use `@supabase/ssr` package for Next.js — handles cookies and session automatically.

---

## Phase 4 — Menu + Ordering
**Timeline: Days 5–8**

- [ ] Fetch and display menu items by category
- [ ] Build order cart with add/remove/quantity logic (use `useState`)
- [ ] Create order on Supabase when customer checks out
- [ ] Build confirmation modal with order summary
- [ ] Handle order status: `pending` → `cooking` → `done`

> **Tip:** Store cart state in `useState` or Zustand — no need for a database until the user hits checkout.

---

## Phase 5 — Real-Time Orders
**Timeline: Days 9–10**

- [ ] Subscribe to orders table with Supabase real-time
  ```js
  supabase
    .channel('orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
    .subscribe()
  ```
- [ ] Build kitchen display screen — live order feed
- [ ] Update order status from kitchen in real-time

> **Tip:** `supabase.channel('orders').on('postgres_changes', ...)` — this is the magic line for live updates.

---

## Phase 6 — Dashboard + Analytics
**Timeline: Days 11–13**

- [ ] Build stats cards: revenue, order count, top items
- [ ] Use Supabase aggregate queries for totals
- [ ] Add Recharts for order report graphs
  ```bash
  npm i recharts
  ```
- [ ] Build most-ordered items list

> **Tip:** Recharts is drop-in and works great with Tailwind dark mode. Great for bar charts, line graphs, and donuts.

---

## Phase 7 — Settings + Deploy
**Timeline: Days 14–15**

- [ ] Build settings page: restaurant profile, preferences
- [ ] Add product manager: create/edit/delete menu items
- [ ] Push code to GitHub
- [ ] Deploy to Vercel — import repo, add env vars, ship it
- [ ] Test everything on a real device, fix bugs

> **Tip:** Vercel auto-deploys on every `git push`. Your POS is live in under 2 mins.

---

## Quick Reference

| Phase | Focus | Duration |
|-------|-------|----------|
| 1 | Environment setup | Day 1 |
| 2 | Database schema | Day 2 |
| 3 | Auth + layout | Days 3–4 |
| 4 | Menu + ordering | Days 5–8 |
| 5 | Real-time orders | Days 9–10 |
| 6 | Dashboard + analytics | Days 11–13 |
| 7 | Settings + deploy | Days 14–15 |

---

## Skills You'll Gain

- **Database design** — modeling real relationships, foreign keys, migrations
- **API design** — REST patterns, query optimization, avoiding over-fetching
- **State management** — local vs global state, Zustand, React Context
- **Real-time architecture** — WebSockets, pub/sub, event-driven updates
- **Auth & security** — RLS, protected routes, session handling
- **Frontend architecture** — component composition, Next.js App Router
- **Performance thinking** — caching, pagination, smarter queries
- **DevOps basics** — env vars, GitHub, Vercel deployment pipelines