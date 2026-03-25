## Why

Clubhouse managers incur real costs when hosting away teams — supplies, laundry, food, services. Currently there is no way to collect dues from visiting players inside the widget, forcing CMs to chase payments manually via text or cash. Adding a dues collection feature gives CMs a one-tap way to bill an entire visiting roster and gives players a frictionless way to pay, while building a full financial audit trail in the database.

## What Changes

- New **Budget** tab in the sidebar (view already registered as `'budget'` in the View type — now implemented)
- CMs can select a visiting team, review the auto-loaded player roster, set a per-player amount (default $8), deselect or override individual players, and send dues in one action
- Each player receives a pending dues record visible in their own Budget tab with a "Pay Now" button
- Payments are processed via Stripe Checkout (hosted page — handles cards, Apple Pay, Google Pay) with sessions created on-demand when a player clicks "Pay Now"
- CMs can cancel individual pending dues or an entire batch; cancellation expires the associated Stripe Checkout Session
- Every payment is recorded in three places: `dues` (player-level status), `payments` (Stripe event), `audit_log` (immutable history)
- Existing Stripe webhook handler extended to handle `checkout.session.completed`

## Capabilities

### New Capabilities

- `dues-schema`: Two new DB tables (`dues_batch`, `dues`) with RLS policies — CMs read their own batches, players read their own dues, all writes via service role
- `dues-collection`: CM workflow — select visiting team, review/edit player list and amounts, send dues batch, view per-player payment status, cancel individual or batch dues
- `dues-payment`: Player workflow — view pending dues with amount and source, pay via Stripe-hosted Checkout Session created on demand, view paid history
- `budget-ui`: Budget tab frontend — role-aware: CM sees dues manager + batch history; player sees pending and paid dues

### Modified Capabilities

- `stripe-scaffolding`: Extend webhook handler to process `checkout.session.completed` events — mark dues paid, write to `payments` table, write to `audit_log`

## Impact

- **New DB tables**: `dues_batch`, `dues` with RLS policies (migration file)
- **New serverless functions**:
  - `POST /api/dues/send` — creates batch + dues rows for selected players
  - `GET /api/dues/batch` — CM fetches all their batches with per-player status
  - `GET /api/dues/my` — player fetches their pending and paid dues
  - `POST /api/dues/:id/checkout` — creates Stripe Checkout Session on player click, returns URL
  - `POST /api/dues/:id/cancel` — CM cancels a due (expires Stripe session if unpaid, blocked if paid)
- **Modified**: `frontend/api/stripe/webhook.ts` — add `checkout.session.completed` handler
- **New frontend components**: `BudgetView`, `DuesManager` (CM), `DuesBatchList` (CM), `MyDues` (player)
- **New frontend service**: `frontend/src/services/api/dues.ts`
- **Dependencies**: `stripe` already added; no new npm packages required
