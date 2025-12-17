# Clubhouse Management Widget - High-Level Overview

## 🎯 Purpose

A comprehensive clubhouse management system for baseball teams that helps managers and staff track tasks, inventory, game schedules, meals, and budgets. The widget integrates with the SLUGGER platform and can also run standalone.

---

## 🏗️ Architecture

### **Frontend-Only Architecture**
- **React + TypeScript** application
- **Direct Supabase integration** - No backend server needed
- **Vite** for building and bundling
- **Deployed as static site** (Vercel/Netlify)

### **Data Storage**
- **Supabase PostgreSQL** database
- All data operations go directly from frontend to Supabase
- Row Level Security (RLS) can be configured for data protection

### **Authentication**
- **Dual-mode authentication**:
  1. **SLUGGER Platform** (production): Uses SluggerWidgetSDK for token-based auth
  2. **Standalone Mode** (development): Manual login with user ID

---

## 🔐 Authentication Flow

### **SLUGGER Mode (Production)**
```
1. Widget loads in SLUGGER iframe
2. SluggerWidgetSDK initializes with widgetId
3. SDK sends "SLUGGER_WIDGET_READY" message to parent
4. SLUGGER shell responds with "SLUGGER_AUTH" containing JWT tokens
5. SDK decodes tokens and extracts user info
6. App looks up user in database by slugger_user_id
7. User data loaded → App ready
```

### **Standalone Mode (Development)**
```
1. Widget loads standalone (not in iframe)
2. User manually enters slugger_user_id
3. App looks up user in database
4. User data loaded → App ready
```

---

## 📊 Data Flow

### **Database Schema**
- **Users**: Team members with roles (general_manager, clubhouse_manager, player)
- **Teams**: Baseball teams
- **Tasks**: Daily tasks with categories, dates, completion status
- **Inventory**: Team-based inventory items with stock levels
- **Games**: Game schedule with home/away teams
- **Meals**: Meal plans for games (pre-game snack, post-game meal)

### **API Layer** (`services/api.ts`)
All database operations use Supabase client directly:
- `userApi` - User management
- `taskApi` - Task CRUD operations
- `inventoryApi` - Inventory management
- `gamesApi` - Game schedule management
- `teamsApi` - Team management
- `mealsApi` - Meal planning

### **State Management**
- **React Context** (`AuthContext`) for user authentication
- **Local component state** for UI interactions
- **Real-time sync** with Supabase on all CRUD operations

---

## 🎨 Main Features

### **1. Daily Checklists** (`ClubhouseChecklist`)
- View today's tasks
- Filter by game day vs. off day
- Task types:
  - **Regular tasks**: One-time tasks with dates
  - **Recurring tasks**: Repeat on game days or off days
  - **Template tasks**: Pre-defined task templates
- Task categories: Sanitation, Laundry, Food, Communication, Maintenance, Administration

### **2. Task Calendar** (`CalendarView`)
- Weekly calendar view
- See all tasks across dates
- Filter by game days
- Add/edit tasks from calendar

### **3. Inventory Management** (`ClubhouseInventory`)
- Team-based inventory tracking
- Categories: Laundry, Hygiene, Medical, Equipment, Food, Miscellaneous
- Stock level tracking (current vs. recommended)
- Quick stock updates
- Price tracking for budget calculations
- Purchase links

### **4. Budget & Expenses** (`Budget`)
- Shows items needing restocking
- Calculates total cost to restock
- Only includes items with price information
- Visual indicators for restocking needs

### **5. Game Schedule** (`GameSchedule`)
- View all games for user's team
- Home vs. Away indicators
- Series grouping (consecutive games)
- Add/edit/delete games

### **6. Meal Planning** (`MealPlanning`)
- Plan meals for all games
- Pre-game snack planning
- Post-game meal planning
- Saves to database per game

### **7. Recurring Tasks** (`RecurringTasks`)
- Create tasks that repeat automatically
- Game day tasks vs. Off day tasks
- Time-based scheduling
- Enable/disable individual tasks

### **8. Clubhouse Status** (`ClubhouseStatus`)
- Overview dashboard (for general managers)
- Task completion statistics
- Visual progress indicators

