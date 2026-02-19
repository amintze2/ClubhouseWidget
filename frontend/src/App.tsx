// Main application shell for the Clubhouse Manager widget.
// - Wires authentication + data loading via AuthContext and Supabase APIs.
// - Chooses which feature view to show based on the user's role and sidebar navigation.
import { useState, useEffect, useMemo } from 'react';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { User } from 'lucide-react';
import { ClubhouseChecklist } from './components/ClubhouseChecklist';
import { ClubhouseStatus } from './components/ClubhouseStatus';
import { CalendarView } from './components/CalendarView';
import { GameSchedule } from './components/GameSchedule';
import { TaskTemplates } from './components/TaskTemplates';
import { ClubhouseInventory } from './components/ClubhouseInventory';
import { RecurringTasks } from './components/RecurringTasks';
import { Budget } from './components/Budget';
import { MealPlanning } from './components/MealPlanning';
import { ManagerPlayerReports } from './components/ManagerPlayerReports';
import { Login } from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { RoleSidebar } from './components/RoleSidebar';
import { getMenuItemsForRole, renderRoleContent } from './components/menus/roleMenus';
import { useTaskSync } from './hooks/useTaskSync';
import { useGameSeries } from './hooks/useGameSeries';
import { useInventory } from './hooks/useInventory';
import { useTaskManagement } from './hooks/useTaskManagement';
import { useMealManagement } from './hooks/useMealManagement';
import { useChecklistState } from './hooks/useChecklistState';
import type { Task, AppUser, View } from './types/index';

// Re-export Task so existing component imports from '../App' continue to resolve
export type { Task };

// Check if running in iframe (SLUGGER shell)
const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

