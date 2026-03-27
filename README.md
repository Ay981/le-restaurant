# My Restaurant v2 POS Dashboard

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
- Admin order operations: accept, reject (with reason), mark delivered
- Admin manual receipt review (accept/reject) with payment verification context
- Receipt verification endpoint with replay protection
- Customer personalization (previous orders + suggestions)
- Guided chatbot recommendations with Gemini fallback

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

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
RECOMMEND_RATE_LIMIT_PER_MINUTE=20
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
- [supabase/migrations/202603220100_orders_workflow_and_staff.sql](supabase/migrations/202603220100_orders_workflow_and_staff.sql)
- [supabase/migrations/202603220200_clear_payment_data.sql](supabase/migrations/202603220200_clear_payment_data.sql)
- [supabase/migrations/202603220210_clear_payment_data_again.sql](supabase/migrations/202603220210_clear_payment_data_again.sql)
- [supabase/migrations/202603220300_order_feedback_and_notifications.sql](supabase/migrations/202603220300_order_feedback_and_notifications.sql)
- [supabase/migrations/202603230100_order_feedback_updated_at_trigger.sql](supabase/migrations/202603230100_order_feedback_updated_at_trigger.sql)
- [supabase/migrations/202603230200_customer_messages.sql](supabase/migrations/202603230200_customer_messages.sql)
- [supabase/migrations/202603230300_receipt_metadata_and_match_checks.sql](supabase/migrations/202603230300_receipt_metadata_and_match_checks.sql)
- [supabase/migrations/202603270100_receipt_review_and_staff_notifications.sql](supabase/migrations/202603270100_receipt_review_and_staff_notifications.sql)
- [supabase/migrations/202603270200_order_admin_decision_note.sql](supabase/migrations/202603270200_order_admin_decision_note.sql)
- [supabase/migrations/202603270300_security_policy_hardening.sql](supabase/migrations/202603270300_security_policy_hardening.sql)
- [supabase/migrations/202603270400_api_rate_limit.sql](supabase/migrations/202603270400_api_rate_limit.sql)

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
- [app/api/admin/orders/route.ts](app/api/admin/orders/route.ts): list active/recent orders for admin board
- [app/api/admin/orders/[id]/status/route.ts](app/api/admin/orders/[id]/status/route.ts): status transitions (`pending -> in_progress -> delivered`, `pending -> rejected` with reason)
- [app/api/admin/orders/[id]/receipt-review/route.ts](app/api/admin/orders/[id]/receipt-review/route.ts): manual receipt decision (`accepted`/`rejected`) and review notes

Both endpoints support JSON and multipart payloads. Multipart requests can include `imageFile`, which uploads to Supabase Storage via [lib/supabase/dish-image-upload.ts](lib/supabase/dish-image-upload.ts).

## Receipt Verification

Route:

- [app/api/payments/verify-receipt/route.ts](app/api/payments/verify-receipt/route.ts)

Route-local verification internals:

- [app/api/payments/verify-receipt/_lib/constants.ts](app/api/payments/verify-receipt/_lib/constants.ts)
- [app/api/payments/verify-receipt/_lib/helpers.ts](app/api/payments/verify-receipt/_lib/helpers.ts)
- [app/api/payments/verify-receipt/_lib/types.ts](app/api/payments/verify-receipt/_lib/types.ts)

Duplicate/replay protection is enforced through unique receipt and transaction-reference persistence in `payment_receipt_verifications`.

## AI Recommendation Chatbot

UI:

- [components/homepage/RecommendationChat.tsx](components/homepage/RecommendationChat.tsx)

API:

- [app/api/chat/recommend/route.ts](app/api/chat/recommend/route.ts)

Behavior:

- asks guided preference questions (favorite recipe, cuisine, spice level, budget, dietary, meal type, occasion, protein type, restrictions),
- returns up to 5 dish recommendations,
- supports direct “Add to order” actions,
- supports “For You” preference mode for authenticated users using previous order history,
- uses Gemini when configured, and falls back to rule-based ranking if Gemini is unavailable.

## Admin Order Workflow

- Admin/staff review full order details (items, customer info, delivery address, payment summary, receipt metadata, and upload preview).
- Receipt can be manually accepted/rejected when pending review.
- Pending orders can be accepted or rejected (rejection requires a reason).
- Accepted orders can be marked as delivered.
- Rejection notes are persisted and shown to customers in `my-orders`.

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
