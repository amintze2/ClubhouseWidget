// Central type definitions for the frontend.
// All shared interfaces and types should be defined here rather than in individual component files.
// DB-level types (User, Task, Inventory, Game, Meal, Issue from Supabase) remain in services/api.ts.

import type { Issue } from '../services/api';

// ── App-level types ────────────────────────────────────────────────────────

export type View =
  | 'checklist'
  | 'status'
  | 'calendar'
  | 'games'
  | 'templates'
  | 'inventory'
  | 'recurring'
  | 'budget'
  | 'meals'
  | 'manager_player_reports'
  | 'player_info'
  | 'general_manager_info';

export interface AppUser {
  username: string;
  jobRole: string;
  team?: string;
}

// ── Task (frontend representation, distinct from DB Task in services/api.ts) ──

export interface Task {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration';
  completed: boolean;
  assignedTo: string;
  taskType?: number | null;
}

// ── Game schedule ──────────────────────────────────────────────────────────

export interface GameSeries {
  id: string;
  homeTeam: string;
  visitingTeam: string;
  games: FrontendGame[];
}

// Named FrontendGame to avoid collision with DB Game from services/api.ts
export interface FrontendGame {
  id: string;
  date: Date;
  time?: string;
  gameNumber: number;
}

// ── Inventory ─────────────────────────────────────────────────────────────

export type InventoryCategory =
  | 'laundry'
  | 'hygiene'
  | 'medical'
  | 'equipment'
  | 'food'
  | 'miscellaneous'
  | null;

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  par_level: number;
  current_stock: number;
  price: number;
  notes?: string;
  link?: string;
}

// ── Recurring tasks ────────────────────────────────────────────────────────

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration';
  taskType: 'off-day' | 'game-day';
  time: string;
  timePeriod?: 'morning' | 'pre-game' | 'post-game';
  enabled: boolean;
}

// ── Template tasks ─────────────────────────────────────────────────────────

export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration';
}

// ── Meal planning ──────────────────────────────────────────────────────────

export interface PlayerDietaryInfo {
  id: string;
  name: string;
  number: string;
  restrictions: string[];
  allergies: string[];
  preferences?: string;
  notes?: string;
}

// ── Player reports ─────────────────────────────────────────────────────────

export type ReportStatus = 'New' | 'In Progress' | 'Resolved';

export interface DisplayIssue extends Issue {
  status: ReportStatus;
}
