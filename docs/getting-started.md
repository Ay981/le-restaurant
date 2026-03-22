# Getting Started

This guide walks you through setting up Le Restaurant locally for development.

## Prerequisites

- **Node.js** &ge; 20 (LTS recommended)
- **npm** (ships with Node.js)
- A **Supabase** project ([create one free](https://supabase.com/dashboard))
- *(Optional)* A **Gemini API key** for AI-powered dish recommendations
- *(Optional)* A **receipt verification API key** for bank-transfer payment verification

## 1. Clone the Repository

```bash
git clone https://github.com/Ay981/le-restaurant.git
cd le-restaurant
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Environment Variables

Copy the example file and fill in the required values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set the following variables:

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only, never exposed to the browser) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI recommendations | Falls back to rule-based engine |
| `GOOGLE_API_KEY` | Alternative key name for Gemini | &mdash; |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.0-flash` |
| `GEMINI_FALLBACK_MODELS` | Comma-separated fallback model names | `gemini-1.5-flash` |
| `RECEIPT_VERIFY_URL` | Image-based receipt verification endpoint | `https://verifyapi.leulzenebe.pro/verify-image` |
| `RECEIPT_VERIFY_UNIVERSAL_URL` | PDF/reference-based verification endpoint | `https://verifyapi.leulzenebe.pro/verify` |
| `RECEIPT_VERIFY_API_KEY` | API key for the receipt verification service | &mdash; |

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` grants full database access. Never expose it in client-side code or commit it to version control.

## 4. Database Setup

The project uses Supabase migrations to manage the database schema. Apply them with the Supabase CLI:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Authenticate
npx supabase login

# Link to your project
npx supabase link --project-ref <YOUR_PROJECT_REF>

# Apply all migrations
npx supabase db push
```

This will create all tables, enums, RLS policies, triggers, seed data, and functions. See [Database Schema](./database-schema.md) for details.

### Migration Files

| Migration | Purpose |
|-----------|---------|
| `202603190100_baseline_restaurant_schema.sql` | Core tables (categories, dishes, orders, order_items), RLS, triggers, seed data |
| `202603190200_payment_receipt_verifications.sql` | Payment receipt verification table with uniqueness constraints |
| `202603190300_auth_personalization_and_admin_policies.sql` | Profiles table, auth triggers, admin RLS policies, order ownership |
| `202603190400_promote_admin_function.sql` | `promote_user_to_admin()` function with bootstrap support |
| `202603220100_orders_workflow_and_staff.sql` | Staff role, order workflow columns, delivery constraints, audit log |

## 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 6. Create Your First Admin Account

1. Navigate to `/create-account` and register a new user.
2. Open the Supabase SQL Editor and run:

```sql
SELECT public.promote_user_to_admin('your-email@example.com');
```

> The first admin can bootstrap by promoting their own account. After that, only existing admins can promote others. See [Authentication & Roles](./authentication-and-roles.md) for details.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
