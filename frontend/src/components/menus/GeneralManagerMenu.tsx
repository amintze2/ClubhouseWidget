import { BarChart3, ClipboardList } from 'lucide-react';
import type { RoleSidebarMenuItem } from '../RoleSidebar';
import { GeneralManagerInfo } from '../GeneralManagerInfo';
import { GeneralManagerPlayerReports } from '../GeneralManagerPlayerReports';

export const generalManagerMenuItems: RoleSidebarMenuItem[] = [
  { id: 'general_manager_info', icon: BarChart3, label: 'General Manager Info' },
  { id: 'general_manager_player_reports', icon: ClipboardList, label: 'Player Reports' },
];

export const renderGeneralManagerContent = (activeView: string) => {
  if (activeView === 'general_manager_info') return <GeneralManagerInfo />;
  if (activeView === 'general_manager_player_reports') return <GeneralManagerPlayerReports />;
  return null;
};
