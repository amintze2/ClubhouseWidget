import type React from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from './ui/sidebar';
import { ClipboardList, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getMenuItemsForRole } from './menus/roleMenus';

export type RoleSidebarView = string;

export interface RoleSidebarMenuItem {
  id: RoleSidebarView;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

interface RoleSidebarUser {
  username: string;
  jobRole: string;
  team?: string;
}

interface RoleSidebarProps {
  user: RoleSidebarUser;
  activeView: RoleSidebarView;
  onSelectView: (view: RoleSidebarView) => void;
  onSignOut: () => void;
}

const roleTitle = (jobRole: string) => {
  if (jobRole === 'general_manager') return 'General Manager';
  if (jobRole === 'player') return 'Player';
  return 'Clubhouse Manager';
};

const roleSubtitle = (jobRole: string) => {
  if (jobRole === 'general_manager') return 'Front Office';
  if (jobRole === 'player') return 'Roster';
  return 'Baseball Operations';
};

export function RoleSidebar({
  user,
  activeView,
  onSelectView,
  onSignOut,
}: RoleSidebarProps) {
  const menuItems = getMenuItemsForRole(user.jobRole);
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{roleTitle(user.jobRole)}</h2>
            <p className="text-xs text-gray-500">{roleSubtitle(user.jobRole)}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectView(item.id)}
                    isActive={activeView === item.id}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-600 text-white">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{user.username}</p>
            <p className="text-xs text-gray-500 truncate">
              {user.team ? `${user.team} ${user.jobRole.replace(/_/g, ' ')}` : user.jobRole.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
