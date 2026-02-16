import { User, Utensils, MessageSquare } from 'lucide-react';
import type { RoleSidebarMenuItem } from '../RoleSidebar';
import { PlayerInfo } from '../PlayerInfo';
import { PlayerMeals } from '../PlayerMeals';
import { PlayerReporting } from '../PlayerReporting';

export const playerMenuItems: RoleSidebarMenuItem[] = [
  { id: 'player_info', icon: User, label: 'Player Info' },
  { id: 'player_meals', icon: Utensils, label: 'Meal Schedule' },
  { id: 'player_reporting', icon: MessageSquare, label: 'Issue Reporting' },
];

export const renderPlayerContent = (activeView: string) => {
  if (activeView === 'player_info') return <PlayerInfo />;
  if (activeView === 'player_meals') return <PlayerMeals />;
  if (activeView === 'player_reporting') return <PlayerReporting />;

  return null;
};
