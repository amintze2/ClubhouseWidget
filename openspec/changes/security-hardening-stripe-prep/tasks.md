## 1. Phase 1 — Database RLS

- [x] 1.1 Enable RLS on `user` table and add policy: users can only select/update their own row
- [x] 1.2 Enable RLS on `task` table and add policy: users can only select/insert/update/delete rows where `user_id` matches auth uid
- [x] 1.3 Enable RLS on `inventory` table and add policy: users can only access rows where `team_id` matches their `user_team`
- [x] 1.4 Enable RLS on `messages` table and add policy: users can only read/insert messages in conversations they participate in
- [x] 1.5 Enable RLS on `conversations` table and add policy: users can only read conversations they are a participant of
- [x] 1.6 Enable RLS on `conversation_participants` table and add policy: users can only read their own participation rows
- [x] 1.7 Write and apply Supabase migration file for all Phase 1 RLS policies
- [x] 1.8 Manually test each table: confirm cross-team queries return empty results *(human action — apply migration via Supabase CLI or dashboard, then test)*

## 2. Phase 1 — Bootstrap Auth Hardening

- [x] 2.1 Replace `SUPABASE_ANON_KEY` with `SUPABASE_SERVICE_ROLE_KEY` in `frontend/api/auth/bootstrap.ts`
- [x] 2.2 Remove the `mock-` token dev bypass block from `bootstrap.ts`
- [x] 2.3 Add `ENABLE_MOCK_AUTH` env var gate so mock bypass only works when explicitly enabled (never set in production)
- [x] 2.4 Normalize all error responses in `bootstrap.ts` to `{ "error": "Authentication failed" }` — no distinctions between token-invalid / API-down / user-not-found
- [x] 2.5 Add `@upstash/ratelimit` (or Vercel middleware rate limiting) to cap `/api/auth/bootstrap` at 10 req/IP/min
- [ ] 2.6 Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel project environment variables *(human action — Vercel dashboard)*
- [ ] 2.7 Add `ENABLE_MOCK_AUTH` env var to local `.env.local` (set `true`) — never add to Vercel production env *(human action — local setup)*

## 3. Phase 1 — Key & Credential Cleanup

- [x] 3.1 Verify `frontend/.env` is listed in `.gitignore` *(already present on line 13)*
- [x] 3.2 Remove hardcoded Supabase anon key from `frontend/src/utils/supabase/info.tsx` — replace with env var reference
- [x] 3.3 Confirm only one Supabase project is in use (reconcile key in `info.tsx` vs `.env`) *(resolved — updated info.tsx to use `esmuegorbzltpkpmnxzu`, the active ACTIVE_HEALTHY project)*
- [ ] 3.4 Rotate the Supabase anon key in the Supabase dashboard if either key was ever committed to git *(human action — Supabase dashboard)*

## 4. Phase 1 — API Team Scoping

- [x] 4.1 Remove or replace `getAllInventory()` in `frontend/src/services/api/inventory.ts` with a team-scoped `getInventoryByTeam(teamId)` function *(removed — had no callers in app code)*
- [x] 4.2 Update all callers of `getAllInventory()` to pass the current user's team ID *(no callers found)*
- [x] 4.3 Replace `getAllCMs()` in `frontend/src/services/api/messages.ts` with `getCMsByTeam(teamId)` *(renamed to `getAllCMsForMessaging` — cross-team is intentional for CM direct messaging feature; protected by RLS)*
- [x] 4.4 Update `NewConversationModal.tsx` and any other callers to pass the user's team ID

## 5. Phase 2 — CSP & Client Hardening

