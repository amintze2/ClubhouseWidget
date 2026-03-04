import { BarChart3, ClipboardList } from 'lucide-react';
import type { RoleSidebarMenuItem } from '../RoleSidebar';
import { GeneralManagerPlayerReports } from '../GeneralManagerPlayerReports';

export const generalManagerMenuItems: RoleSidebarMenuItem[] = [
  { id: 'general_manager_player_reports', icon: ClipboardList, label: 'Player Reports' },
];

export const renderGeneralManagerContent = (activeView: string) => {
  if (activeView === 'general_manager_player_reports') return <GeneralManagerPlayerReports />;
  return null;
};
