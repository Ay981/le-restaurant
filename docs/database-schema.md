# Database Schema

Le Restaurant uses [Supabase](https://supabase.com/) (PostgreSQL) as its database. The schema is managed through SQL migration files in `supabase/migrations/`.

## Entity Relationship Overview

```
┌────────────┐       ┌────────────┐
│ categories │───┐   │  profiles   │
└────────────┘   │   └────────────┘
                 │         │
                 ▼         │ (customer_user_id)
┌────────────┐       ┌────────────┐       ┌──────────────────────────────┐
│   dishes   │       │   orders   │──────▶│ payment_receipt_verifications │
└────────────┘       └────────────┘       └──────────────────────────────┘
                          │
                          ▼
                    ┌─────────────┐       ┌──────────────────────┐
                    │ order_items │       │ order_status_audit    │
                    └─────────────┘       └──────────────────────┘
                                                   ▲
                                                   │
                                              (order_id)
```

## Enums

### `order_type`

| Value | Description |
|-------|-------------|
| `dine_in` | Customer eats at the restaurant |
| `to_go` | Customer takes the order to go |
| `delivery` | Order is delivered to an address |

### `order_status`

| Value | Description |
|-------|-------------|
| `pending` | Order placed, not yet started |
| `preparing` | Kitchen is preparing the order |
| `served` | Order has been served |
| `completed` | Order fully completed |
| `cancelled` | Order was cancelled |

### `app_role`

| Value | Description |
|-------|-------------|
| `customer` | Default role for all users |
| `staff` | Can view and manage order statuses |
| `admin` | Full access: manage dishes, categories, orders, and promote users |

## Tables

### `categories`

Stores menu categories (e.g., "Hot Dishes", "Soup", "Dessert").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-generated | Unique identifier |
| `name` | `text` | NOT NULL, UNIQUE | Category display name |
| `sort_order` | `integer` | NOT NULL, default `0` | Display ordering |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |

### `dishes`

Stores individual menu items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, auto-generated | Unique identifier |
| `category_id` | `bigint` | FK &rarr; `categories.id`, ON DELETE SET NULL | Associated category |
| `title` | `text` | NOT NULL, UNIQUE | Dish name |
| `description` | `text` | &mdash; | Optional description |
| `price` | `numeric(10,2)` | NOT NULL, CHECK &ge; 0 | Price in USD |
| `image_url` | `text` | &mdash; | Image URL (Supabase Storage or local fallback) |
| `availability_count` | `integer` | NOT NULL, default `0`, CHECK &ge; 0 | Number of servings available |
| `is_active` | `boolean` | NOT NULL, default `true` | Whether the dish is visible on the menu |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update (auto-set by trigger) |

**Indexes:** `idx_dishes_category_id`, `idx_dishes_is_active`

### `orders`

Stores customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, auto-generated | Unique identifier |
| `order_number` | `text` | NOT NULL, UNIQUE | Human-readable order number (e.g., `ORD-1711234567890-123`) |
| `order_type` | `order_type` | NOT NULL, default `'dine_in'` | Dine in, to go, or delivery |
| `status` | `order_status` | NOT NULL, default `'pending'` | Current order status |
| `note` | `text` | &mdash; | Optional order note |
| `discount` | `numeric(10,2)` | NOT NULL, default `0`, CHECK &ge; 0 | Discount amount |
| `subtotal` | `numeric(10,2)` | NOT NULL, default `0`, CHECK &ge; 0 | Sum of line items |
| `total` | `numeric(10,2)` | GENERATED ALWAYS AS `greatest(subtotal - discount, 0)` | Computed total |
| `customer_user_id` | `uuid` | FK &rarr; `auth.users.id`, ON DELETE SET NULL | Authenticated customer (nullable for guests) |
| `started_at` | `timestamptz` | &mdash; | When preparation started |
| `delivered_at` | `timestamptz` | &mdash; | When order was delivered/served |
| `delivery_address` | `text` | &mdash; | Delivery destination (required for delivery orders) |
| `customer_name` | `text` | &mdash; | Customer name (required for delivery orders) |
| `customer_phone` | `text` | &mdash; | Customer phone (required for delivery orders) |
| `last_status_changed_by` | `uuid` | FK &rarr; `auth.users.id` | Staff/admin who last changed the status |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update (auto-set by trigger) |

**Constraints:**
- `orders_delivery_fields_required` &mdash; ensures delivery orders have `delivery_address`, `customer_name`, and `customer_phone`

**Indexes:** `idx_orders_status`, `idx_orders_created_at`, `idx_orders_customer_user_id`, `idx_orders_started_at`, `idx_orders_delivered_at`

### `order_items`

Stores individual line items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, auto-generated | Unique identifier |
| `order_id` | `uuid` | NOT NULL, FK &rarr; `orders.id`, ON DELETE CASCADE | Parent order |
| `dish_id` | `uuid` | FK &rarr; `dishes.id`, ON DELETE RESTRICT | Referenced dish (nullable) |
| `dish_title_snapshot` | `text` | NOT NULL | Dish title at time of order (immutable snapshot) |
| `unit_price` | `numeric(10,2)` | NOT NULL, CHECK &ge; 0 | Price per unit at time of order |
| `quantity` | `integer` | NOT NULL, CHECK > 0 | Quantity ordered |
| `line_total` | `numeric(12,2)` | GENERATED ALWAYS AS `unit_price * quantity` | Computed line total |
| `note` | `text` | &mdash; | Item-specific note |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |

**Indexes:** `idx_order_items_order_id`

### `payment_receipt_verifications`

Tracks verified payment receipts with replay/duplicate protection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, auto-generated | Unique identifier |
| `order_number` | `text` | NOT NULL | Associated order number |
| `provider` | `text` | NOT NULL, default `'verify.leul.et'` | Verification provider |
| `transaction_reference` | `text` | NOT NULL, UNIQUE | Transaction reference from the receipt |
| `receipt_hash` | `text` | NOT NULL, UNIQUE | SHA-256 hash of the receipt file |
| `verified_amount` | `numeric(10,2)` | &mdash; | Amount extracted from receipt |
| `verified_currency` | `text` | &mdash; | Currency extracted from receipt |
| `raw_response` | `jsonb` | NOT NULL, default `'{}'` | Full response from the verification provider |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Verification timestamp |

**Indexes:** `idx_payment_receipt_verifications_order_number`

### `profiles`

Stores user profile and role information. Auto-created on user signup via trigger.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | `uuid` | PK, FK &rarr; `auth.users.id`, ON DELETE CASCADE | Supabase auth user ID |
| `full_name` | `text` | &mdash; | User's display name |
| `role` | `app_role` | NOT NULL, default `'customer'` | User role |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update |

**Indexes:** `idx_profiles_role`

### `order_status_audit`

Audit log for order status transitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-generated | Unique identifier |
| `order_id` | `uuid` | NOT NULL, FK &rarr; `orders.id`, ON DELETE CASCADE | Order being updated |
| `old_status` | `order_status` | &mdash; | Previous status |
| `new_status` | `order_status` | NOT NULL | New status |
| `changed_by` | `uuid` | FK &rarr; `auth.users.id`, ON DELETE SET NULL | User who made the change |
| `changed_at` | `timestamptz` | NOT NULL, default `now()` | When the change occurred |

**Indexes:** `idx_order_status_audit_order_id_changed_at`

## Database Functions

### `set_updated_at()`

Trigger function that automatically sets `updated_at = now()` on row updates. Applied to `dishes` and `orders` tables.

### `is_admin()`

Returns `true` if the current authenticated user has the `admin` role. Used in RLS policies.

### `is_admin_or_staff()`

Returns `true` if the current authenticated user has the `admin` or `staff` role.

### `handle_new_user_profile()`

Trigger function that automatically creates a `profiles` row when a new user signs up via Supabase Auth. Extracts `full_name` from user metadata.

### `promote_user_to_admin(target_email text)`

Promotes a user to admin role. Includes bootstrap logic: the very first admin can promote themselves. After that, only existing admins can promote others.

## Row Level Security (RLS) Policies

All tables have RLS enabled. Key policies:

### Categories & Dishes (Read)
- **Anyone** (anon + authenticated) can read categories and dishes.
- **Only admins** can insert, update, or delete categories and dishes.

### Orders
- **Guests** (anon) can insert orders with `customer_user_id = NULL`.
- **Authenticated users** can insert orders linked to their own ID.
- **Owners** can read, update, and delete their own orders.
- **Admins** have full access to all orders.

### Order Items
- Access is derived from the parent order's ownership.
- Users can only see/modify items belonging to orders they own (or all items if admin).

### Profiles
- Users can read/update their own profile.
- Admins can read/update any profile.

### Payment Receipt Verifications
- Authenticated users have read-only access (inserts happen via service-role in API routes).

## Migrations

Migrations are located in `supabase/migrations/` and applied in filename order:

1. **`202603190100_baseline_restaurant_schema.sql`** &mdash; Core schema, enums, tables, indexes, triggers, RLS, seed data
2. **`202603190200_payment_receipt_verifications.sql`** &mdash; Payment verification table
3. **`202603190300_auth_personalization_and_admin_policies.sql`** &mdash; Profiles, auth trigger, admin RLS
4. **`202603190400_promote_admin_function.sql`** &mdash; Admin promotion function
5. **`202603220100_orders_workflow_and_staff.sql`** &mdash; Staff role, order workflow, delivery constraints, audit log

### Applying Migrations

```bash
npx supabase db push
```

### Legacy/Backup Migrations

The `supabase/migrations_backup/` and `supabase/migrations_legacy/` directories contain earlier versions of the schema. These are not applied automatically and are kept for reference only.
