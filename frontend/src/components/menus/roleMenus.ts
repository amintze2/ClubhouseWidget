import type { RoleSidebarMenuItem } from '../RoleSidebar';
import { clubhouseManagerMenuItems } from './ClubhouseManagerMenu';
import { generalManagerMenuItems, renderGeneralManagerContent } from './GeneralManagerMenu';
import { playerMenuItems, renderPlayerContent } from './PlayerMenu';

export type UserJobRole = 'clubhouse_manager' | 'general_manager' | 'player';

export const getMenuItemsForRole = (jobRole: string): RoleSidebarMenuItem[] => {
  if (jobRole === 'general_manager') return generalManagerMenuItems;
  if (jobRole === 'player') return playerMenuItems;
  return clubhouseManagerMenuItems;
};

export const renderRoleContent = (jobRole: string, activeView: string) => {
  if (jobRole === 'general_manager') return renderGeneralManagerContent(activeView);
  if (jobRole === 'player') return renderPlayerContent(activeView);
  return null;
};
