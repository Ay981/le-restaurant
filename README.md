# My Restaurant POS Dashboard

A restaurant POS-style dashboard built with Next.js, React, TypeScript, Tailwind, and Supabase.
The app currently includes:

- guest ordering flow,
- optional customer authentication with personalized insights,
- admin-only category/dish management,
- receipt verification for transfer payments,
- Supabase Storage-backed dish image uploads.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase JavaScript SDK

## Core Features

- POS dashboard layout with navigation, menu, and order panel
- Supabase-backed categories, dishes, orders, and order items
- Admin management UI with modal create/edit flows
- Admin-only API routes for dish create/update
- Receipt verification endpoint with replay protection
- Customer personalization (previous orders + suggestions)

## Project Structure

```text
app/
	admin/
		_components/                    # Route-local admin UI components
		page.tsx                        # Admin management page
	api/
		admin/
			dishes/
				_lib/                       # Shared parsing/types for admin dish APIs
				route.ts                    # POST create dish
				[id]/route.ts               # PATCH update dish
		payments/
			verify-receipt/
				_lib/                       # Verification constants/helpers/types
				route.ts                    # Receipt verification orchestration
	orders/
		_components/                    # Route-local order page panels
		page.tsx
	create-account/page.tsx
	sign-in/page.tsx
	page.tsx

components/
	homepage/
	navigation/
	orders/

lib/
	currency.ts
	data.ts                           # Shared UI data/fallback values
	supabase/
		admin.ts                        # Service-role client
		admin-route-auth.ts             # Admin auth verification for API routes
		client.ts                       # Browser client
		server.ts                       # Server client
		dish-image-upload.ts            # Storage upload helper

supabase/migrations/
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Environment Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

RECEIPT_VERIFY_URL=https://verifyapi.leulzenebe.pro/verify-image
RECEIPT_VERIFY_API_KEY=...
```

## Database Setup (Supabase)

Apply migrations with CLI:

```bash
npx supabase login
npx supabase link --project-ref <YOUR_PROJECT_REF>
npx supabase db push
```

Current migration set:

- [supabase/migrations/202603190100_baseline_restaurant_schema.sql](supabase/migrations/202603190100_baseline_restaurant_schema.sql)
- [supabase/migrations/202603190200_payment_receipt_verifications.sql](supabase/migrations/202603190200_payment_receipt_verifications.sql)
- [supabase/migrations/202603190300_auth_personalization_and_admin_policies.sql](supabase/migrations/202603190300_auth_personalization_and_admin_policies.sql)
- [supabase/migrations/202603190400_promote_admin_function.sql](supabase/migrations/202603190400_promote_admin_function.sql)

Main tables:

- `categories`
- `dishes`
- `orders`
- `order_items`
- `payment_receipt_verifications`
- `profiles`

## Authentication and Roles

- Guests can browse and place orders.
- Signed-in users get personalized insights (previous orders and dish suggestions).
- Orders are linked to `customer_user_id` when authenticated.
- Admin write operations are protected by role checks and RLS policies.

Admin promotion function is available in the migration above (`public.promote_user_to_admin`).

## Admin Management APIs

- [app/api/admin/dishes/route.ts](app/api/admin/dishes/route.ts): create dish (admin only)
- [app/api/admin/dishes/[id]/route.ts](app/api/admin/dishes/[id]/route.ts): update dish (admin only)

Both endpoints support JSON and multipart payloads. Multipart requests can include `imageFile`, which uploads to Supabase Storage via [lib/supabase/dish-image-upload.ts](lib/supabase/dish-image-upload.ts).

## Receipt Verification

Route:

- [app/api/payments/verify-receipt/route.ts](app/api/payments/verify-receipt/route.ts)

Route-local verification internals:

- [app/api/payments/verify-receipt/_lib/constants.ts](app/api/payments/verify-receipt/_lib/constants.ts)
- [app/api/payments/verify-receipt/_lib/helpers.ts](app/api/payments/verify-receipt/_lib/helpers.ts)
- [app/api/payments/verify-receipt/_lib/types.ts](app/api/payments/verify-receipt/_lib/types.ts)

Duplicate/replay protection is enforced through unique receipt and transaction-reference persistence in `payment_receipt_verifications`.

## Images and Next.js Config

- Local fallback images are in `public/image`.
- Supabase Storage public URLs are supported through `images.remotePatterns` in [next.config.ts](next.config.ts).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current Notes

- Build is currently healthy after refactors.
- If Next.js warns about workspace root/lockfiles, set `turbopack.root` in [next.config.ts](next.config.ts) or clean extra lockfiles outside this project.
