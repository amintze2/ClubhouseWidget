## ADDED Requirements

### Requirement: Inventory API functions filter by team
The `getAllInventory()` function SHALL be removed or replaced with a team-scoped equivalent. All inventory queries SHALL include a `team_id` filter matching the authenticated user's team. No function SHALL exist that returns inventory across all teams.

#### Scenario: Inventory query returns only own team's data
- **WHEN** `getInventoryByTeam(teamId)` is called
- **THEN** only inventory rows for that team are returned

#### Scenario: No cross-team inventory function exists
- **WHEN** the codebase is searched for inventory queries without a team filter
- **THEN** no such query exists in production code paths

---

### Requirement: CM lookup filtered by team
The `getAllCMs()` function SHALL be replaced with a team-scoped query. The function SHALL accept a `teamId` parameter and return only CMs belonging to that team.

#### Scenario: CM list scoped to team
- **WHEN** `getCMsByTeam(teamId)` is called
- **THEN** only users with `user_team` matching `teamId` are returned

#### Scenario: Cross-team CM enumeration not possible
- **WHEN** no `teamId` is provided
- **THEN** the function throws or returns an empty result, not a cross-team list

---

### Requirement: Zod validation on all API write operations
All API service functions that accept user-controlled input and write to Supabase SHALL validate input using `zod` schemas before the Supabase call. Invalid input SHALL throw a typed validation error, not be silently passed to the database.

#### Scenario: Valid task input is accepted
- **WHEN** `createTask` is called with a valid task object
- **THEN** the input passes zod validation and the Supabase insert proceeds

#### Scenario: Invalid task input is rejected before DB call
- **WHEN** `createTask` is called with missing required fields
- **THEN** a zod validation error is thrown before any Supabase call is made

#### Scenario: Oversized message input is rejected
- **WHEN** `sendMessage` is called with a message exceeding 2000 characters
- **THEN** a validation error is returned before the Supabase insert

---

### Requirement: No sensitive data in production console logs
All `console.log` calls that output user IDs, Slugger user IDs, tokens, or auth events SHALL be removed or wrapped in a `DEV`-only guard. Production builds SHALL not log auth events to the console.

#### Scenario: Auth event not logged in production
- **WHEN** the app bootstraps auth in a production build
- **THEN** no auth-related data appears in the browser console

#### Scenario: Errors still logged for debugging
- **WHEN** an auth error occurs in production
- **THEN** `console.error` may log a generic message without token or ID values
