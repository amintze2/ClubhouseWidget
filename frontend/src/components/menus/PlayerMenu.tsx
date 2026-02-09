import { User } from 'lucide-react';
import type { RoleSidebarMenuItem } from '../RoleSidebar';
import { PlayerInfo } from '../PlayerInfo';
// import { PlayerReporting } from '../PlayerReporting';

export const playerMenuItems: RoleSidebarMenuItem[] = [
  { id: 'player_info', icon: User, label: 'Player Info' },
  // { id: 'player_reporting', icon: User, label: 'Player Reporting' },
];

export const renderPlayerContent = (activeView: string) => {
  if (activeView !== 'player_info') return null;

  return <PlayerInfo /> ;


};