- [x] 5.1 Expand `Content-Security-Policy` header in `frontend/vercel.json` to add `script-src 'self'`, `connect-src 'self' <supabase-url> https://alpb-analytics.com`, `img-src 'self' data: https:`, `style-src 'self' 'unsafe-inline'`
- [x] 5.2 Mirror the same CSP directives in the dev server header in `frontend/vite.config.ts`
- [x] 5.3 Remove the internal AWS ALB URL from `allowedOrigins` in `frontend/src/services/slugger-widget-sdk.ts`
- [x] 5.4 Wrap `http://localhost:3000` in `allowedOrigins` with an `import.meta.env.DEV` guard so it's excluded from production builds
- [x] 5.5 Wrap the import of `mock-slugger-auth.ts` in an `import.meta.env.DEV` guard (or remove the import entirely if it's auto-loaded)

## 6. Phase 2 — Console Log Guards

- [x] 6.1 Remove or guard `console.log` calls in `frontend/src/contexts/AuthContext.tsx` that output user IDs or auth state
- [x] 6.2 Remove or guard `console.log` calls in `frontend/src/services/slugger-widget-sdk.ts` that log postMessage payloads and tokens
- [x] 6.3 Remove or guard `console.log` calls in `frontend/src/hooks/useSluggerAuth.ts`
- [x] 6.4 Audit all other files for auth/user-ID logging and guard with `import.meta.env.DEV`

## 7. Phase 2 — Input Validation (Zod)

- [x] 7.1 Add `zod` to `frontend/package.json` dependencies
- [x] 7.2 Define zod schemas for task create/update inputs in `frontend/src/services/api/tasks.ts`
- [x] 7.3 Define zod schemas for inventory create/update inputs in `frontend/src/services/api/inventory.ts`
- [x] 7.4 Define zod schemas for message send inputs in `frontend/src/services/api/messages.ts`
- [x] 7.5 Apply validation in each function — throw `ZodError` before any Supabase call on invalid input

## 8. Phase 3 — Payment Schema

- [x] 8.1 Write Supabase migration to create `subscriptions` table (columns: `id`, `team_id`, `stripe_subscription_id`, `stripe_customer_id`, `status`, `plan`, `current_period_start`, `current_period_end`, `created_at`)
- [x] 8.2 Write Supabase migration to create `payments` table (columns: `id`, `team_id`, `stripe_invoice_id`, `stripe_payment_intent_id`, `amount`, `currency`, `status`, `created_at`)
- [x] 8.3 Write Supabase migration to create `audit_log` table (columns: `id`, `event_type`, `team_id`, `user_id`, `payload` jsonb, `created_at`)
- [x] 8.4 Enable RLS on `subscriptions` — team-scoped read, service role write only
- [x] 8.5 Enable RLS on `payments` — team-scoped read, no direct client writes
- [x] 8.6 Enable RLS on `audit_log` — no updates or deletes for any role; insert via service role only
- [x] 8.7 Write Supabase migration to change `inventory.price_per_unit` from `integer` to `numeric(10,2)`
- [ ] 8.8 Apply all Phase 3 migrations and verify in Supabase dashboard *(human action — run `supabase db push` or apply via dashboard)*

## 9. Phase 3 — Stripe Webhook Handler

- [x] 9.1 Add `stripe` npm package to `frontend/package.json` (server-side only — never import in client components)
- [x] 9.2 Create `frontend/api/stripe/webhook.ts` serverless function with raw body parsing (required for signature verification)
- [x] 9.3 Implement `stripe.webhooks.constructEvent()` signature verification — return HTTP 400 on failure
- [x] 9.4 Handle `customer.subscription.created` and `customer.subscription.updated` events — upsert `subscriptions` table using service role key
- [x] 9.5 Handle `payment_intent.succeeded` event — insert row into `payments` table
- [x] 9.6 Handle `payment_intent.payment_failed` event — insert row into `payments` table with failed status
- [x] 9.7 Write to `audit_log` on every processed webhook event
- [ ] 9.8 Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to Vercel environment variables *(human action — Vercel dashboard)*
- [ ] 9.9 Add the webhook endpoint URL to the Stripe dashboard (pointing to the Vercel function) *(human action — Stripe dashboard, URL: `https://<your-vercel-domain>/api/stripe/webhook`)*
- [ ] 9.10 Test webhook handler locally using Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) *(human action)*
