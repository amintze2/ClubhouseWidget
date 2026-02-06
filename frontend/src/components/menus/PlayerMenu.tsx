import { User } from 'lucide-react';
import type { RoleSidebarMenuItem } from '../RoleSidebar';
import { PlayerInfo } from '../PlayerInfo';

export const playerMenuItems: RoleSidebarMenuItem[] = [
  { id: 'player_info', icon: User, label: 'Player Info' },
];

export const renderPlayerContent = (activeView: string) => {
  if (activeView !== 'player_info') return null;
  return <PlayerInfo />;
};
