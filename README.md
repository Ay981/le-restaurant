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
	component/
		Card.tsx                  # Reusable dish card
		homepage/
			Header.tsx              # Top header with title, date, and search
			MenuSection.tsx         # Left content area with categories and cards
			OrdersPanel.tsx         # Right-side order summary panel
			Sidenav.tsx             # Sidebar navigation
	lib/
		data.ts                   # Shared mock data + related TypeScript types
	layout.tsx                  # Root layout
	page.tsx                    # Main page composition
	globals.css                 # Global styles
```

## Data Organization

All page content is stored in [app/lib/data.ts](app/lib/data.ts), including:

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

## Available Scripts

```bash
npm run dev     # Start development server
npm run build   # Create production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Customization Guide

### Update restaurant information
Edit `restaurantInfo` in [app/lib/data.ts](app/lib/data.ts).

### Change menu categories
Edit `categories` in [app/lib/data.ts](app/lib/data.ts).

### Add or update dishes
Edit the `dishes` array in [app/lib/data.ts](app/lib/data.ts).

### Change order panel content
Edit `orderTypes`, `orderItems`, and `orderSummary` in [app/lib/data.ts](app/lib/data.ts).

### Update styling
Main layout and UI styling lives in:

- [app/page.tsx](app/page.tsx)
- [app/component/Card.tsx](app/component/Card.tsx)
- [app/component/homepage/Header.tsx](app/component/homepage/Header.tsx)
- [app/component/homepage/MenuSection.tsx](app/component/homepage/MenuSection.tsx)
- [app/component/homepage/OrdersPanel.tsx](app/component/homepage/OrdersPanel.tsx)
- [app/component/homepage/Sidenav.tsx](app/component/homepage/Sidenav.tsx)

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
