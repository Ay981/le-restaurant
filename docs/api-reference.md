# API Reference

All API routes are implemented as Next.js App Router route handlers in `app/api/`.

## Base URL

- **Local:** `http://localhost:3000/api`
- **Production:** `https://<your-domain>/api`

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <supabase-access-token>
```

The access token is obtained from the Supabase Auth session (`session.access_token`).

---

## Public Endpoints

### Search Dishes

Search active dishes by title.

```
GET /api/dishes/search?q={query}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (case-insensitive, partial match) |

**Response** `200`:

```json
{
  "dishes": [
    {
      "title": "Spicy seasoned seafood noodles",
      "price": 2.29,
      "availability": "20 Bowls available",
      "image": "/image/pizza.png",
      "categories": ["Hot Dishes"]
    }
  ]
}
```

Returns an empty array if `q` is blank. Results are limited to 60 items.

---

### Create Order

Place a new order. Works for both guests and authenticated users.

```
POST /api/orders
```

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | No | Bearer token (links order to user account if provided) |

**Request Body:**

```json
{
  "selectedOrderType": "Dine In",
  "discount": 0,
  "items": [
    {
      "title": "Spicy seasoned seafood noodles",
      "price": 2.29,
      "quantity": 2,
      "note": "Not too spicy please"
    }
  ],
  "deliveryDetails": {
    "destination": "123 Main St",
    "customerName": "John Doe",
    "customerPhone": "+1234567890"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `selectedOrderType` | string | No | `"Dine In"`, `"To Go"`, or `"Delivery"` (default: `"Dine In"`) |
| `discount` | number | No | Discount amount (default: `0`) |
| `items` | array | Yes | At least one item required |
| `items[].title` | string | Yes | Dish name |
| `items[].price` | number | Yes | Unit price (&ge; 0) |
| `items[].quantity` | integer | Yes | Quantity (> 0) |
| `items[].note` | string | No | Special instructions |
| `deliveryDetails` | object | Conditional | Required when `selectedOrderType` is `"Delivery"` |
| `deliveryDetails.destination` | string | Conditional | Delivery address |
| `deliveryDetails.customerName` | string | Conditional | Customer name |
| `deliveryDetails.customerPhone` | string | Conditional | Customer phone |

**Response** `201`:

```json
{
  "id": "uuid",
  "orderNumber": "ORD-1711234567890-123",
  "message": "Order created."
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400` | Validation error (missing items, invalid price/quantity, missing delivery details) |
| `500` | Server error |

---

### AI Dish Recommendations

Get personalized dish recommendations using Gemini AI or the rule-based fallback.

```
POST /api/chat/recommend
```

**Request Body:**

```json
{
  "answers": {
    "favoriteRecipe": "spicy noodles",
    "cuisine": "Any",
    "spiceLevel": "Spicy",
    "budget": "Medium",
    "dietary": "No preference",
    "mealType": "Filling"
  },
  "dishes": [
    {
      "title": "Spicy seasoned seafood noodles",
      "price": 2.29,
      "availability": "20 Bowls available",
      "image": "/image/pizza.png",
      "categories": ["Hot Dishes"]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `answers.favoriteRecipe` | string | Free-text favorite dish |
| `answers.cuisine` | string | Preferred cuisine type (`Any`, `Noodle`, `Pasta`, `Soup`, `Grill`, `Rice`) |
| `answers.spiceLevel` | string | `Mild`, `Medium`, or `Spicy` |
| `answers.budget` | string | `Low` (&le; $3), `Medium` (&le; $4), or `High` (no limit) |
| `answers.dietary` | string | `No preference`, `Vegetarian`, or `High-protein` |
| `answers.mealType` | string | `Light` or `Filling` |
| `dishes` | array | Available dishes to recommend from |

**Response** `200`:

```json
{
  "recommendations": [
    {
      "title": "Spicy seasoned seafood noodles",
      "reason": "Matches your love for spicy noodles."
    }
  ],
  "source": "gemini",
  "fallbackReason": null
}
```

| Field | Description |
|-------|-------------|
| `recommendations` | Array of up to 5 recommended dishes with reasons |
| `source` | `"gemini"` or `"rule-based"` |
| `fallbackReason` | Explanation when falling back to rule-based (null if Gemini succeeded) |

---

### Verify Payment Receipt

Upload and verify a bank transfer receipt. Includes duplicate/replay protection.

```
POST /api/payments/verify-receipt
```

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Receipt image (JPEG, PNG, WebP, HEIC) or PDF. Max 8MB. |
| `orderNumber` | string | No | Associated order number (default: `"UNKNOWN"`) |
| `expectedAmount` | number | No | Expected payment amount for validation |
| `accountSuffix` | string | No | Last digits of account number (used for FT-prefix references) |
| `transactionReference` | string | Conditional | Required for PDF receipts (e.g., `FT...`, `CE...`) |

**Response** `200` (verified):

```json
{
  "verified": true,
  "message": "Receipt verified successfully.",
  "transactionReference": "FT123456789"
}
```

**Error Responses:**

| Status | Response | Reason |
|--------|----------|--------|
| `400` | `{ "verified": false, "message": "..." }` | Invalid file, missing reference for PDF, or verification failed |
| `409` | `{ "verified": false, "alreadyUsed": true }` | Duplicate receipt hash or transaction reference |
| `500` | `{ "verified": false, "message": "..." }` | Missing API key or server error |
| `502` | `{ "verified": false, "message": "..." }` | Verification provider unreachable |

**Replay Protection:**
- Receipt file hash (SHA-256) is checked for uniqueness
- Transaction reference is checked for uniqueness
- Both are persisted in `payment_receipt_verifications` after successful verification

---

## Admin Endpoints

All admin endpoints require an `Authorization: Bearer <token>` header with admin (or admin/staff) role.

### Create Dish

```
POST /api/admin/dishes
```

**Auth:** Admin only

**Content-Type:** `application/json` or `multipart/form-data`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Dish name |
| `price` | number | Yes | Price (&ge; 0) |
| `availabilityCount` | integer | Yes | Availability count (&ge; 0) |
| `imageUrl` | string | No | URL for the dish image |
| `imageFile` | File | No | Image file to upload to Supabase Storage (multipart only) |
| `categoryId` | integer | No | Category ID to assign |

> If both `imageFile` and `imageUrl` are provided, the uploaded file takes priority.

**Response** `201`:

```json
{
  "id": "uuid",
  "message": "Dish created."
}
```

---

### Update Dish

```
PATCH /api/admin/dishes/:id
```

**Auth:** Admin only

**Content-Type:** `application/json` or `multipart/form-data`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Dish name |
| `price` | number | Yes | Price (&ge; 0) |
| `availabilityCount` | integer | Yes | Availability count (&ge; 0) |
| `isActive` | boolean | Yes | Whether the dish is active |
| `imageUrl` | string | No | URL for the dish image |
| `imageFile` | File | No | Image file to upload (multipart only) |
| `categoryId` | integer | No | Category ID to assign |

**Response** `200`:

```json
{
  "message": "Dish updated."
}
```

---

### List Orders (Admin)

Retrieve paginated orders with optional search.

```
GET /api/admin/orders?page=1&pageSize=20&q=search
```

**Auth:** Admin or Staff

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `pageSize` | integer | `20` | Items per page (max 100) |
| `q` | string | &mdash; | Search by order number, customer name, phone, or address |

**Response** `200`:

```json
{
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "ORD-1711234567890-123",
      "orderType": "dine_in",
      "status": "pending",
      "total": 4.58,
      "createdAt": "2026-03-19T12:00:00Z",
      "startedAt": null,
      "deliveredAt": null,
      "note": null,
      "customerName": null,
      "customerPhone": null,
      "deliveryAddress": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**UI Status Mapping:**

| Database Status | UI Status |
|----------------|-----------|
| `pending` | `pending` |
| `preparing` | `in_progress` |
| `served`, `completed` | `delivered` |

---

### Update Order Status

Advance an order through the status workflow.

```
PATCH /api/admin/orders/:id/status
```

**Auth:** Admin or Staff

**Request Body:**

```json
{
  "status": "in_progress"
}
```

| Value | Description |
|-------|-------------|
| `pending` | Reset to pending |
| `in_progress` | Start preparing |
| `delivered` | Mark as completed |

**Allowed Transitions:**

```
pending → in_progress → delivered
```

Attempting an invalid transition (e.g., `pending` &rarr; `delivered` directly, or `delivered` &rarr; `pending`) returns a `400` error.

**Side Effects:**
- Sets `started_at` when transitioning to `in_progress`
- Sets `delivered_at` when transitioning to `delivered`
- Creates an audit log entry in `order_status_audit`
- Records `last_status_changed_by`

**Response** `200`:

```json
{
  "id": "uuid",
  "status": "in_progress",
  "startedAt": "2026-03-19T12:05:00Z",
  "deliveredAt": null,
  "message": "Order status updated."
}
```

---

## Error Response Format

All endpoints return errors in a consistent format:

```json
{
  "message": "Human-readable error description."
}
```

Some endpoints (like receipt verification) include additional fields:

```json
{
  "verified": false,
  "message": "This payment receipt has already been used.",
  "transactionReference": "FT123456789",
  "alreadyUsed": true
}
```
