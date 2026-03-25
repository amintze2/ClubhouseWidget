## Why

The app has critical security gaps — no database RLS policies, a dev auth bypass in production code, and cross-team data leaks — that must be resolved before Stripe can be integrated safely. Adding payment processing on top of an unsecured data layer creates PCI compliance exposure and real risk of financial data leakage across teams.

## What Changes

- Add Row Level Security (RLS) policies to all Supabase tables, scoping data access by team and user
- Remove the `mock-` token dev bypass from the production bootstrap serverless function
- Add rate limiting to `/api/auth/bootstrap`
- Fix `getAllInventory()` and `getAllCMs()` to filter by the current user's team
- Switch the serverless function from the anon key to the service role key
- Remove hardcoded Supabase key from `info.tsx`; consolidate to env vars only
- Add comprehensive CSP headers (`script-src`, `connect-src`, `style-src`, `img-src`)
- Remove hardcoded internal AWS ALB URL from `slugger-widget-sdk.ts` allowed origins
- Standardize error responses in `bootstrap.ts` to avoid leaking auth state
- Guard production console logs that expose user IDs and auth events
- Exclude `mock-slugger-auth.ts` from production builds
- Add `zod` input validation to API service functions
- Add Stripe webhook handler as a serverless function (server-side only)
- Add `subscriptions`, `payments`, and `audit_log` tables with RLS from day one
- Change `price_per_unit` from `integer` to `numeric` for accurate currency handling

## Capabilities

### New Capabilities

- `database-rls`: Row Level Security policies on all tables — user, task, inventory, messages, conversations, conversation_participants, and new payment tables
- `bootstrap-auth-hardening`: Rate limiting, dev bypass removal, service role key, and generic error responses on the auth bootstrap endpoint
- `api-input-validation`: Zod schema validation on all API service functions before data reaches Supabase
- `csp-hardening`: Comprehensive Content Security Policy headers covering script, style, connect, and image sources
- `stripe-scaffolding`: Stripe webhook serverless function, subscriptions/payments schema, audit log table, and numeric currency fields

### Modified Capabilities

*(none — no existing specs to delta)*

## Impact

- **Database**: Migrations required for RLS policies, new tables (`subscriptions`, `payments`, `audit_log`), and `price_per_unit` type change
- **Serverless**: `frontend/api/auth/bootstrap.ts` — key change, bypass removal, rate limiting, error normalization
- **API services**: `frontend/src/services/api/inventory.ts`, `messages.ts`, and others — team filtering + zod validation
- **Client SDK**: `frontend/src/services/slugger-widget-sdk.ts` — origin list cleanup, console log guards
- **Config**: `frontend/vercel.json`, `frontend/vite.config.ts` — CSP header expansion
- **Build**: `frontend/src/utils/mock-slugger-auth.ts` — production build exclusion
- **New**: `frontend/api/stripe/webhook.ts` — Stripe webhook handler
- **Dependencies added**: `zod`, `stripe` (server-side only), `@upstash/ratelimit` or Vercel rate limiting
