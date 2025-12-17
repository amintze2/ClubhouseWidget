# Clubhouse Widget Backend

Backend API server for the Clubhouse Task Manager App with full CRUD operations for users, inventory, and tasks.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Create a `.env` file in the backend directory
   - Fill in your Supabase credentials:
     ```
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     PORT=3001
     ```

3. Run database migrations:
   - Apply the migration files in order to your Supabase database:
     1. `migrations/001_initial_schema.sql` - Creates the initial tables
     2. `migrations/002_add_task_date_time.sql` - Adds date and time columns to task table
     3. `migrations/003_add_teams_and_games.sql` - Creates teams and games tables
     4. `migrations/004_change_user_team_to_foreign_key.sql` - Changes user_team from text to foreign key reference
     5. `migrations/005_change_inventory_to_team_based.sql` - Changes inventory from user-based to team-based
   - You can do this through the Supabase dashboard SQL editor or using the Supabase CLI
   - **Important**: 
     - Migration 004 will clear existing `user_team` text values. If you have existing data, you'll need to manually map team names to team IDs before running this migration.
     - Migration 005 will change inventory from `user_id` to `team_id`. All existing inventory items will be lost unless you manually migrate them to teams first.

4. Seed the database (optional but recommended for testing):
   ```bash
   npm run seed
   ```
   This will populate the database with sample users, inventory items, and tasks. Test login credentials:
   - `manager1` - Sarah Johnson (Team Alpha)
   - `manager2` - Mike Chen (Team Beta)
   - `manager3` - Emily Rodriguez (Team Alpha)

## Database Schema

The database consists of three main tables:

- **user**: Stores user information
- **inventory**: Stores inventory items linked to users
- **task**: Stores tasks linked to users

See `migrations/001_initial_schema.sql` for the complete schema definition.

## Development

- `npm run dev`: Start development server with hot reload (runs on port 3001)
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Run the built application
- `npm run type-check`: Type check without building
- `npm run seed`: Seed the database with sample data

## API Endpoints

The API provides full CRUD operations for users, inventory, and tasks. All endpoints ensure that inventory and tasks are properly associated with users.

### Quick Start

1. Start the server: `npm run dev`
2. Check health: `GET http://localhost:3001/health`
3. See `API.md` for complete API documentation

### Main Endpoints

- **Users**: `/api/users` - Manage users
- **Inventory**: `/api/inventory` - Manage inventory items (linked to users)
- **Tasks**: `/api/tasks` - Manage tasks (linked to users)

### Key Features

- ✅ All inventory items are linked to a user
- ✅ All tasks are linked to a user
- ✅ Get complete user data with all associated inventory and tasks: `GET /api/users/:id/complete`
- ✅ Cascade deletion: Deleting a user removes all associated inventory and tasks
- ✅ User validation: Creating inventory/tasks verifies the user exists

## TypeScript Types

Type definitions for the database tables are available in `src/types/db.ts`.

## API Documentation

See `API.md` for complete API documentation with examples.

