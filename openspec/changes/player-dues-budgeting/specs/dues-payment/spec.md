## ADDED Requirements

### Requirement: Player can view their dues
The system SHALL provide a `GET /api/dues/my` serverless function that returns all `dues` rows where `player_user_id` matches the authenticated user, ordered by `created_at` descending. The response SHALL include the CM's name and the batch note for display context.

#### Scenario: Player sees pending and paid dues
- **WHEN** a player calls GET /api/dues/my
- **THEN** all their dues rows are returned, including status, amount, cm name, note, and paid_at if applicable

---

### Requirement: Stripe Checkout Session created on player click
The system SHALL provide a `POST /api/dues/:id/checkout` serverless function. The function SHALL verify the dues row belongs to the authenticated player and has status `pending`. It SHALL create a Stripe Checkout Session (payment_method_types: card; metadata: dues_id, player_user_id, cm_user_id; success_url, cancel_url) and return the session URL. The session SHALL NOT be created at dues creation time — only on player request, to avoid expiry.

#### Scenario: Player initiates payment
- **WHEN** a player calls POST /api/dues/:id/checkout for a pending dues row they own
- **THEN** a Stripe Checkout Session is created and the session URL is returned

#### Scenario: Player cannot pay another player's dues
- **WHEN** a player calls POST /api/dues/:id/checkout for a dues row belonging to a different player
- **THEN** the function returns HTTP 403

#### Scenario: Player cannot pay already-paid dues
- **WHEN** a player calls POST /api/dues/:id/checkout for a dues row with status `paid` or `cancelled`
- **THEN** the function returns HTTP 422

---

### Requirement: Webhook marks dues paid on checkout completion
The existing `/api/stripe/webhook` handler SHALL be extended to handle `checkout.session.completed` events. On receipt of a verified event, the handler SHALL: look up the `dues` row by `dues_id` from session metadata, set `dues.status = 'paid'`, set `dues.paid_at`, set `dues.stripe_checkout_session_id` and `dues.stripe_payment_intent_id`, insert a row into the `payments` table, and insert a row into `audit_log` with `event_type: 'dues.paid'`.

#### Scenario: Payment completes end-to-end
- **WHEN** a player completes payment on Stripe's hosted page
- **THEN** `dues.status` becomes `paid`, a `payments` row is inserted, and an `audit_log` entry is written — all within the same webhook handler execution

#### Scenario: Duplicate webhook delivery is safe
- **WHEN** Stripe delivers `checkout.session.completed` more than once for the same session
- **THEN** the handler is idempotent — the dues row is not double-updated and a duplicate `payments` row is not inserted (use upsert on `stripe_payment_intent_id`)
