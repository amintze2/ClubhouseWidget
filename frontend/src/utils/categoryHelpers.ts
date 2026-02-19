// Shared display helpers for task categories.
// Consolidates getCategoryBadgeColor and getCategoryLabel which were previously
// duplicated in ClubhouseChecklist.tsx, CalendarView.tsx, and TaskTemplates.tsx.

import type { TaskCategory } from './categoryMappings';

export function getCategoryBadgeColor(category: TaskCategory): string {
  switch (category) {
    case 'sanitation':
      return 'bg-blue-100 text-blue-800';
    case 'laundry':
      return 'bg-purple-100 text-purple-800';
    case 'food':
      return 'bg-orange-100 text-orange-800';
    case 'communication':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-amber-100 text-amber-800';
    case 'administration':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getCategoryLabel(category: TaskCategory): string {
  switch (category) {
    case 'sanitation':
      return '🧼 Sanitation & Facilities';
    case 'laundry':
      return '🧺 Laundry & Uniforms';
    case 'food':
      return '🍽️ Food & Nutrition';
    case 'communication':
      return '💬 Communication & Coordination';
    case 'maintenance':
      return '🧰 Maintenance & Supplies';
    case 'administration':
      return '💵 Administration & Compliance';
    default:
      return (category as string).charAt(0).toUpperCase() + (category as string).slice(1);
  }
}
