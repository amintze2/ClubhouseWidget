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
import { TaskTemplates, TemplateTask } from './components/TaskTemplates';
import { ClubhouseInventory } from './components/ClubhouseInventory';
import { RecurringTasks, RecurringTask } from './components/RecurringTasks';
import { Budget } from './components/Budget';
import { MealPlanning, PlayerDietaryInfo } from './components/MealPlanning';
import { ManagerPlayerReports } from './components/ManagerPlayerReports';
import { Login } from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { taskApi } from './services/api';
import { RoleSidebar } from './components/RoleSidebar';
import { getMenuItemsForRole, renderRoleContent } from './components/menus/roleMenus';
import { useTaskSync } from './hooks/useTaskSync';
import { useGameSeries } from './hooks/useGameSeries';
import { useInventory } from './hooks/useInventory';

type View = 'checklist' | 'status' | 'calendar' | 'games' | 'templates' | 'inventory' | 'recurring' | 'budget' | 'meals' | 'manager_player_reports' | 'player_info' | 'general_manager_info';

interface AppUser {
  username: string;
  jobRole: string;
  team?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration';
  completed: boolean;
  assignedTo: string;
  taskType?: number | null;
}

const FRONTEND_TO_DB_CATEGORY: Record<Task['category'], string> = {
  'sanitation': 'Hygiene & Personal Care',
  'laundry': 'Laundry & Cleaning',
  'food': 'Meals & Nutrition',
  'communication': 'Misc',
  'maintenance': 'Equipment & Field Support',
  'administration': 'Misc',
};

const frontendCategoryToDb = (category: Task['category']): string =>
  FRONTEND_TO_DB_CATEGORY[category] || 'Misc';

// Helper function to convert 12-hour time to 24-hour format
const convertTimeTo24Hour = (time12Hour: string): string => {
  const [time, period] = time12Hour.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  if (period?.toUpperCase() === 'PM' && hours !== 12) {
    return `${hours + 12}:${minutes.toString().padStart(2, '0')}`;
  } else if (period?.toUpperCase() === 'AM' && hours === 12) {
    return `00:${minutes.toString().padStart(2, '0')}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

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

  // Template / completion tracking state
  const [nonGameDayTasks, setNonGameDayTasks] = useState<TemplateTask[]>([]);
  const gameDayTasks: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }> = [];
  const [nonGameDayTaskCompletions, setNonGameDayTaskCompletions] = useState<Record<string, boolean>>({});
  const [gameDayTaskCompletions, setGameDayTaskCompletions] = useState<Record<string, Record<string, boolean>>>({});
  const [recurringTaskCompletions, setRecurringTaskCompletions] = useState<Record<string, Record<string, boolean>>>({});
  const [lastGameDate, setLastGameDate] = useState<string | null>(null);

  // Meal planning state
  const [playerDietaryInfo, setPlayerDietaryInfo] = useState<PlayerDietaryInfo[]>([]);
  const [gameMealPlans, setGameMealPlans] = useState<{ gameId: string; preGameSnack: string; postGameMeal: string }[]>([]);

  // Reset non-game-day task completions when the game day passes
  useEffect(() => {
    if (!user?.team) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const hasGameToday = gameSeries.some(series => {
      if (series.homeTeam !== user.team) return false;
      return series.games.some(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate.toISOString().split('T')[0] === todayStr;
      });
    });

    if (!hasGameToday && lastGameDate && lastGameDate !== todayStr) {
      const lastGame = new Date(lastGameDate);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastGame <= yesterday) {
        setNonGameDayTaskCompletions({});
        setLastGameDate(null);
      }
    }

    if (hasGameToday) setLastGameDate(todayStr);
  }, [user?.team, gameSeries, lastGameDate]);

  // ── Task handlers ─────────────────────────────────────────────────────────

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    if (!backendUser) return;
    try {
      const newBackendTask = await taskApi.createTask(backendUser.id, {
        task_name: task.title,
        task_description: task.description,
        task_complete: false,
        task_category: frontendCategoryToDb(task.category) as any,
        task_type: null,
        task_date: task.date ? task.date.toISOString().split('T')[0] : null,
        task_time: task.time || null,
        is_repeating: false,
        repeating_day: null,
      });
      setTasks(prev => [...prev, { ...task, id: newBackendTask.id.toString(), taskType: newBackendTask.task_type || null }]);
      await refreshUserData();
    } catch {
      setTasks(prev => [...prev, { ...task, id: Date.now().toString(), taskType: null }]);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!backendUser) return;
    try {
      await taskApi.toggleTask(parseInt(taskId));
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
      await refreshUserData();
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!backendUser) return;
    try {
      await taskApi.deleteTask(parseInt(taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await refreshUserData();
    } catch {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  // ── Template task handlers ────────────────────────────────────────────────

  const handleAddNonGameDayTask = (task: Omit<TemplateTask, 'id'>) =>
    setNonGameDayTasks(prev => [...prev, { ...task, id: Date.now().toString() }]);

  const handleDeleteNonGameDayTask = (taskId: string) =>
    setNonGameDayTasks(prev => prev.filter(t => t.id !== taskId));

  const handleToggleNonGameDayTask = (taskId: string) =>
    setNonGameDayTaskCompletions(prev => ({ ...prev, [taskId]: !prev[taskId] }));

  const handleToggleGameDayTask = (date: string, taskId: string) =>
    setGameDayTaskCompletions(prev => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [taskId]: !(prev[date]?.[taskId] || false) },
    }));

  const handleToggleRecurringTask = (date: string, taskId: string) =>
    setRecurringTaskCompletions(prev => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [taskId]: !(prev[date]?.[taskId] || false) },
    }));

  // ── Recurring task handlers ───────────────────────────────────────────────

  const toDbTaskTime = (time12Hour: string): string => {
    const time24 = convertTimeTo24Hour(time12Hour);
    return time24.split(':').length === 2 ? `${time24}:00` : time24;
  };

  const handleAddRecurringTask = async (task: Omit<RecurringTask, 'id'>) => {
    if (!backendUser) return;
    try {
      const newBackendTask = await taskApi.createTask(backendUser.id, {
        task_name: task.title,
        task_description: task.description,
        task_complete: false,
        task_category: frontendCategoryToDb(task.category as Task['category']) as any,
        task_type: null,
        task_date: null,
        task_time: toDbTaskTime(task.time),
        is_repeating: true,
        repeating_day: task.taskType === 'off-day' ? 0 : null,
      });
      setRecurringTasks(prev => [...prev, { ...task, id: newBackendTask.id.toString() }]);
      await refreshUserData();
    } catch {
      setRecurringTasks(prev => [...prev, { ...task, id: Date.now().toString() }]);
    }
  };

  const handleUpdateRecurringTask = async (task: RecurringTask) => {
    if (!backendUser) return;
    try {
      await taskApi.updateTask(parseInt(task.id), {
        task_name: task.title,
        task_description: task.description,
        task_category: frontendCategoryToDb(task.category as Task['category']) as any,
        task_time: toDbTaskTime(task.time),
        is_repeating: true,
        repeating_day: task.taskType === 'off-day' ? 0 : null,
      });
      setRecurringTasks(prev => prev.map(t => t.id === task.id ? task : t));
      await refreshUserData();
    } catch {
      setRecurringTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleDeleteRecurringTask = async (taskId: string) => {
    if (!backendUser) return;
    try {
      await taskApi.deleteTask(parseInt(taskId));
      setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
      await refreshUserData();
    } catch {
      setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

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