export default function App() {
  const { user: backendUser, userData, loading: authLoading, logout, refreshUserData } = useAuth();

  // Derive frontend user from backend user — no separate state needed
  const user = useMemo<AppUser | null>(() => {
    if (!backendUser) return null;
    return {
      username: backendUser.user_name || 'User',
      jobRole: backendUser.user_role?.toLowerCase().includes('general') ? 'general_manager'
             : backendUser.user_role?.toLowerCase().includes('manager') ? 'clubhouse_manager'
             : 'player',
      team: backendUser.team_name || undefined,
    };
  }, [backendUser]);

  const [activeView, setActiveView] = useState<View>('checklist');
  const [hasSetInitialView, setHasSetInitialView] = useState(false);

  // Set initial view once when the user first loads
  useEffect(() => {
    if (user && !hasSetInitialView) {
      const initialMenuItems = getMenuItemsForRole(user.jobRole);
      setActiveView((initialMenuItems[0]?.id as View) || 'checklist');
      setHasSetInitialView(true);
    }
  }, [user, hasSetInitialView]);

  // Redirect to a valid view if the role changes
  useEffect(() => {
    if (!user) return;
    const allowedViews = getMenuItemsForRole(user.jobRole).map(item => item.id);
    if (!allowedViews.includes(activeView)) {
      setActiveView((allowedViews[0] as View) || 'checklist');
    }
  }, [user, activeView]);

  // Data hooks
  const { tasks, setTasks, recurringTasks, setRecurringTasks } = useTaskSync(backendUser, userData);
  const { gameSeries, handleAddGameSeries, handleDeleteGameSeries } = useGameSeries(backendUser?.user_team);
  const { inventoryData, setInventoryData } = useInventory(userData);

  // State hooks
  const {
    nonGameDayTasks,
    gameDayTasks,
    nonGameDayTaskCompletions,
    gameDayTaskCompletions,
    recurringTaskCompletions,
    handleAddNonGameDayTask,
    handleDeleteNonGameDayTask,
    handleToggleNonGameDayTask,
    handleToggleGameDayTask,
    handleToggleRecurringTask,
  } = useChecklistState(gameSeries, user?.team);

  const { playerDietaryInfo, setPlayerDietaryInfo, gameMealPlans, setGameMealPlans } = useMealManagement();

  const {
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleAddRecurringTask,
    handleUpdateRecurringTask,
    handleDeleteRecurringTask,
  } = useTaskManagement(backendUser, setTasks, setRecurringTasks, refreshUserData);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg mb-2">Loading...</div>
            {isInIframe && (
              <div className="text-sm text-gray-500">Waiting for SLUGGER authentication...</div>
            )}
          </div>
        </div>
      );
    }
    if (!isInIframe) return <Login />;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Authentication Error</div>
          <div className="text-sm text-gray-500">Unable to authenticate with SLUGGER platform.</div>
        </div>
      </div>
    );
  }

  const menuItems = getMenuItemsForRole(user.jobRole);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50">
        <RoleSidebar
          user={user}
          activeView={activeView}
          onSelectView={(view) => setActiveView(view as View)}
          onSignOut={logout}
        />

        <div className="flex-1">
          <header className="bg-white border-b px-8 py-4 flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="font-semibold text-xl">{menuItems.find(item => item.id === activeView)?.label}</h1>
              <p className="text-sm text-gray-500">Clubhouse Management Widget</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.username}</span>
            </div>
          </header>

          <main className="p-8">
            {activeView === 'checklist' && (
              <ClubhouseChecklist
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                gameSeries={gameSeries}
                userTeam={user.team}
                nonGameDayTasks={nonGameDayTasks}
                nonGameDayTaskCompletions={nonGameDayTaskCompletions}
                onToggleNonGameDayTask={handleToggleNonGameDayTask}
                gameDayTasks={gameDayTasks}
                gameDayTaskCompletions={gameDayTaskCompletions}
                onToggleGameDayTask={handleToggleGameDayTask}
                recurringTasks={recurringTasks}
                recurringTaskCompletions={recurringTaskCompletions}
                onToggleRecurringTask={handleToggleRecurringTask}
              />
            )}
            {activeView === 'status' && <ClubhouseStatus tasks={tasks} />}
            {activeView === 'games' && (
              <GameSchedule
                gameSeries={gameSeries}
                onAddGameSeries={handleAddGameSeries}
                onDeleteGameSeries={handleDeleteGameSeries}
                userTeam={user.team}
              />
            )}
            {activeView === 'templates' && (
              <TaskTemplates
                nonGameDayTasks={nonGameDayTasks}
                gameDayTasks={gameDayTasks}
                onAddNonGameDayTask={handleAddNonGameDayTask}
                onDeleteNonGameDayTask={handleDeleteNonGameDayTask}
              />
            )}
            {activeView === 'calendar' && (
              <CalendarView
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                gameSeries={gameSeries}
                userTeam={user.team}
                nonGameDayTasks={nonGameDayTasks}
                nonGameDayTaskCompletions={nonGameDayTaskCompletions}
                onToggleNonGameDayTask={handleToggleNonGameDayTask}
                gameDayTasks={gameDayTasks}
                gameDayTaskCompletions={gameDayTaskCompletions}
                onToggleGameDayTask={handleToggleGameDayTask}
                recurringTasks={recurringTasks}
                recurringTaskCompletions={recurringTaskCompletions}
                onToggleRecurringTask={handleToggleRecurringTask}
              />
            )}
            {activeView === 'inventory' && (
              <ClubhouseInventory inventoryData={inventoryData} setInventoryData={setInventoryData} />
            )}
            {activeView === 'recurring' && (
              <RecurringTasks
                tasks={recurringTasks}
                onAddTask={handleAddRecurringTask}
                onUpdateTask={handleUpdateRecurringTask}
                onDeleteTask={handleDeleteRecurringTask}
              />
            )}
            {activeView === 'meals' && (
              <MealPlanning
                players={playerDietaryInfo}
                setPlayers={setPlayerDietaryInfo}
                gameSeries={gameSeries}
                userTeam={user.team}
                gameMealPlans={gameMealPlans}
                setGameMealPlans={setGameMealPlans}
              />
            )}
            {activeView === 'budget' && <Budget inventoryData={inventoryData} />}
            {activeView === 'manager_player_reports' && <ManagerPlayerReports />}
            {renderRoleContent(user.jobRole, activeView)}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
