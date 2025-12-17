// TypeScript types generated from the database schema

// Task category enum (matches PostgreSQL enum type)
// Note: PostgreSQL enum values are stored with spaces and title case
export type TaskCategory = 
  | 'Medical & Safety'
  | 'Equipment & Field Support'
  | 'Laundry & Cleaning'
  | 'Hygiene & Personal Care'
  | 'Meals & Nutrition'
  | 'Misc';

export interface User {
  id: number;
  created_at: string;
  user_role: string | null;
  user_team: number | null;
  slugger_user_id: string | null;
  user_name: string | null;
}

export interface Inventory {
  id: number;
  team_id: number | null;
  meal_id: number | null;
  inventory_type: TaskCategory | null;
  inventory_item: string | null;
  current_stock: number | null;
  required_stock: number | null;
  unit: string | null;
  purchase_link: string | null;
  note: string | null;
  price_per_unit: number | null;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number | null;
  task_name: string | null;
  task_complete: boolean | null;
  task_category: TaskCategory | null;
  task_description: string | null;
  task_type: number | null;
  task_date: string | null;
  task_time: string | null;
  is_repeating: boolean;
  repeating_day: number | null;
  created_at: string;
}

export interface Team {
  id: number;
  team_name: string;
  created_at: string;
}

export interface Game {
  id: number;
  home_team_id: number;
  away_team_id: number;
  date: string | null;
  time: string | null;
  created_at: string;
}

export interface Meal {
  id: number;
  game_id: number;
  meal_type: string;
  created_at: string;
}

// Database table names
export type Database = {
  public: {
    Tables: {
      user: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      inventory: {
        Row: Inventory;
        Insert: Omit<Inventory, 'id' | 'created_at'>;
        Update: Partial<Omit<Inventory, 'id' | 'created_at'>>;
      };
      task: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at'>;
        Update: Partial<Omit<Team, 'id' | 'created_at'>>;
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'created_at'>;
        Update: Partial<Omit<Game, 'id' | 'created_at'>>;
      };
      meals: {
        Row: Meal;
        Insert: Omit<Meal, 'id' | 'created_at'>;
        Update: Partial<Omit<Meal, 'id' | 'created_at'>>;
      };
    };
  };
};

