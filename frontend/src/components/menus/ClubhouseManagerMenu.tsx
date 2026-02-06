import { Calendar, ClipboardList, DollarSign, Package, Repeat, Utensils } from 'lucide-react';
import type { RoleSidebarMenuItem } from '../RoleSidebar';

export const clubhouseManagerMenuItems: RoleSidebarMenuItem[] = [
  { id: 'checklist', icon: ClipboardList, label: 'Daily Checklists' },
  { id: 'calendar', icon: Calendar, label: 'Task Calendar' },
  { id: 'recurring', icon: Repeat, label: 'Recurring Tasks' },
  { id: 'inventory', icon: Package, label: 'Inventory' },
  { id: 'meals', icon: Utensils, label: 'Meal Planning' },
  { id: 'budget', icon: DollarSign, label: 'Budget' },
];
