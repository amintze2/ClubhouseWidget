## ADDED Requirements

### Requirement: RLS enabled on user table
The system SHALL enable Row Level Security on the `user` table. Users SHALL only be able to read and update their own row. The bootstrap serverless function (service role) SHALL be able to upsert any user row.

#### Scenario: User reads own profile
- **WHEN** an authenticated user queries the `user` table
- **THEN** only their own row is returned

#### Scenario: User cannot read another user's profile
- **WHEN** an authenticated user queries the `user` table with a different user's id
- **THEN** zero rows are returned

#### Scenario: Unauthenticated request is blocked
- **WHEN** a request with no auth token queries the `user` table
- **THEN** zero rows are returned

---

### Requirement: RLS enabled on task table
The system SHALL enable Row Level Security on the `task` table. Users SHALL only be able to read, insert, update, and delete tasks that belong to their own user_id.

#### Scenario: User reads own tasks
- **WHEN** an authenticated user queries the `task` table
- **THEN** only tasks with matching `user_id` are returned

#### Scenario: User cannot modify another user's tasks
- **WHEN** an authenticated user attempts to update a task with a different `user_id`
- **THEN** the operation returns zero affected rows

---

### Requirement: RLS enabled on inventory table
The system SHALL enable Row Level Security on the `inventory` table. Users SHALL only be able to read and write inventory rows belonging to their team (`team_id` matches the user's `user_team`).

#### Scenario: User reads own team's inventory
- **WHEN** an authenticated user queries the `inventory` table
- **THEN** only rows where `team_id` matches the user's `user_team` are returned

#### Scenario: User cannot read another team's inventory
- **WHEN** an authenticated user queries inventory belonging to a different team
- **THEN** zero rows are returned

---

### Requirement: RLS enabled on messages and conversations tables
The system SHALL enable Row Level Security on the `messages`, `conversations`, and `conversation_participants` tables. Users SHALL only be able to read messages and conversations in which they are a participant.

#### Scenario: User reads messages in their conversation
- **WHEN** an authenticated user queries messages for a conversation they are in
- **THEN** the messages are returned

#### Scenario: User cannot read messages from another conversation
- **WHEN** an authenticated user queries messages for a conversation they are not in
- **THEN** zero rows are returned

#### Scenario: User can insert a message to their own conversation
- **WHEN** an authenticated user inserts a message into a conversation they are a participant of
- **THEN** the insert succeeds

---

### Requirement: RLS enabled on new payment tables
The system SHALL enable Row Level Security on the `subscriptions`, `payments`, and `audit_log` tables from the time of their creation. Team billing data SHALL only be readable by users belonging to that team.

#### Scenario: User reads own team's subscription
- **WHEN** an authenticated user queries the `subscriptions` table
- **THEN** only the subscription record for their team is returned

#### Scenario: User cannot read another team's payment history
- **WHEN** an authenticated user queries `payments` for a different team
- **THEN** zero rows are returned
