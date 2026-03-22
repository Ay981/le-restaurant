# Features

This document provides an in-depth guide to the core features of Le Restaurant.

## Menu Browsing & Dish Search

### Homepage Menu

The homepage (`/`) displays the full restaurant menu organized by categories. Data is fetched server-side from Supabase and passed to the client-side `HomeDashboard` component.

**How it works:**

1. The server component queries `categories` (sorted by `sort_order`) and active `dishes` from Supabase.
2. If Supabase is unavailable, hardcoded fallback data from `lib/data.ts` is used.
3. Dishes are displayed as cards with title, price, availability count, and image.
4. Category tabs allow filtering dishes by category.

### Dish Search

The search bar on the homepage queries the `GET /api/dishes/search` endpoint for real-time filtering:

- Case-insensitive partial matching on dish titles
- Only active dishes are returned
- Results are limited to 60 items

---

## Ordering Flow

### Building an Order

1. **Add dishes** by clicking on menu items. Each click adds one unit to the cart.
2. **Adjust quantity** using the +/- controls in the order panel.
3. **Add notes** to individual items for special instructions.
4. **Remove items** from the cart with the delete button.
5. **Select order type**: Dine In, To Go, or Delivery.

The order panel shows a running subtotal and discount summary.

### Order Types

| Type | Description | Additional Fields |
|------|-------------|-------------------|
| **Dine In** | Customer eats at the restaurant | Table number |
| **To Go** | Customer picks up the order | None |
| **Delivery** | Order delivered to an address | Destination, customer name, customer phone (all required) |

### Checkout & Payment

Clicking "Continue to Payment" opens the `PaymentModal` with two panels:

**Left panel (Confirmation):**
- Order summary with all items, quantities, notes, and prices
- Discount and subtotal breakdown

**Right panel (Payment):**
- Payment method selection
- Order type and table number display
- Receipt upload (for bank transfer)
- Confirm/Cancel buttons

### Payment Methods

| Method | Status | Notes |
|--------|--------|-------|
| **Bank Transfer** | Active | Requires receipt upload and verification before confirming |
| **Cash** | Active | No receipt needed |
| **Tele Birr** | Coming soon | Currently disabled |
| **M-Pesa** | Coming soon | Currently disabled |

### Order Persistence

When the user confirms payment:

1. If the user is authenticated, the Supabase access token is included in the API request.
2. The `POST /api/orders` endpoint creates the order and order items.
3. Authenticated orders are linked to the user's account via `customer_user_id`.
4. Guest orders have `customer_user_id = NULL`.

---

## Payment Receipt Verification

Bank transfer payments require uploading a receipt image or PDF for verification.

### Verification Flow

```
User uploads receipt
       │
       ▼
Hash file (SHA-256)
       │
       ▼
Check for duplicate hash ──▶ 409 "Already used"
       │ (unique)
       ▼
Is it a PDF? ──▶ Yes ──▶ Require manual transaction reference
       │                         │
       │ No                      ▼
       ▼              Call universal verification endpoint
Call image verification endpoint
       │
       ▼
Parse response & check verified status
       │
       ▼
Check for duplicate transaction reference ──▶ 409 "Already used"
       │ (unique)
       ▼
Persist verification record
       │
       ▼
Return success
```

### Supported File Types

- **Images:** JPEG, PNG, WebP, HEIC, HEIF
- **Documents:** PDF (requires manual transaction reference entry)
- **Max file size:** 8 MB

### Replay Protection

Two layers prevent receipt reuse:

1. **Receipt hash uniqueness** &mdash; SHA-256 hash of the file content is checked before sending to the verification provider.
2. **Transaction reference uniqueness** &mdash; the extracted or provided transaction reference is checked after verification.

Both are enforced with unique constraints in the `payment_receipt_verifications` table.

### Retry Logic

- Image verification retries up to 3 attempts (initial + 2 retries) with 700ms delays.
- Multiple verification endpoints are tried in sequence.
- Retryable conditions: HTTP 5xx, connection failures, timeouts.

---

## AI-Powered Recommendations

The recommendation chatbot helps users discover dishes based on their preferences.

### User Interface

The chatbot is embedded in the homepage as a collapsible panel (`RecommendationChat` component):

