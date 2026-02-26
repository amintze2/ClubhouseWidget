# API Service Layer

All Supabase interactions for the frontend are centralised here. Components and hooks never import the Supabase client directly — they call functions from this directory instead.

## Structure

```
api/
├── index.ts       # Barrel — re-exports everything. Import from here.
├── users.ts       # User lookups and full user+data fetch
├── tasks.ts       # Task CRUD + TaskCategory enum
├── inventory.ts   # Team inventory CRUD
├── teams.ts       # Team lookups and CRUD
├── games.ts       # Game schedule CRUD (with team name resolution)
├── meals.ts       # Pre/post-game meal upsert
├── issues.ts      # Player issue reporting + manager comments
└── slugger.ts     # Slugger SDK instance management
```

## How to import

Always import from the barrel so you get the right path regardless of where you are in the codebase:

```ts
import { issuesApi, type Issue } from '../services/api';
```

---

## Files

### `users.ts`
Handles fetching the current user from Supabase, including resolving the team name from the `teams` table.

| Export | Description |
|---|---|
| `User` | User row shape |
| `UserWithData` | User extended with their `inventory[]` and `tasks[]` |
| `userApi.getUserBySluggerId(sluggerUserId)` | Fetch user by Slugger platform ID (used at login) |
| `userApi.getUserWithData(userId)` | Fetch user + their team inventory + their tasks in one call |

---

### `tasks.ts`
CRUD for the `task` table. Also owns the `TaskCategory` enum used by both tasks and inventory.

| Export | Description |
|---|---|
| `TaskCategory` | Union type matching the PostgreSQL enum |
| `Task` | Task row shape |
| `taskApi.getUserTasks(userId)` | Fetch all tasks for a user |
| `taskApi.createTask(userId, data)` | Create a task for a user |
| `taskApi.updateTask(id, data)` | Update task fields |
| `taskApi.toggleTask(id)` | Flip `task_complete` |
| `taskApi.deleteTask(id)` | Delete a task |

---

### `inventory.ts`
CRUD for the `inventory` table, scoped to a team.

| Export | Description |
|---|---|
| `Inventory` | Inventory row shape |
| `inventoryApi.getTeamInventory(teamId)` | Fetch all items for a team |
| `inventoryApi.getAllInventory()` | Fetch all items across all teams |
| `inventoryApi.createInventory(teamId, data)` | Add an item to a team's inventory |
| `inventoryApi.updateInventory(id, data)` | Update an inventory item |
| `inventoryApi.deleteInventory(id)` | Delete an inventory item |

---

### `teams.ts`
CRUD for the `teams` table.

| Export | Description |
|---|---|
| `Team` | Team row shape |
| `teamsApi.getAllTeams()` | Fetch all teams ordered by name |
| `teamsApi.getTeam(id)` | Fetch a single team |
| `teamsApi.createTeam(data)` | Create a team |
| `teamsApi.updateTeam(id, data)` | Update a team |
| `teamsApi.deleteTeam(id)` | Delete a team |

---

### `games.ts`
CRUD for the `games` table. All read methods automatically resolve `home_team_name` and `away_team_name` from the `teams` table.

| Export | Description |
|---|---|
| `Game` | Game row shape (includes optional `home_team_name`, `away_team_name`) |
| `gamesApi.getAllGames()` | Fetch all games ordered by date/time |
| `gamesApi.getGame(id)` | Fetch a single game |
| `gamesApi.getGamesByDate(date)` | Fetch games on a specific date |
| `gamesApi.getGamesByTeam(teamId)` | Fetch all games a team plays (home or away) |
| `gamesApi.createGame(data)` | Create a game |
| `gamesApi.updateGame(id, data)` | Update a game |
| `gamesApi.deleteGame(id)` | Delete a game |

---

### `meals.ts`
Manages pre/post-game meal records linked to games.

| Export | Description |
|---|---|
| `Meal` | Meal row shape |
| `mealsApi.getMealByGameId(gameId)` | Fetch the meal for a game (returns `null` if none) |
| `mealsApi.getMealsByGameIds(gameIds[])` | Batch fetch meals for multiple games |
| `mealsApi.upsertMeal(gameId, data)` | Create or update the meal for a game |
| `mealsApi.deleteMeal(id)` | Delete a meal |

---

### `issues.ts`
Player issue reporting and manager comment threads. Both tables use Supabase RLS policies that allow the anon key to read and write.

| Export | Description |
|---|---|
| `Issue` | Issue row shape |
| `IssueComment` | issue_comments row shape |
| `issuesApi.createIssue(data)` | Submit a new issue (called by players) |
| `issuesApi.getAllIssues()` | Fetch all issues ordered newest first |
| `issuesApi.getIssueComments(issueId)` | Fetch all comments for an issue ordered oldest first |
| `issuesApi.addIssueComment(issueId, comment)` | Post a manager comment — persisted to `issue_comments` |

---

### `slugger.ts`
Holds the Slugger SDK singleton used to get the authenticated platform user ID.

| Export | Description |
|---|---|
| `setSluggerSDK(sdk)` | Store the SDK instance (called during app init) |
| `getSluggerSDK()` | Get the current SDK instance |
| `getSluggerUserId()` | Get the current Slugger user ID if authenticated |
