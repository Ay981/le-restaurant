# My Restaurant POS Dashboard

A modern restaurant POS-style dashboard built with Next.js, React, TypeScript, and Tailwind CSS.

The UI is inspired by a food ordering/admin dashboard layout and includes:

- a left navigation sidebar,
- a menu browsing area,
- a dish card grid,
- and a right-side orders summary panel.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Icons
- Supabase JavaScript SDK

## Features

- Full-screen POS dashboard layout
- Reusable homepage components
- Centralized mock data in a dedicated data module
- Responsive menu area with reusable dish cards
- Orders panel with item list, quantity, note field, totals, and payment CTA

## Project Structure

Key files and folders:

```text
app/
	layout.tsx                  # Root layout
	page.tsx                    # Main page composition
	globals.css                 # Global styles
components/
	Card.tsx                    # Reusable dish card
	homepage/
		Header.tsx                # Top header with title, date, and search
		MenuSection.tsx           # Left content area with categories and cards
		OrdersPanel.tsx           # Right-side order summary panel
	navigation/
		Sidenav.tsx               # Sidebar navigation
lib/
	data.ts                     # Shared mock data + related TypeScript types
	supabase/
		client.ts                 # Browser Supabase client helper
		server.ts                 # Server Supabase client helper
```

## Data Organization

All page content is stored in [lib/data.ts](lib/data.ts), including:

- `restaurantInfo`
- `categories`
- `dishes`
- `orderTypes`
- `orderItems`
- `orderSummary`

This keeps presentation components focused on UI and makes the project easier to scale.

## Components Overview

### `Sidenav`
Renders the left navigation rail with the logo, menu icons, and logout button.

### `Header`
Renders the restaurant title, date, and search input.

### `MenuSection`
Renders the categories tabs, section heading, dining selector, and dish list.

### `Card`
Displays a single dish with image, title, price, and availability.

### `OrdersPanel`
Renders the active order view, order type buttons, order rows, totals, and checkout button.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a Supabase project in your dashboard.
2. Copy `.env.example` to `.env.local`.
3. Fill in these values from Supabase project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Client helpers are ready to use:

- Browser/client components: `lib/supabase/client.ts`
- Server components/actions/routes: `lib/supabase/server.ts`

Example usage in a server component or route handler:

```ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabase = createServerSupabaseClient();
const { data, error } = await supabase.from("dishes").select("*");
```

## Database Setup (Tables)

Initial schema is provided in:

- [supabase/migrations/20260319_init_restaurant_schema.sql](supabase/migrations/20260319_init_restaurant_schema.sql)
- [supabase/migrations/20260319_seed_dishes.sql](supabase/migrations/20260319_seed_dishes.sql)

Apply it using either option:

1. Supabase Dashboard SQL Editor
	- Open SQL Editor in your Supabase project.
	- Paste and run the migration SQL file.

2. Supabase CLI (if installed)

```bash
npx supabase login
npx supabase link --project-ref <YOUR_PROJECT_REF>
npx supabase db push
```

If `supabase` is not installed globally, always use `npx supabase ...`.

Find `<YOUR_PROJECT_REF>` in Supabase Dashboard URL:

`https://supabase.com/dashboard/project/<PROJECT_REF>/...`

This creates core tables:

- `categories`
- `dishes`
- `orders`
- `order_items`

The seed migration inserts initial menu dishes from current mock data and is safe to re-run.

## Available Scripts

```bash
npm run dev     # Start development server
npm run build   # Create production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Customization Guide

### Update restaurant information
Edit `restaurantInfo` in [lib/data.ts](lib/data.ts).

### Change menu categories
Edit `categories` in [lib/data.ts](lib/data.ts).

### Add or update dishes
Edit the `dishes` array in [lib/data.ts](lib/data.ts).

### Change order panel content
Edit `orderTypes`, `orderItems`, and `orderSummary` in [lib/data.ts](lib/data.ts).

### Update styling
Main layout and UI styling lives in:

- [app/page.tsx](app/page.tsx)
- [components/Card.tsx](components/Card.tsx)
- [components/homepage/Header.tsx](components/homepage/Header.tsx)
- [components/homepage/MenuSection.tsx](components/homepage/MenuSection.tsx)
- [components/homepage/OrdersPanel.tsx](components/homepage/OrdersPanel.tsx)
- [components/navigation/Sidenav.tsx](components/navigation/Sidenav.tsx)

## Notes

- Images are served from the `public/` directory and should be referenced with root-relative paths like `/image/pizza.png`.
- The current data is mock data intended for UI prototyping.
- The current layout is componentized and ready for future state management or API integration.

## Possible Next Improvements

- add interactive category filtering,
- connect the order panel to live state,
- replace mock data with API data,
- improve metadata in [app/layout.tsx](app/layout.tsx),
- add tests for UI components.
