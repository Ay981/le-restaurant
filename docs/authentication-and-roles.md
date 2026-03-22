# Authentication & Roles

Le Restaurant uses [Supabase Auth](https://supabase.com/docs/guides/auth) for user authentication and a custom role-based access control system built on PostgreSQL Row Level Security (RLS).

## Authentication Flow

### Guest Access

Guests can browse the menu and place orders without creating an account. Guest orders have `customer_user_id = NULL` in the database.

### User Registration

Users can create an account at `/create-account` using email and password. On signup:

1. Supabase Auth creates the user in `auth.users`.
2. A database trigger (`handle_new_user_profile`) automatically creates a row in `public.profiles` with role `customer`.
3. If the user provided a `full_name` in their metadata, it's stored in the profile.

### Sign In

Users sign in at `/sign-in`. After authentication:

- The Supabase session token is used for API calls.
- Orders placed while signed in are linked to the user's account.
- Users get access to personalized features (order history, suggestions).

## Roles

### Role Hierarchy

```
guest (unauthenticated)
  └── customer (default for all signed-in users)
       └── staff (order management)
            └── admin (full access)
```

### Role Capabilities

| Capability | Guest | Customer | Staff | Admin |
|-----------|-------|----------|-------|-------|
| Browse menu | Yes | Yes | Yes | Yes |
| Place orders | Yes | Yes | Yes | Yes |
| View own order history | No | Yes | Yes | Yes |
| Get personalized suggestions | No | Yes | Yes | Yes |
| View all orders | No | No | Yes | Yes |
| Update order status | No | No | Yes | Yes |
| Manage dishes | No | No | No | Yes |
| Manage categories | No | No | No | Yes |
| Promote users | No | No | No | Yes |

## API Route Authorization

Protected API routes use helper functions from `lib/supabase/admin-route-auth.ts`:

### `requireAdminAccess(request)`

Verifies the request has a valid Bearer token and the user has the `admin` role. Used by dish management endpoints.

### `requireAdminOrStaffAccess(request)`

Verifies the request has a valid Bearer token and the user has either `admin` or `staff` role. Used by order management endpoints.

### `requireRoleAccess(request, allowedRoles)`

Generic role check that accepts an array of allowed roles. Returns either:

```typescript
// Success
{ ok: true, userId: string, role: AppRole }

// Failure
{ ok: false, status: number, message: string }
```

### Authorization Flow

1. Extract Bearer token from `Authorization` header.
2. Use the token to call `supabase.auth.getUser()` to validate the session.
3. Look up the user's role from `public.profiles`.
4. Check if the role is in the allowed roles list.
5. Return the result (success with userId/role, or failure with status/message).

## Admin Promotion

### Bootstrap (First Admin)

When no admins exist yet, a signed-in user can promote themselves:

```sql
SELECT public.promote_user_to_admin('your-email@example.com');
```

The function checks:
1. If there are existing admins and the caller isn't one, it rejects the request.
2. If there are no admins, the caller can only promote their own email.

### Subsequent Promotions

Once an admin exists, only admins can promote other users:

```sql
SELECT public.promote_user_to_admin('new-admin@example.com');
```

The target user must already have a Supabase Auth account.

## Row Level Security (RLS)

All tables have RLS enabled. Access is controlled through PostgreSQL policies that use the `is_admin()` and `is_admin_or_staff()` helper functions.

### Policy Summary

| Table | Anonymous Read | Auth Read | Auth Write | Admin Full |
|-------|---------------|-----------|------------|------------|
| `categories` | Yes | Yes | No | Yes |
| `dishes` | Yes | Yes | No | Yes |
| `orders` | No | Own only | Own only | Yes |
| `order_items` | No | Via order ownership | Via order ownership | Yes |
| `profiles` | No | Own only | Own only | Yes |
| `payment_receipt_verifications` | No | Yes (read-only) | No (service-role only) | Yes |

### Guest Order Insertion

Guests (anonymous users) can insert orders and order items with `customer_user_id = NULL`. This allows the ordering flow to work without authentication.

## Supabase Client Strategy

Different Supabase clients are used depending on the security context:

| Client | Key Used | Context | Purpose |
|--------|----------|---------|---------|
| Browser client | Anon key | Client components | User session, real-time |
| Server client | Anon key | Server components | Read-only data fetching |
| Admin client | Service-role key | API routes | Elevated operations (bypasses RLS) |

The service-role key is **never** exposed to the browser. It's only used in server-side API route handlers for operations like inserting payment verification records or managing dishes.

## Security Considerations

- **Service-role key** grants full database access. Keep it in environment variables only and never expose it client-side.
- **Bearer tokens** are validated on every protected API request. Expired or invalid tokens return `401`.
- **Role checks** happen at both the API route level (middleware) and the database level (RLS policies) for defense in depth.
- **Profile auto-creation** via trigger ensures every authenticated user has a role assigned.