1. Click "Talk to Chatbot" to expand.
2. Answer preference questions:
   - **Favorite recipe** (free text)
   - **Cuisine** (Any, Noodle, Pasta, Soup, Grill, Rice)
   - **Spice level** (Mild, Medium, Spicy)
   - **Budget** (Low, Medium, High)
   - **Dietary** (No preference, Vegetarian, High-protein)
   - **Meal type** (Light, Filling)
3. Click "Get recommendations" to generate suggestions.
4. Results show up to 5 dishes with reasons and "Add to order" buttons.

### Recommendation Engine

The system uses a two-tier approach:

#### Tier 1: Google Gemini AI

When a Gemini API key is configured:

- Constructs a prompt with user preferences and available dishes.
- Requests exactly 5 recommendations in JSON format.
- Validates that recommended titles match actual dishes in the database.
- Deduplicates results.
- Retries on rate-limit (429) and service unavailable (503) errors.
- Tries multiple Gemini models in sequence (configured + fallbacks).

#### Tier 2: Rule-Based Fallback

When Gemini is unavailable or fails:

- Scores each dish based on keyword matching against user preferences.
- Scoring factors:
  - Favorite recipe match (+4)
  - Cuisine match (+3)
  - Spice level alignment (+2-3)
  - Dietary compatibility (+3)
  - Meal type compatibility (+2)
  - Within budget (+2)
- Returns top 5 dishes sorted by score (ties broken by price).

### Source Transparency

The response includes a `source` field (`"gemini"` or `"rule-based"`) and a `fallbackReason` when using the fallback engine.

---

## Admin Dashboard

The admin dashboard (`/admin`) provides tools for managing the restaurant's menu and orders.

### Navigation

The admin area has a side rail with links to:

- **Products** (`/admin`) &mdash; dish and category management
- **Orders** (`/admin/orders`) &mdash; order tracking and status management
- **Analytics** (`/admin/analytics`) &mdash; business metrics and charts
- **Settings** (`/admin/settings`) &mdash; restaurant configuration

### Dish Management

**Create a dish:**
1. Click "Add New Dish" in the Products panel.
2. Fill in title, price, availability count, and category.
3. Optionally upload an image (JPEG, PNG, WebP, GIF; max 5 MB).
4. Submit to create via `POST /api/admin/dishes`.

**Edit a dish:**
1. Click on a dish card to open the edit modal.
2. Modify any fields (including active/inactive status).
3. Submit to update via `PATCH /api/admin/dishes/:id`.

**Image uploads:**
- Images are uploaded to Supabase Storage in the `dish-images` bucket.
- The bucket is auto-created if it doesn't exist.
- Files are stored with unique names: `dishes/{timestamp}-{uuid}.{ext}`.
- Public URLs are returned for display.

### Category Management

Admins can create new categories directly from the Products panel. Categories have a name and sort order that determines their display position.

### Order Management

**View orders:**
- Paginated list of all orders (excluding cancelled).
- Search by order number, customer name, phone, or delivery address.

**Update status:**
- Orders follow a strict workflow: `pending` &rarr; `in_progress` &rarr; `delivered`.
- Each status change is audited in `order_status_audit`.
- Timestamps are automatically recorded for `started_at` and `delivered_at`.

---

## Customer Personalization

Authenticated users get personalized features:

### Order History

When signed in, orders are linked to the user's account. Users can view their previous orders and track their status.

### Authenticated Insights

The `AuthenticatedInsights` component shows personalized data for signed-in users, including previous order information and dish suggestions based on ordering patterns.

### Post-Checkout Messaging

- **Signed-in users** see: "Payment confirmed. This order has been added to your history."
- **Guests** see: "Payment confirmed. Sign in next time to unlock order history and personalized suggestions."

---

## Navigation

The app uses a sidebar navigation (`Sidenav`) component that includes:

| Icon | Destination | Description |
|------|-------------|-------------|
| Home | `/` | Main menu and ordering |
| Sign Up | `/create-account` | User registration |
| Sign In | `/sign-in` | User login |
| Discounts | `/discounts` | Discount offers |
| Analytics | `/analytics` | Analytics dashboard |
| Messages | `/messages` | Messages |
| Notifications | `/notifications` | Notifications |
| Settings | `/admin` | Admin dashboard |

The sidebar also includes the restaurant logo and a logout button.
