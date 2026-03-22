# Contributing

Thank you for your interest in contributing to Le Restaurant! This guide covers the development workflow, code conventions, and best practices.

## Development Setup

See [Getting Started](./getting-started.md) for initial setup instructions.

## Code Conventions

### TypeScript

- **Strict mode** is enabled (`"strict": true` in `tsconfig.json`).
- Use explicit types for function parameters and return values.
- Prefer `type` over `interface` for object types (project convention).
- Use descriptive variable names; avoid abbreviations.
- Use `const` by default; use `let` only when reassignment is needed.

### Component Organization

- **Server Components** (default): Use for pages and data-fetching layers.
- **Client Components**: Add `"use client"` only when React state, effects, or browser APIs are needed.
- **Co-location**: Place route-specific components in `_components/` directories alongside their page. Only promote to `components/` when shared across multiple routes.

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `MenuSection.tsx` |
| Hooks | camelCase with `use` prefix | `useAdminProductsManager.ts` |
| Utilities | camelCase | `currency.ts` |
| Types | camelCase | `types.ts` |
| Route handlers | `route.ts` | `app/api/orders/route.ts` |
| Pages | `page.tsx` | `app/admin/page.tsx` |
| Layouts | `layout.tsx` | `app/admin/layout.tsx` |
| Loading states | `loading.tsx` | `app/admin/loading.tsx` |
| Barrel exports | `index.ts` | `app/admin/_components/panels/index.ts` |

### Import Order

1. Node.js built-in modules (`node:crypto`)
2. External libraries (`next/server`, `react`, `@supabase/supabase-js`)
3. Internal aliases (`@/lib/...`, `@/components/...`, `@/app/...`)
4. Relative imports (`./`, `../`)

### Styling

- Use **Tailwind CSS** utility classes for all styling.
- Use the app's custom CSS classes where they exist:
  - `app-bg-main` &mdash; main background
  - `app-bg-panel` &mdash; panel/card background
  - `app-bg-elevated` &mdash; elevated surface (inputs, badges)
  - `app-bg-accent` &mdash; accent/primary color
  - `app-hover-accent-soft` &mdash; hover state for secondary buttons
- Avoid inline styles and custom CSS unless absolutely necessary.

### API Routes

- Use `NextResponse.json()` for all responses.
- Return consistent error objects: `{ message: "Human-readable error." }`.
- Validate all inputs thoroughly before processing.
- Use the appropriate Supabase client (admin for writes, server for reads).
- Include proper HTTP status codes.

---

## Project Structure Conventions

### Route-Local Files

Use underscore-prefixed directories for route-local code:

```
app/api/admin/dishes/
├── _lib/
│   ├── parsing.ts          # Route-local utilities
│   └── types.ts            # Route-local types
├── route.ts                # POST handler
└── [id]/
    └── route.ts            # PATCH handler
```

The `_` prefix prevents Next.js from treating these as route segments.

### Barrel Exports

Use `index.ts` files for clean imports from component directories:

```typescript
// app/admin/_components/panels/index.ts
export { default as ProductsManagerPanel } from "./ProductsManagerPanel";
export { default as AdminAnalyticsPanel } from "./AdminAnalyticsPanel";
export { default as AdminSettingsPanel } from "./AdminSettingsPanel";
```

---

## Git Workflow

### Branching

- **`main`**: Production branch. Always deployable.
- **Feature branches**: Create from `main` with descriptive names.

### Commit Messages

Write clear, concise commit messages:

```
Add delivery address validation to order API

- Require destination, customerName, customerPhone for delivery orders
- Return 400 with descriptive error message if fields are missing
- Add database constraint for delivery field validation
```

### Pull Requests

1. Create a feature branch from `main`.
2. Make your changes.
3. Run lint checks: `npm run lint`.
4. Run the build: `npm run build`.
5. Open a pull request against `main`.
6. Describe what changed and why.
7. Wait for CI checks to pass.

---

## Database Changes

### Adding Migrations

1. Create a new migration file in `supabase/migrations/` with the naming convention:

   ```
   YYYYMMDDHHNN_description.sql
   ```

   Example: `202603250100_add_dish_tags.sql`

2. Write idempotent SQL (use `IF NOT EXISTS`, `ON CONFLICT`, etc.).
3. Test locally by running `npx supabase db push` against a development project.
4. Include the migration in your pull request.

### Migration Best Practices

- Always use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
- Use `DROP POLICY IF EXISTS` before `CREATE POLICY` to make migrations re-runnable.
- Add RLS policies for any new tables.
- Include seed data if the table needs initial values.
- Document the migration's purpose in a comment at the top of the file.

---

## Testing

### Manual Testing

Before submitting a PR, test the affected flows:

- **Menu browsing**: Verify dishes load and filter correctly.
- **Ordering**: Place an order (dine in, to go, delivery) and verify it appears in the database.
- **Admin**: Create/edit dishes and verify changes persist.
- **Auth**: Test sign up, sign in, and role-based access.
- **Payments**: Test receipt upload and verification (if applicable).

### Build Verification

Always verify the production build succeeds:

```bash
npm run build
```

This catches TypeScript errors, import issues, and build-time problems.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |

---

## Getting Help

- Review the [Architecture](./architecture.md) doc for an overview of how the codebase is organized.
- Check the [API Reference](./api-reference.md) for endpoint documentation.
- Review the [Database Schema](./database-schema.md) for table structures and relationships.
- Look at existing code for patterns and conventions to follow.