### **9. Task Templates** (`TaskTemplates`)
- Pre-defined task templates
- Separate templates for game days and off days
- Quick task creation from templates

---

## 🔄 Key Workflows

### **Task Management**
1. User creates task → Saved to `task` table
2. Task appears in checklist/calendar
3. User marks complete → `task_complete` updated in DB
4. Task filtered by `task_type`:
   - `1` = Game day only
   - `2` = Off day only
   - `null` = All days

### **Inventory Management**
1. User adds inventory item → Saved to `inventory` table (team-based)
2. User updates stock → `current_stock` updated in DB
3. Budget tab calculates restocking costs
4. Low stock items highlighted

### **Game & Meal Planning**
1. User adds game → Saved to `games` table
2. User plans meal for game → Saved to `meals` table
3. Meal info displayed in Meal Planning tab

---

## 🎭 User Roles

### **General Manager**
- Views: Status, Games, Templates, Budget
- Full access to all features
- Dashboard overview

### **Clubhouse Manager / Player**
- Views: Checklists, Calendar, Inventory, Recurring Tasks, Budget, Meals
- Task-focused workflow
- Inventory management

---

## 🚀 Deployment

### **Build Process**
```bash
cd frontend
npm run build  # Creates 'dist' folder
```

### **Deployment**
- **Vercel/Netlify**: Deploy `dist` folder
- **Environment Variables**:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### **SLUGGER Integration**
- Widget registered with SLUGGER platform
- Embedded as iframe in SLUGGER shell
- Receives authentication tokens via PostMessage API

---

## 🔧 Technical Stack

### **Frontend**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Lucide React** - Icons

### **Backend/Database**
- **Supabase** - PostgreSQL database + client SDK
- **Direct client access** - No Express/Node server needed

### **Authentication**
- **SluggerWidgetSDK** - Custom SDK for SLUGGER platform integration
- **JWT tokens** - From SLUGGER platform
- **Supabase anon key** - For database access

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ClubhouseChecklist.tsx
│   │   ├── ClubhouseInventory.tsx
│   │   ├── CalendarView.tsx
│   │   ├── MealPlanning.tsx
│   │   └── ui/             # Reusable UI components
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication state
│   ├── services/
│   │   ├── api.ts          # Supabase API calls
│   │   └── slugger-widget-sdk.ts
│   ├── hooks/
│   │   └── useSluggerAuth.ts
│   ├── utils/
│   │   └── supabase/       # Supabase client config
│   └── App.tsx             # Main app component
└── dist/                   # Production build output
```

---

## 🔄 Data Synchronization

### **Real-time Updates**
- All CRUD operations immediately sync with Supabase
- Local state updates after successful API calls
- Error handling with user-friendly messages

### **Data Loading**
- User data loaded on authentication
- Tasks, inventory, games loaded from database
- Automatic refresh after mutations

---

## 🎯 Key Features Summary

✅ **Task Management**: Create, complete, delete tasks with date/time filtering  
✅ **Inventory Tracking**: Team-based inventory with stock levels and pricing  
✅ **Game Scheduling**: Manage game calendar with home/away tracking  
✅ **Meal Planning**: Plan pre-game snacks and post-game meals  
✅ **Budget Tracking**: Calculate restocking costs  
✅ **Recurring Tasks**: Automate repetitive tasks  
✅ **Role-Based Views**: Different interfaces for managers vs. players  
✅ **SLUGGER Integration**: Seamless authentication in platform  
✅ **Standalone Mode**: Works independently for development/testing  

---

## 🔐 Security Considerations

- **Environment Variables**: Supabase credentials in `.env` (not committed)
- **RLS Policies**: Can be configured in Supabase for data access control
- **Token Validation**: SLUGGER SDK validates tokens automatically
- **Origin Validation**: PostMessage communication validated

---

## 📝 Development vs. Production

### **Development**
- Standalone mode with manual login
- Local Supabase connection
- Hot reload with Vite

### **Production**
- Embedded in SLUGGER platform
- Automatic authentication
- Environment variables from Vercel
- Optimized production build

---

**Last Updated**: Current codebase state  
**Status**: Production-ready widget

