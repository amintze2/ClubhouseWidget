## ADDED Requirements

### Requirement: dues_batch table
The system SHALL have a `dues_batch` table that records each CM send action. Columns: `id`, `cm_user_id` (FK → user), `visiting_team_id` (FK → teams), `amount_per_player` numeric(10,2), `note` text nullable, `created_at`. RLS SHALL be enabled — CMs can only read rows where `cm_user_id` matches their JWT sub. No direct client writes.

#### Scenario: CM reads only their own batches
- **WHEN** a CM queries `dues_batch`
- **THEN** only rows where `cm_user_id` matches their user ID are returned

---

### Requirement: dues table
The system SHALL have a `dues` table with one row per player per batch. Columns: `id`, `batch_id` (FK → dues_batch), `cm_user_id` (denormalized for RLS), `player_user_id` (FK → user), `amount` numeric(10,2), `status` text (pending | paid | cancelled), `stripe_checkout_session_id` text nullable, `stripe_payment_intent_id` text nullable, `paid_at` timestamptz nullable, `cancelled_at` timestamptz nullable, `created_at`. RLS SHALL allow CMs to read rows where `cm_user_id` matches their sub, and players to read rows where `player_user_id` matches their sub. No direct client writes.

#### Scenario: Player reads only their own dues
- **WHEN** a player queries `dues`
- **THEN** only rows where `player_user_id` matches their user ID are returned

#### Scenario: CM reads dues for their batches
- **WHEN** a CM queries `dues`
- **THEN** only rows where `cm_user_id` matches their user ID are returned

#### Scenario: Cross-role isolation
- **WHEN** a player queries `dues` for rows belonging to another player
- **THEN** no rows are returned

---

### Requirement: dues rows linked to payments table
When a dues payment completes, the `dues` row SHALL store the `stripe_payment_intent_id`. This SHALL match the `stripe_payment_intent_id` on the corresponding row inserted into the existing `payments` table, creating a traceable link between the dues record and the Stripe payment event.

#### Scenario: Full payment audit trail
- **WHEN** a player pays dues
- **THEN** `dues.stripe_payment_intent_id` matches `payments.stripe_payment_intent_id` for that transaction
- **AND** an `audit_log` row is inserted with `event_type: 'dues.paid'`, `user_id` of the player, and payload containing `dues_id` and `amount`
