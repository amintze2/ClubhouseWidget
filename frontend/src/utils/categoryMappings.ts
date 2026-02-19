// Canonical mappings between DB category strings and frontend category keys.
// Consolidates three previously-separate mapping objects from App.tsx, useTaskSync.ts, and useInventory.ts.

import type { Task } from '../types/index';

export type TaskCategory = Task['category'];

// ── Frontend → DB ──────────────────────────────────────────────────────────

export const FRONTEND_TO_DB_CATEGORY: Record<TaskCategory, string> = {
  sanitation: 'Hygiene & Personal Care',
  laundry: 'Laundry & Cleaning',
  food: 'Meals & Nutrition',
  communication: 'Misc',
  maintenance: 'Equipment & Field Support',
  administration: 'Misc',
};

export const frontendCategoryToDb = (category: TaskCategory): string =>
  FRONTEND_TO_DB_CATEGORY[category] || 'Misc';

// ── DB → Frontend task category ────────────────────────────────────────────

// Maps DB enum values (both spaced and underscored formats) to frontend Task categories
export const DB_TO_TASK_CATEGORY: Record<string, TaskCategory> = {
  'medical & safety': 'sanitation',
  'medical_safety': 'sanitation',
  'equipment & field support': 'maintenance',
  'equipment_field_support': 'maintenance',
  'laundry & cleaning': 'laundry',
  'laundry_cleaning': 'laundry',
  'hygiene & personal care': 'sanitation',
  'hygiene_personal_care': 'sanitation',
  'meals & nutrition': 'food',
  'meals_nutrition': 'food',
  'misc': 'administration',
  'miscellaneous': 'administration',
};

export function dbCategoryToFrontend(dbCategory: string | null): TaskCategory {
  if (!dbCategory) return 'sanitation';
  return DB_TO_TASK_CATEGORY[String(dbCategory).trim().toLowerCase()] ?? 'sanitation';
}

// ── DB → Frontend inventory category ──────────────────────────────────────

export const DB_TO_INVENTORY_CATEGORY: Record<string, string> = {
  'medical & safety': 'medical',
  'medical_safety': 'medical',
  'equipment & field support': 'equipment',
  'equipment_field_support': 'equipment',
  'laundry & cleaning': 'laundry',
  'laundry_cleaning': 'laundry',
  'hygiene & personal care': 'hygiene',
  'hygiene_personal_care': 'hygiene',
  'meals & nutrition': 'food',
  'meals_nutrition': 'food',
  'misc': 'miscellaneous',
  'miscellaneous': 'miscellaneous',
};

// ── Inventory category name → DB type ─────────────────────────────────────
// Used when saving a new inventory item to map the display category name to the DB type string.

export const CATEGORY_NAME_TO_INVENTORY_TYPE: Record<string, string> = {
  'Laundry & Cleaning Supplies': 'Laundry & Cleaning',
  'Hygiene & Personal Care': 'Hygiene & Personal Care',
  'Medical & Safety': 'Medical & Safety',
  'Equipment & Field Support': 'Equipment & Field Support',
  'Meals & Nutrition': 'Meals & Nutrition',
  'Miscellaneous': 'Misc',
};
