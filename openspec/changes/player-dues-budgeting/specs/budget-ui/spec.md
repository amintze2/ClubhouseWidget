## ADDED Requirements

### Requirement: Budget tab is role-aware
The `budget` view SHALL render different content based on `user.jobRole`. Clubhouse managers SHALL see the dues manager interface. Players SHALL see the my-dues interface. General managers SHALL see a read-only summary (out of scope for this change — placeholder only).

#### Scenario: CM opens Budget tab
- **WHEN** a user with `jobRole = 'clubhouse_manager'` navigates to the Budget tab
- **THEN** the DuesManager component is rendered

#### Scenario: Player opens Budget tab
- **WHEN** a user with `jobRole = 'player'` navigates to the Budget tab
- **THEN** the MyDues component is rendered

---

### Requirement: DuesManager — send dues form
The `DuesManager` component SHALL render a form with: a team selector (dropdown of all teams except the CM's own team), a player checklist (all players on the selected team, all pre-checked), a per-player amount field defaulting to $8.00 that applies to all players, individual amount override inputs per player row, a note field (optional), and a "Send Dues" button. The Send button SHALL be disabled until a team is selected and at least one player is checked.

#### Scenario: Team selected, roster loads
- **WHEN** a CM selects a visiting team
- **THEN** all players on that team appear in the checklist, all checked, each showing $8.00

#### Scenario: Send button disabled with no selection
- **WHEN** no team is selected or all players are unchecked
- **THEN** the Send Dues button is disabled

---

### Requirement: DuesBatchList — status view
Below the send form, the `DuesManager` SHALL render a list of all previously sent batches. Each batch SHALL show the visiting team name, date sent, note (if any), and a per-player row with name, amount, status badge (pending/paid/cancelled), paid timestamp if paid, and a "Cancel" button for pending rows.

#### Scenario: CM cancels a pending due from the list
- **WHEN** a CM clicks Cancel on a pending dues row
- **THEN** a confirmation prompt appears, and on confirm the due is cancelled and the row updates to show cancelled status

#### Scenario: Paid row has no cancel button
- **WHEN** a dues row has status `paid`
- **THEN** no Cancel button is shown for that row

---

### Requirement: MyDues — player payment view
The `MyDues` component SHALL render two sections: "Pending" and "Paid History". Pending dues SHALL show the CM's name/team, the amount, the optional note, and a "Pay Now" button. Clicking "Pay Now" SHALL call `POST /api/dues/:id/checkout` and redirect the player to the returned Stripe URL. Paid dues SHALL show the same info plus a "Paid" badge and the paid date.

#### Scenario: Player pays dues
- **WHEN** a player clicks "Pay Now"
- **THEN** the app calls the checkout endpoint and navigates to the Stripe-hosted payment page

#### Scenario: Empty state
- **WHEN** a player has no pending dues
- **THEN** the Pending section shows a message: "No dues owed right now."
