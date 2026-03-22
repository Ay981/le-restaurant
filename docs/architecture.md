# Architecture

This document describes the technology stack, project structure, and key design decisions of Le Restaurant.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | [Next.js](https://nextjs.org/) (App Router) | 16.1.6 |
| UI Library | [React](https://react.dev/) | 19.2.3 |
| Language | [TypeScript](https://www.typescriptlang.org/) | 5.x |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.x |
| Database & Auth | [Supabase](https://supabase.com/) | JS SDK 2.99.x |
| Charts | [Recharts](https://recharts.org/) | 3.8.x |
| Icons | [React Icons](https://react-icons.github.io/react-icons/) | 5.6.x |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) | 2.0.x |
| PDF Parsing | [pdf-parse](https://www.npmjs.com/package/pdf-parse) | 2.4.x |

## Project Structure

```
le-restaurant/
├── app/                            # Next.js App Router
│   ├── _components/                # Route-local shared components
│   │   ├── homepage/               # Homepage UI (menu, orders, chat)
│   │   └── payments/               # Payment modal and receipt upload
│   ├── admin/                      # Admin dashboard
│   │   ├── _components/            # Admin-specific UI components
│   │   │   ├── layout/             # Admin sidebar rail
│   │   │   ├── modals/             # Create/Edit dish modals
│   │   │   ├── panels/             # Products, Analytics, Settings panels
│   │   │   └── skeletons/          # Loading skeletons
│   │   ├── _hooks/                 # Admin custom hooks
│   │   ├── analytics/              # Admin analytics page
│   │   ├── orders/                 # Admin orders management page
│   │   └── settings/               # Admin settings page
│   ├── api/                        # API route handlers
│   │   ├── admin/
│   │   │   ├── dishes/             # Admin dish CRUD (POST, PATCH)
│   │   │   └── orders/             # Admin order listing & status updates
│   │   ├── chat/recommend/         # AI recommendation endpoint
│   │   ├── dishes/search/          # Public dish search
│   │   ├── orders/                 # Customer order creation
│   │   └── payments/verify-receipt/# Receipt verification
│   ├── create-account/             # User registration page
│   ├── orders/                     # Order confirmation & payment page
│   │   ├── _components/            # Order page panels
│   │   └── _hooks/                 # Payment form hooks
│   ├── sign-in/                    # Sign-in page
│   ├── layout.tsx                  # Root layout (fonts, analytics)
│   ├── page.tsx                    # Homepage (server component)
│   ├── globals.css                 # Global styles
│   └── not-found.tsx               # 404 page
├── components/                     # Shared reusable components
│   ├── auth/                       # AuthGate component
│   ├── homepage/                   # Shared homepage components
│   ├── navigation/                 # Sidenav and navigation items
│   └── ui/                         # Generic UI primitives (Skeleton)
├── lib/                            # Shared utilities and clients
│   ├── currency.ts                 # Currency formatting
│   ├── data.ts                     # Type definitions and fallback data
│   └── supabase/                   # Supabase client factories
│       ├── admin.ts                # Service-role client (server-only)
│       ├── admin-route-auth.ts     # Role-based API route auth guards
│       ├── client.ts               # Browser client (singleton)
│       ├── dish-image-upload.ts    # Storage upload helper
│       └── server.ts               # Server client (anon key)
├── public/                         # Static assets
│   └── image/                      # Fallback dish images
├── supabase/                       # Supabase configuration
│   └── migrations/                 # SQL migration files
├── docs/                           # Project documentation
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── eslint.config.mjs               # ESLint configuration
├── postcss.config.mjs              # PostCSS configuration
└── package.json                    # Dependencies and scripts
```

## Design Decisions

### Server vs. Client Components

The app uses Next.js App Router conventions:

- **Server Components** (default): Pages like `app/page.tsx` fetch data from Supabase on the server and pass it to client components as props. This keeps API keys off the client and improves initial load performance.
- **Client Components** (`"use client"`): Interactive components like `HomeDashboard`, `RecommendationChat`, and `PaymentModal` use React state and browser APIs.

### Supabase Client Strategy

Three distinct Supabase clients are used depending on context:

| Client | File | Use Case |
|--------|------|----------|
| **Browser** | `lib/supabase/client.ts` | Client components (auth session, real-time) |
| **Server** | `lib/supabase/server.ts` | Server components (read-only data fetching) |
| **Admin** | `lib/supabase/admin.ts` | API routes requiring elevated access (service-role key) |

### Graceful Fallbacks

The app is designed to work even when external services are unavailable:

- **Menu data:** If Supabase is unreachable, the homepage renders hardcoded fallback dishes from `lib/data.ts`.
- **AI recommendations:** If the Gemini API key is missing or the API fails, the system falls back to a rule-based recommendation engine.
- **Receipt verification:** The endpoint tries multiple verification provider URLs and retries on transient failures.

### Route-Local Organization

Components, hooks, and utilities that belong exclusively to a specific route are co-located using the `_components/`, `_hooks/`, and `_lib/` naming convention. The underscore prefix prevents Next.js from treating these directories as route segments.

### Image Handling

- **Local fallbacks:** Static images in `public/image/` serve as default dish images.
- **Remote images:** Supabase Storage public URLs are allowed through `images.remotePatterns` in `next.config.ts`. The config dynamically detects the Supabase host from `NEXT_PUBLIC_SUPABASE_URL`.

### Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

This allows clean imports like `@/lib/supabase/client` and `@/components/navigation/Sidenav`.
