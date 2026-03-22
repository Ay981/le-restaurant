# Deployment

This guide covers deploying Le Restaurant to production using Vercel and Supabase.

## Vercel Deployment

Le Restaurant is designed to be deployed on [Vercel](https://vercel.com/), which provides seamless Next.js hosting with automatic deployments.

### Initial Setup

1. **Import repository** into Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Connect your GitHub account
   - Select the `le-restaurant` repository
   - Vercel auto-detects Next.js and configures the build settings

2. **Configure environment variables** in the Vercel dashboard (Settings &rarr; Environment Variables):

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role key |
   | `RECEIPT_VERIFY_API_KEY` | Recommended | Receipt verification API key |
   | `RECEIPT_VERIFY_URL` | No | Custom verification endpoint (has default) |
   | `RECEIPT_VERIFY_UNIVERSAL_URL` | No | Custom universal verification endpoint (has default) |
   | `GEMINI_API_KEY` | No | Google Gemini API key for AI recommendations |
   | `GEMINI_MODEL` | No | Gemini model name (default: `gemini-2.0-flash`) |
   | `GEMINI_FALLBACK_MODELS` | No | Comma-separated fallback model names |

3. **Deploy** by clicking "Deploy". Vercel runs `next build` and deploys the output.

### Automatic Deployments

Vercel automatically deploys on every push to the `main` branch:

- **Production:** pushes to `main` deploy to the production URL
- **Preview:** pull requests get unique preview URLs for testing

### Vercel Analytics

The app includes `@vercel/analytics` which is automatically active when deployed on Vercel. No additional configuration is needed.

---

## Supabase Configuration

### Project Setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Note your project's URL, anon key, and service-role key from Settings &rarr; API.
3. Note the project reference ID from Settings &rarr; General.

### Database Migrations

Apply the schema migrations using the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Authenticate
npx supabase login

# Link to your project
npx supabase link --project-ref <YOUR_PROJECT_REF>

# Apply all migrations
npx supabase db push
```

This creates all tables, enums, functions, triggers, RLS policies, and seed data. See [Database Schema](./database-schema.md) for details.

### Storage Configuration

The app uses Supabase Storage for dish images. The `dish-images` bucket is **auto-created** by the application when the first image is uploaded. Configuration:

- **Bucket name:** `dish-images`
- **Public access:** Enabled (images are served via public URLs)
- **Max file size:** 5 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### Authentication Setup

Supabase Auth is used for email/password authentication. Default settings work out of the box, but you may want to configure:

- **Email confirmation:** Enable/disable in Authentication &rarr; Providers &rarr; Email
- **Password requirements:** Configure in Authentication &rarr; Settings
- **Redirect URLs:** Add your production domain to Authentication &rarr; URL Configuration

### Admin Bootstrap

After deployment, create the first admin account:

1. Register a user account through the app at `/create-account`.
2. Open the Supabase SQL Editor and run:

```sql
SELECT public.promote_user_to_admin('your-email@example.com');
```

---

## Next.js Configuration

The `next.config.ts` file includes important production settings:

### Image Remote Patterns

Supabase Storage URLs are allowed through `images.remotePatterns`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "yemjqotvmhgltfrdohkw.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
    // Dynamically adds your NEXT_PUBLIC_SUPABASE_URL hostname
  ],
}
```

If you're using a different Supabase project, the config automatically detects the hostname from `NEXT_PUBLIC_SUPABASE_URL`.

---

## Environment-Specific Behavior

### Receipt Verification

The verification endpoint includes the deployment environment in error messages when the API key is missing:

```
Receipt verification API key is missing on the server (env: production).
```

This uses `VERCEL_ENV` (automatically set by Vercel) or falls back to `NODE_ENV`.

### AI Recommendations

If `GEMINI_API_KEY` is not set:
- The recommendation chatbot still works using the rule-based fallback engine.
- The UI shows "Source: Fallback engine" instead of "Source: Gemini AI".
- A `fallbackReason` is included in the API response explaining why Gemini wasn't used.

---

## Production Checklist

Before going live, verify:

- [ ] All required environment variables are set in Vercel
- [ ] Database migrations have been applied (`npx supabase db push`)
- [ ] First admin account has been promoted
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (required for order creation, dish management, receipt verification)
- [ ] `RECEIPT_VERIFY_API_KEY` is set (if using bank transfer payments)
- [ ] `GEMINI_API_KEY` is set (optional, for AI recommendations)
- [ ] Supabase Auth email settings are configured (confirmation emails, redirect URLs)
- [ ] `images.remotePatterns` in `next.config.ts` includes your Supabase Storage hostname
- [ ] Build succeeds locally (`npm run build`) before deploying
- [ ] Test the ordering flow end-to-end on the preview deployment

---

## Troubleshooting

### Build Warnings

If Next.js warns about workspace root or lockfiles:
- Set `turbopack.root` in `next.config.ts`
- Remove any extra lockfiles outside the project directory

### Missing Service-Role Key

If admin features or order creation fail with permission errors:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in the deployment environment
- Ensure it matches the key from your Supabase project's API settings
- Redeploy after adding/updating the variable

### Image Loading Issues

If dish images don't load:
- Check that `NEXT_PUBLIC_SUPABASE_URL` is correctly set
- Verify the `dish-images` bucket exists and is public in Supabase Storage
- Confirm `images.remotePatterns` includes the correct hostname
