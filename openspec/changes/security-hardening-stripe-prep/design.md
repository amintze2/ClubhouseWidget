## Context

The app is a multi-team clubhouse management widget embedded in Slugger via iframe. Auth flows through a bootstrap token exchange — the widget never stores credentials, only a session reference in React state. The database (Supabase) is accessed directly from the client using the anon key. Currently, no Row Level Security policies exist, meaning any authenticated user can read or write any team's data. A dev auth bypass exists in the production serverless function. Stripe is the next integration and requires a hardened, PCI-aware foundation.

## Goals / Non-Goals

**Goals:**
- Prevent cross-team data access at the database layer (RLS)
- Remove auth bypass code from production
- Harden the bootstrap endpoint (rate limiting, correct key, generic errors)
- Tighten CSP and client-side origin validation
- Scaffold payment tables and Stripe webhook handler with correct security posture from day one

**Non-Goals:**
- Full Stripe checkout flow implementation (that is a separate change)
- Replacing Supabase with a different database
- Migrating from direct client Supabase access to a full backend proxy (deferred — RLS + service role key is sufficient for now)
- Changing the Slugger postMessage auth protocol

## Decisions

### D1: RLS enforced at DB layer, not application layer
**Decision**: Implement Postgres RLS policies on Supabase rather than relying on application-level filtering.
**Rationale**: Application-level filters can be bypassed by bugs or new code paths. RLS enforces access at the database — even a direct Supabase client call with the anon key will be restricted. This is the correct defense-in-depth position for a multi-tenant app.
**Alternative considered**: Add team_id filters to every query. Rejected — fragile, easy to miss, doesn't protect against new queries or direct API access.

### D2: Service role key in serverless functions only
**Decision**: The bootstrap serverless function will use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) rather than the anon key. All client-side calls continue to use the anon key (subject to RLS).
**Rationale**: The bootstrap function needs to upsert users regardless of whether they exist yet — RLS would block a new user inserting their own row. Server-side admin access is appropriate here. The service role key must never be exposed to the client.
**Alternative considered**: Use anon key everywhere and write permissive RLS for upserts. Rejected — too permissive, harder to audit.

### D3: Rate limiting via Vercel Edge Config / upstash
**Decision**: Use `@upstash/ratelimit` with Redis (Upstash free tier) for rate limiting the bootstrap endpoint. Fallback: Vercel's built-in middleware rate limiting.
**Rationale**: Bootstrap is the only externally callable serverless endpoint. Without rate limiting it's brute-forceable. Upstash integrates cleanly with Vercel serverless and requires no infra changes.
**Alternative considered**: IP-based rate limiting in code. Rejected — Vercel functions don't reliably provide real client IPs behind CDN.

### D4: Stripe webhooks handled server-side only, never client-side
**Decision**: Add `frontend/api/stripe/webhook.ts` as a Vercel serverless function. Stripe calls this endpoint with signed events. No Stripe secret key ever touches client code.
**Rationale**: PCI compliance and Stripe's own guidelines require webhook processing to be server-side. The signature must be verified using `STRIPE_WEBHOOK_SECRET` before trusting any payload.
**Alternative considered**: Handle payment state via polling from client. Rejected — unreliable for async payment flows (3DS, SEPA, delayed captures).

### D5: CSP expanded but `unsafe-inline` retained for styles temporarily
**Decision**: Add `script-src 'self'`, `connect-src 'self' <supabase-url> https://alpb-analytics.com`, `img-src 'self' data: https:`. Retain `style-src 'self' 'unsafe-inline'` for now due to Tailwind + Radix inline styles.
**Rationale**: Removing `unsafe-inline` from styles would require auditing every Radix/shadcn component for inline style usage — a large scope increase. Script-src is the high-value target; inline styles are lower risk.
**Alternative considered**: Full CSP with nonces. Deferred to a later change — requires Vite nonce plugin integration.

### D6: `mock-slugger-auth.ts` excluded via Vite define, not file deletion
**Decision**: Wrap the mock auth import in a `import.meta.env.DEV` guard (or Vite `define` flag) rather than deleting the file.
**Rationale**: The file is useful for local development. The risk is accidental inclusion in production builds. A build-time guard is the right tool.

## Risks / Trade-offs

- **RLS migration complexity** → If existing queries rely on cross-team access patterns, they will silently return empty results after RLS is enabled. Mitigation: audit all Supabase queries before migrating; test each table individually.
- **Service role key in Vercel env** → If compromised, bypasses all RLS. Mitigation: rotate immediately if exposed, restrict Vercel project access, never log the key.
- **Rate limiting cold starts** → Upstash Redis adds ~10ms latency on bootstrap calls. Mitigation: acceptable trade-off; bootstrap only happens once per session.
- **`price_per_unit` type change** → Changing `integer` → `numeric` requires a migration. Any existing integer values are preserved. Mitigation: migration is additive and safe; no data loss.
- **Stripe webhook endpoint publicly reachable** → Required by Stripe. Mitigation: always verify `stripe.webhooks.constructEvent` signature before processing. Reject any event that fails signature check.

## Migration Plan

1. **Phase 1** (unblocks Stripe): DB migrations for RLS → deploy bootstrap hardening → fix team-scoped API calls → rotate/consolidate keys
2. **Phase 2** (client hardening): CSP headers → origin list cleanup → log guards → zod validation
3. **Phase 3** (Stripe scaffold): Schema migrations for payment tables → webhook handler → numeric price field

Each phase is independently deployable. RLS policies can be rolled back by disabling RLS on individual tables. Stripe webhook handler is inactive until `STRIPE_WEBHOOK_SECRET` is set in Vercel env.

## Open Questions

- Does Upstash free tier (10K requests/day) cover expected bootstrap volume, or do we need a paid plan?
- Should `getAllCMs()` be completely team-scoped, or should inter-team messaging intentionally allow cross-team CM lookup? (Needs product decision — current audit treats it as a leak.)
- What Stripe products/prices will be configured — subscriptions per team, per user, or one-time purchases? (Affects webhook handler logic and payment table schema.)
