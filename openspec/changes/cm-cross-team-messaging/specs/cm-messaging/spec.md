## ADDED Requirements

### Requirement: CM can send a direct message to another CM
A clubhouse manager SHALL be able to initiate a 1:1 direct message conversation with any other CM in the Atlantic League. If a DM thread already exists between the two users, the system SHALL open the existing thread rather than creating a duplicate.

#### Scenario: Start a new DM
- **WHEN** a CM selects "Message a person" and picks another CM from the list
- **THEN** the system creates a new direct conversation with both users as participants and opens the thread

#### Scenario: Resume an existing DM
- **WHEN** a CM selects a person they have previously messaged
- **THEN** the system opens the existing conversation thread without creating a new one

#### Scenario: Send a message in a DM
- **WHEN** a CM types text and submits in a direct conversation
- **THEN** the message is saved and appears in both users' threads in real time

---

### Requirement: CM can message all CMs on another team
A clubhouse manager SHALL be able to send a message to all CMs on a given team. The system SHALL create or reuse a canonical group thread identified by the two teams involved (deduped by ordered team_a_id / team_b_id).

#### Scenario: Start a new team thread
- **WHEN** a CM selects "Message a team" and picks a team
- **THEN** the system creates a group conversation with all CMs from both teams as participants and opens the thread

#### Scenario: Reuse existing team thread
- **WHEN** a CM selects a team they have previously messaged
- **THEN** the system opens the existing canonical team thread

#### Scenario: New CM auto-joins team thread
- **WHEN** a new user is assigned to a team that is a participant in existing team threads
- **THEN** the new user is automatically added as a participant to those threads

---

### Requirement: League bulletin board is always available
The system SHALL maintain a single persistent "Atlantic League Board" group conversation containing all CMs from all 10 teams. It SHALL be pinned at the top of the conversation list and open to posts from any CM.

#### Scenario: Bulletin board visible on first load
- **WHEN** any authenticated CM opens the Messages view
- **THEN** the Atlantic League Board conversation appears pinned at the top of the list

#### Scenario: CM posts to bulletin board
- **WHEN** a CM types and sends a message in the bulletin board thread
- **THEN** the message is visible to all CMs in real time

#### Scenario: New CM auto-joins bulletin board
- **WHEN** a new user is assigned to any team
- **THEN** they are automatically added as a participant in the bulletin board conversation

---

### Requirement: Unread messages are indicated by a badge
The system SHALL display an unread message count badge on the Messages sidebar tab. The badge SHALL reflect the total number of unread messages across all conversations the user participates in.

#### Scenario: Badge increments on new message
- **WHEN** a CM receives a new message in any conversation while viewing another tab
- **THEN** the Messages sidebar badge increments in real time

#### Scenario: Badge clears on conversation open
- **WHEN** a CM opens a conversation
- **THEN** that conversation's unread count is cleared and the badge decrements accordingly

---

### Requirement: Messages display sender identity
Each message in a thread SHALL display the sender's name and team name so that recipients can identify who sent the message across team boundaries.

#### Scenario: Message shows sender info
- **WHEN** a message is rendered in a thread
- **THEN** it displays the sender's user_name and team_name alongside the message content and timestamp

---

### Requirement: Real-time message delivery
Messages SHALL appear in open conversation threads in real time without requiring a manual refresh, via Supabase Realtime subscriptions.

#### Scenario: Live message delivery
- **WHEN** another CM sends a message to a conversation the current user has open
- **THEN** the message appears in the thread within seconds without a page reload
