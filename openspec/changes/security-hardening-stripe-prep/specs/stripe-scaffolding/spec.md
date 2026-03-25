## ADDED Requirements

### Requirement: Stripe webhook handler as serverless function
The system SHALL expose a `/api/stripe/webhook` Vercel serverless function that receives Stripe webhook events. The handler SHALL verify the Stripe signature using `STRIPE_WEBHOOK_SECRET` before processing any event. Any event that fails signature verification SHALL be rejected with HTTP 400. The Stripe secret key (`STRIPE_SECRET_KEY`) and webhook secret SHALL only exist as Vercel environment variables — never in client-side code.

#### Scenario: Valid webhook event processed
- **WHEN** Stripe sends a webhook with a valid signature
- **THEN** the handler verifies the signature, processes the event, and returns HTTP 200

#### Scenario: Invalid signature rejected
- **WHEN** a request arrives at `/api/stripe/webhook` with a missing or invalid `Stripe-Signature` header
- **THEN** the handler returns HTTP 400 without processing the payload

#### Scenario: Stripe keys not present in client bundle
- **WHEN** the frontend JavaScript bundle is inspected
- **THEN** no `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` value is present

---

### Requirement: Subscriptions table with RLS
The system SHALL have a `subscriptions` table in Supabase that stores team subscription state (Stripe subscription ID, status, plan, current period). RLS SHALL be enabled from creation, scoped to team.

#### Scenario: Team can read own subscription
- **WHEN** an authenticated user queries `subscriptions`
- **THEN** only the subscription row for their team is returned

#### Scenario: Subscription upserted on webhook
- **WHEN** a `customer.subscription.updated` webhook is received and verified
- **THEN** the serverless function upserts the subscription row using the service role key

---

### Requirement: Payments table with RLS
The system SHALL have a `payments` table that logs payment events (invoice ID, amount, currency, status, Stripe customer ID). RLS SHALL restrict reads to the user's team. Writes SHALL only be performed by the serverless webhook handler (service role).

#### Scenario: Payment event logged on successful charge
- **WHEN** a `payment_intent.succeeded` webhook event is received
- **THEN** a row is inserted into `payments` with the amount, currency, and status

#### Scenario: User cannot write to payments table directly
- **WHEN** an authenticated client attempts to insert a row into `payments`
- **THEN** the RLS policy blocks the insert and returns an error

---

### Requirement: Audit log table
The system SHALL have an `audit_log` table that records significant events (auth events, payment state changes, permission changes). Rows SHALL be insert-only for the service role. No user or team SHALL be able to update or delete audit log entries.

#### Scenario: Audit entry created on payment state change
- **WHEN** a subscription status changes via webhook
- **THEN** an entry is inserted into `audit_log` with the event type, timestamp, and affected team_id

#### Scenario: Audit log entries are immutable
- **WHEN** any user or role attempts to update or delete an `audit_log` row
- **THEN** the operation is rejected by RLS policy

---

### Requirement: price_per_unit stored as numeric
The `price_per_unit` column on the `inventory` table SHALL be of type `numeric(10,2)` to accurately represent currency values. Integer storage SHALL not be used for monetary amounts.

#### Scenario: Price stored with decimal precision
- **WHEN** an inventory item is saved with a price of `$4.99`
- **THEN** the value stored is `4.99` (not `4` or `499`)

#### Scenario: Migration preserves existing values
- **WHEN** the column type migration runs on existing data
- **THEN** all existing integer price values are preserved (cast to numeric without data loss)
