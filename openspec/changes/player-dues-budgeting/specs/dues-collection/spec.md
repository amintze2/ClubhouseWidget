## ADDED Requirements

### Requirement: CM can send dues to a visiting team's roster
The system SHALL provide a `POST /api/dues/send` serverless function. The CM SHALL select a visiting team, and the system SHALL load all users with `user_role = 'player'` and `user_team` matching that team. The CM SHALL be able to deselect individual players and override individual amounts before submitting. The default amount per player SHALL be $8.00. On submit, one `dues_batch` row and one `dues` row per selected player SHALL be created using the service role key.

#### Scenario: Dues batch created for full roster
- **WHEN** a CM selects a visiting team and submits without changes
- **THEN** one `dues_batch` row is created and one `dues` row (status: pending) is created for every player on that team

#### Scenario: CM removes a player before sending
- **WHEN** a CM unchecks a player before submitting
- **THEN** no `dues` row is created for that player in the batch

#### Scenario: CM overrides an individual amount
- **WHEN** a CM changes one player's amount from $8 to $15 before submitting
- **THEN** that player's `dues` row has `amount = 15.00` and all others have `amount = 8.00`

#### Scenario: Default amount is $8
- **WHEN** a CM opens the dues form
- **THEN** the per-player amount field is pre-filled with $8.00

---

### Requirement: CM can view batch status
The system SHALL provide a `GET /api/dues/batch` serverless function that returns all `dues_batch` rows for the authenticated CM, with each batch including the list of associated `dues` rows and their current status.

#### Scenario: CM sees live payment status
- **WHEN** a CM views a sent batch
- **THEN** each player row shows status: pending, paid, or cancelled
- **AND** paid rows show `paid_at` timestamp

---

### Requirement: CM can cancel individual dues
The system SHALL provide a `POST /api/dues/:id/cancel` serverless function. If the dues row status is `pending`, the function SHALL set status to `cancelled`, set `cancelled_at`, and expire the associated Stripe Checkout Session if one exists. If the dues row status is `paid`, the function SHALL return HTTP 422 with an error indicating the payment cannot be cancelled.

#### Scenario: Cancel pending dues
- **WHEN** a CM cancels a pending dues row
- **THEN** status is set to `cancelled`, `cancelled_at` is set, and the Stripe Checkout Session (if any) is expired

#### Scenario: Cannot cancel paid dues
- **WHEN** a CM attempts to cancel a dues row with status `paid`
- **THEN** the function returns HTTP 422 and the dues row is unchanged
