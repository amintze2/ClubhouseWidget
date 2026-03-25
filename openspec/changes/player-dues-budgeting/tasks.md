## 1. Database Schema

- [x] 1.1 Write Supabase migration to create `dues_batch` table (columns: `id`, `cm_user_id`, `visiting_team_id`, `amount_per_player`, `note`, `created_at`)
- [x] 1.2 Write Supabase migration to create `dues` table (columns: `id`, `batch_id`, `cm_user_id`, `player_user_id`, `amount`, `status`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `paid_at`, `cancelled_at`, `created_at`)
- [x] 1.3 Enable RLS on `dues_batch` — CMs read own rows (`cm_user_id = auth.jwt()->>'sub'`), no direct client writes
- [x] 1.4 Enable RLS on `dues` — CMs read rows where `cm_user_id` matches, players read rows where `player_user_id` matches, no direct client writes
- [ ] 1.5 Apply migrations *(human action — `supabase db push` or Supabase dashboard)*

## 2. Serverless Functions

- [x] 2.1 Create `frontend/api/dues/send.ts` — POST: auth check (CM role only), load players for visiting team, create `dues_batch` row, create `dues` rows for selected players using service role key
- [x] 2.2 Create `frontend/api/dues/batch.ts` — GET: return all `dues_batch` rows for authenticated CM with joined `dues` rows and player names
- [x] 2.3 Create `frontend/api/dues/my.ts` — GET: return all `dues` rows for authenticated player with CM name and batch note
- [x] 2.4 Create `frontend/api/dues/[id]/checkout.ts` — POST: verify dues belongs to authenticated player and is pending, create Stripe Checkout Session with metadata, return session URL
- [x] 2.5 Create `frontend/api/dues/[id]/cancel.ts` — POST: verify dues belongs to authenticated CM and is pending, expire Stripe Checkout Session if session ID exists, set status = cancelled
- [x] 2.6 Add Zod validation to all new serverless functions

## 3. Stripe Webhook Extension

- [x] 3.1 Add `checkout.session.completed` case to `frontend/api/stripe/webhook.ts` — read `dues_id` from session metadata
- [x] 3.2 On `checkout.session.completed`: update `dues` row (status = paid, paid_at, stripe_checkout_session_id, stripe_payment_intent_id) using upsert pattern for idempotency
- [x] 3.3 On `checkout.session.completed`: insert row into `payments` table (upsert on `stripe_payment_intent_id`)
- [x] 3.4 On `checkout.session.completed`: insert row into `audit_log` (event_type: 'dues.paid', user_id: player, payload: { dues_id, amount, cm_user_id })

## 4. Frontend Service

- [x] 4.1 Create `frontend/src/services/api/dues.ts` — functions: `sendDues`, `getBatches`, `getMyDues`, `getCheckoutUrl`, `cancelDue`

## 5. Frontend Components

- [x] 5.1 Create `frontend/src/components/budget/BudgetView.tsx` — role-aware shell: renders DuesManager for CMs, MyDues for players, placeholder for GMs
- [x] 5.2 Create `frontend/src/components/budget/DuesManager.tsx` — team selector, player checklist with checkboxes, $8 default amount field, per-player amount override, note field, Send Dues button
- [x] 5.3 Create `frontend/src/components/budget/DuesBatchList.tsx` — list of sent batches with per-player status, paid timestamps, and Cancel buttons for pending rows
- [x] 5.4 Create `frontend/src/components/budget/MyDues.tsx` — pending dues with Pay Now button, paid history section, empty state
- [x] 5.5 Wire `BudgetView` into `frontend/src/App.tsx` renderRoleContent for the `'budget'` view

## 6. Human Actions

- [ ] 6.1 Confirm Stripe account is in live mode (or test mode for initial testing) and retrieve `STRIPE_SECRET_KEY` *(human action)*
- [ ] 6.2 Add `STRIPE_SECRET_KEY` and `APP_URL` to Vercel environment variables *(human action — Vercel dashboard)*
- [ ] 6.3 Add webhook endpoint for `checkout.session.completed` in Stripe dashboard *(human action — Stripe dashboard)*
- [ ] 6.4 Apply DB migrations via Supabase dashboard or CLI: `supabase/migrations/20260325000000_dues_tables.sql` *(human action)*
