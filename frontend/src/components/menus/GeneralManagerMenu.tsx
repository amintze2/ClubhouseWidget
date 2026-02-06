import { BarChart3 } from 'lucide-react';
import type { RoleSidebarMenuItem } from '../RoleSidebar';
import { GeneralManagerInfo } from '../GeneralManagerInfo';

export const generalManagerMenuItems: RoleSidebarMenuItem[] = [
  { id: 'general_manager_info', icon: BarChart3, label: 'General Manager Info' },
];

export const renderGeneralManagerContent = (activeView: string) => {
  if (activeView !== 'general_manager_info') return null;
  return <GeneralManagerInfo />;
};
