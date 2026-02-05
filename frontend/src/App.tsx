// Main application shell for the Clubhouse Manager widget.
// - Wires authentication + data loading via AuthContext and Supabase APIs.
// - Normalizes backend data (tasks, inventory, games, meals) into frontend state.
// - Chooses which feature view to show (checklist, calendar, inventory, etc.)
//   based on the current user's role and sidebar navigation.
import React, { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger, SidebarFooter } from './components/ui/sidebar';
import { ClipboardList, LogOut, User, Calendar, BarChart3, Trophy, FileText, Package, Repeat, DollarSign, Utensils } from 'lucide-react';
import { ClubhouseChecklist } from './components/ClubhouseChecklist';
import { ClubhouseStatus } from './components/ClubhouseStatus';
import { CalendarView } from './components/CalendarView';
import { GameSchedule, GameSeries } from './components/GameSchedule';
import { TaskTemplates, TemplateTask } from './components/TaskTemplates';
import { ClubhouseInventory, InventoryItem } from './components/ClubhouseInventory';
import { RecurringTasks, RecurringTask } from './components/RecurringTasks';
import { Budget } from './components/Budget';
import { MealPlanning, PlayerDietaryInfo } from './components/MealPlanning';
import { Login } from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { inventoryApi, taskApi, gamesApi, teamsApi, Inventory, Game } from './services/api';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';

type View = 'checklist' | 'status' | 'calendar' | 'games' | 'templates' | 'inventory' | 'recurring' | 'budget' | 'meals';

interface User {
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
  taskType?: number | null; // 1 = game day only, 2 = off day only, null = all days
}

// Helper functions to map between database enum and frontend display values
const dbCategoryToFrontend = (dbCategory: string | null): Task['category'] => {
  if (!dbCategory) {
    return 'sanitation';
  }
  
  // Normalize the category value (trim whitespace, handle case)
  const normalized = String(dbCategory).trim().toLowerCase();
  
  // Map database enum values (with spaces and title case) to frontend categories
  const mapping: Record<string, Task['category']> = {
    // Handle both formats: original enum format and normalized
    'medical & safety': 'sanitation',
    'medical_safety': 'sanitation',
    'equipment & field support': 'maintenance',
    'equipment_field_support': 'maintenance',
    'laundry & cleaning': 'laundry',
    'laundry_cleaning': 'laundry',
    'hygiene & personal care': 'sanitation',
    'hygiene_personal_care': 'sanitation',
    'meals & nutrition': 'food',
    'meals_nutrition': 'food',
    'misc': 'administration',
    'miscellaneous': 'administration',
  };
  
  const mapped = mapping[normalized];
  if (!mapped) {
    return 'sanitation';
  }
  
  return mapped;
};

const frontendCategoryToDb = (frontendCategory: Task['category']): string => {
  // Map frontend categories to database enum values (using the actual enum format with spaces)
  const mapping: Record<Task['category'], string> = {
    'sanitation': 'Hygiene & Personal Care', // Maps to hygiene_personal_care enum
    'laundry': 'Laundry & Cleaning',
    'food': 'Meals & Nutrition',
    'communication': 'Misc',
    'maintenance': 'Equipment & Field Support',
    'administration': 'Misc',
  };
  return mapping[frontendCategory] || 'Misc';
};

// Helper function to convert 24-hour time to 12-hour format
const convertTimeTo12Hour = (time24Hour: string): string => {
  const [hours, minutes] = time24Hour.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Check if running in iframe (SLUGGER shell)
const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

export default function App() {
  const { user: backendUser, userData, loading: authLoading, logout, refreshUserData } = useAuth();
  
  // Map backend user to frontend User format
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('checklist');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasSetInitialView, setHasSetInitialView] = useState(false);
  
  // Set initial view only once when user first loads
  useEffect(() => {
    if (backendUser && userData && !hasSetInitialView) {
      const frontendUser: User = {
        username: backendUser.user_name || 'User',
        jobRole: backendUser.user_role?.toLowerCase().includes('general') ? 'general_manager' : 
                 backendUser.user_role?.toLowerCase().includes('manager') ? 'clubhouse_manager' : 'player',
        team: backendUser.team_name || undefined,
      };
      setUser(frontendUser);
      setActiveView(frontendUser.jobRole === 'general_manager' ? 'status' : 'checklist');
      setHasSetInitialView(true);
    }
  }, [backendUser, userData, hasSetInitialView]);
  
  // Sync backend user data to frontend format (without changing view)
  useEffect(() => {
    if (backendUser && userData) {
      const frontendUser: User = {
        username: backendUser.user_name || 'User',
        jobRole: backendUser.user_role?.toLowerCase().includes('general') ? 'general_manager' : 
                 backendUser.user_role?.toLowerCase().includes('manager') ? 'clubhouse_manager' : 'player',
        team: backendUser.team_name || undefined,
      };
      setUser(frontendUser);
      
      // Convert backend tasks to frontend Task format
      const frontendTasks: Task[] = (userData.tasks || []).map(task => {
        // Parse task_date properly to avoid timezone issues
        // If task_date is a date-only string (YYYY-MM-DD), parse it as local date
        let taskDate: Date;
        if (task.task_date) {
          const dateStr = task.task_date.toString();
          // Check if it's a date-only string (YYYY-MM-DD format)
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // Parse as local date to avoid timezone conversion
            const [year, month, day] = dateStr.split('-').map(Number);
            taskDate = new Date(year, month - 1, day);
          } else {
            // Full datetime string - parse normally
            taskDate = new Date(task.task_date);
          }
        } else {
          // Fall back to created_at
          taskDate = new Date(task.created_at);
        }
        
        // Use task_time if available, otherwise default to '09:00'
        const taskTime = task.task_time || '09:00';
        
        // Map database category to frontend category
        const mappedCategory = dbCategoryToFrontend(task.task_category);
        
        return {
          id: task.id.toString(),
          title: task.task_name || '',
          description: task.task_description || '',
          date: taskDate,
          time: taskTime,
          category: mappedCategory,
          completed: task.task_complete || false,
          assignedTo: backendUser.user_name || '',
          taskType: task.task_type || null,
        };
      });
      setTasks(frontendTasks);
      
      // Convert recurring tasks (is_repeating = true) to RecurringTask format
      const recurringTasksFromDb: RecurringTask[] = (userData.tasks || [])
        .filter(task => task.is_repeating)
        .map(task => {
          // Convert time from 24-hour to 12-hour format
          const time12Hour = convertTimeTo12Hour(task.task_time || '09:00');
          
          // Map repeating_day to taskType
          // 0 = off-day, 1-6 = game-day (series days)
          const taskType: 'off-day' | 'game-day' = task.repeating_day === 0 ? 'off-day' : 'game-day';
          
          return {
            id: task.id.toString(),
            title: task.task_name || '',
            description: task.task_description || '',
            category: dbCategoryToFrontend(task.task_category),
            taskType,
            time: time12Hour,
            timePeriod: taskType === 'game-day' ? 'morning' : undefined, // Default to morning for game-day
            enabled: true,
          };
        });
      setRecurringTasks(recurringTasksFromDb);
    } else {
      setUser(null);
    }
  }, [backendUser, userData]);
  
  // Template tasks for non-game days (empty - templates can be managed in UI)
  const [nonGameDayTasks, setNonGameDayTasks] = useState<TemplateTask[]>([]);
  
  // Template tasks for game days - organized by time period (empty - templates can be managed in UI)
  const gameDayTasks: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }> = [];
  
  // Games state - will be fetched from database
  const [gameSeries, setGameSeries] = useState<GameSeries[]>([]);
  
  // Track completion status of non-game day tasks
  const [nonGameDayTaskCompletions, setNonGameDayTaskCompletions] = useState<Record<string, boolean>>({});
  
  // Track completion status of game day tasks by date
  const [gameDayTaskCompletions, setGameDayTaskCompletions] = useState<Record<string, Record<string, boolean>>>({});
  
  // Track completion status of recurring tasks by date
  const [recurringTaskCompletions, setRecurringTaskCompletions] = useState<Record<string, Record<string, boolean>>>({});
  
  // Track the last game date to know when to reset
  const [lastGameDate, setLastGameDate] = useState<string | null>(null);

  // Fetch games from database and convert to GameSeries format
  useEffect(() => {
    const fetchGames = async () => {
      if (!backendUser?.user_team) return;
      
      try {
        const games = await gamesApi.getGamesByTeam(backendUser.user_team);
        
        // Group games by series (consecutive games between same teams)
        const seriesMap = new Map<string, GameSeries>();
        
        games.forEach((game: Game) => {
          const key = `${game.home_team_id}-${game.away_team_id}`;
          const reverseKey = `${game.away_team_id}-${game.home_team_id}`;
          
          // Check if this game belongs to an existing series
          let seriesKey = key;
          let existingSeries = seriesMap.get(key);
          if (!existingSeries) {
            existingSeries = seriesMap.get(reverseKey);
            seriesKey = reverseKey;
          }
          
          if (existingSeries) {
            // Add game to existing series
            const gameDate = game.date ? new Date(game.date) : new Date();
            existingSeries.games.push({
              id: game.id.toString(),
              date: gameDate,
              gameNumber: existingSeries.games.length + 1,
            });
          } else {
            // Create new series
            const gameDate = game.date ? new Date(game.date) : new Date();
            seriesMap.set(key, {
              id: `series-${game.id}`,
              homeTeam: game.home_team_name || `Team ${game.home_team_id}`,
              visitingTeam: game.away_team_name || `Team ${game.away_team_id}`,
              games: [{
                id: game.id.toString(),
                date: gameDate,
                gameNumber: 1,
              }],
            });
          }
        });
        
        // Convert map to array and sort by date
        const seriesArray = Array.from(seriesMap.values()).sort((a, b) => {
          const aDate = a.games[0]?.date || new Date(0);
          const bDate = b.games[0]?.date || new Date(0);
          return aDate.getTime() - bDate.getTime();
        });
        
        setGameSeries(seriesArray);
      } catch (error) {
      }
    };
    
    fetchGames();
  }, [backendUser?.user_team]);

  // Convert backend inventory to frontend format
  useEffect(() => {
    // Initialize all categories with empty arrays
    const groupedInventory: Record<string, InventoryItem[]> = {
      laundry: [],
      hygiene: [],
      medical: [],
      equipment: [],
      food: [],
      miscellaneous: [],
    };
    
    if (!userData?.inventory) {
      setInventoryData(groupedInventory);
      return;
    }
    
    // Map inventory_type enum to category names (inventory_type is now a string enum with spaces)
    const categoryMap: Record<string, string> = {
      // Handle both formats: original enum format and normalized
      'medical & safety': 'medical',
      'medical_safety': 'medical',
      'equipment & field support': 'equipment',
      'equipment_field_support': 'equipment',
      'laundry & cleaning': 'laundry',
      'laundry_cleaning': 'laundry',
      'hygiene & personal care': 'hygiene',
      'hygiene_personal_care': 'hygiene',
      'meals & nutrition': 'food',
      'meals_nutrition': 'food',
      'misc': 'miscellaneous',
      'miscellaneous': 'miscellaneous',
    };
    
    // Group inventory by category
    userData.inventory.forEach((item: Inventory) => {
      // inventory_type is now a TaskCategory enum (string with spaces), normalize and map it to inventory category
      const normalizedType = item.inventory_type ? String(item.inventory_type).trim().toLowerCase() : '';
      const inventoryCategory = normalizedType 
        ? (categoryMap[normalizedType] || 'miscellaneous')
        : 'miscellaneous';
      
      if (!groupedInventory[inventoryCategory]) {
        groupedInventory[inventoryCategory] = [];
      }
      
      groupedInventory[inventoryCategory].push({
        id: item.id.toString(),
        name: item.inventory_item || '',
        category: inventoryCategory,
        unit: item.unit || '',
        par_level: item.required_stock || 0,
        current_stock: item.current_stock || 0,
        price: item.price_per_unit || 0,
        notes: item.note || undefined,
        link: item.purchase_link || undefined,
      });
    });
    
    setInventoryData(groupedInventory);
  }, [userData?.inventory]);

  // Recurring tasks (empty - not stored in DB yet)
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  
  const [playerDietaryInfo, setPlayerDietaryInfo] = useState<PlayerDietaryInfo[]>([]);
  const [gameMealPlans, setGameMealPlans] = useState<{ gameId: string; preGameSnack: string; postGameMeal: string }[]>([]);

  // Inventory data - will be populated from database
  const [inventoryData, setInventoryData] = useState<Record<string, InventoryItem[]>>({});

  const handleSignOut = () => {
    logout();
    setUser(null);
  };

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    if (!backendUser) return;
    
    try {
      // Format date as YYYY-MM-DD for the database
      const taskDate = task.date ? task.date.toISOString().split('T')[0] : null;
      // Format time as HH:MM:SS or HH:MM for the database
      const taskTime = task.time ? (task.time.includes(':') ? task.time : `${task.time}:00`) : null;
      
      const newBackendTask = await taskApi.createTask(backendUser.id, {
        task_name: task.title,
        task_description: task.description,
        task_complete: false,
        task_category: frontendCategoryToDb(task.category) as any,
        task_type: null,
        task_date: taskDate,
        task_time: taskTime,
        is_repeating: false,
        repeating_day: null,
      });
      
      const newTask: Task = {
        ...task,
        id: newBackendTask.id.toString(),
        taskType: newBackendTask.task_type || null,
      };
      setTasks([...tasks, newTask]);
      await refreshUserData();
    } catch (error) {
      // Fallback to local state if API fails
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        taskType: null,
      };
      setTasks([...tasks, newTask]);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!backendUser) return;
    
    try {
      await taskApi.toggleTask(parseInt(taskId));
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
      await refreshUserData();
    } catch (error) {
      // Fallback to local state if API fails
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!backendUser) return;
    
    try {
      await taskApi.deleteTask(parseInt(taskId));
      setTasks(tasks.filter(task => task.id !== taskId));
      await refreshUserData();
    } catch (error) {
      // Fallback to local state if API fails
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const handleAddGameSeries = async (series: Omit<GameSeries, 'id'>) => {
    if (!backendUser?.user_team) return;
    
    try {
      // Get team IDs from team names
      const teams = await teamsApi.getAllTeams();
      const homeTeam = teams.find(t => t.team_name === series.homeTeam);
      const awayTeam = teams.find(t => t.team_name === series.visitingTeam);
      
      if (!homeTeam || !awayTeam) {
        return;
      }
      
      // Create games in database
      for (const game of series.games) {
        await gamesApi.createGame({
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          date: game.date.toISOString().split('T')[0],
          time: game.time || null,
        });
      }
      
      // Refresh games
      const games = await gamesApi.getGamesByTeam(backendUser.user_team);
      // Convert games to series format (same logic as in useEffect)
      // ... (simplified - just refresh the list)
      await refreshUserData();
    } catch (error) {
    }
  };

  const handleDeleteGameSeries = async (seriesId: string) => {
    try {
      // Find the series and delete all games in it
      const series = gameSeries.find(s => s.id === seriesId);
      if (!series) return;
      
      // Delete each game in the series
      for (const game of series.games) {
        await gamesApi.deleteGame(parseInt(game.id));
      }
      
      // Refresh games
      setGameSeries(gameSeries.filter(s => s.id !== seriesId));
    } catch (error) {
    }
  };

  const handleAddNonGameDayTask = (task: Omit<TemplateTask, 'id'>) => {
    const newTask: TemplateTask = {
      ...task,
      id: Date.now().toString(),
    };
    setNonGameDayTasks([...nonGameDayTasks, newTask]);
  };

  const handleDeleteNonGameDayTask = (taskId: string) => {
    setNonGameDayTasks(nonGameDayTasks.filter(task => task.id !== taskId));
  };

  const handleToggleNonGameDayTask = (taskId: string) => {
    setNonGameDayTaskCompletions(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleResetNonGameDayTasks = () => {
    setNonGameDayTaskCompletions({});
  };

  const handleToggleGameDayTask = (date: string, taskId: string) => {
    setGameDayTaskCompletions(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        [taskId]: !(prev[date]?.[taskId] || false),
      },
    }));
  };

  const handleToggleRecurringTask = (date: string, taskId: string) => {
    setRecurringTaskCompletions(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        [taskId]: !(prev[date]?.[taskId] || false),
      },
    }));
  };

  // Helper function to convert 12-hour time to 24-hour format
  const convertTimeTo24Hour = (time12Hour: string): string => {
    const [time, period] = time12Hour.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      return `${hours + 12}:${minutes.toString().padStart(2, '0')}`;
    } else if (period?.toUpperCase() === 'AM' && hours === 12) {
      return `00:${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  };

  const handleAddRecurringTask = async (task: Omit<RecurringTask, 'id'>) => {
    if (!backendUser) return;
    
    try {
      // Convert time from "09:00 AM" format to "HH:MM:SS" format
      const time24Hour = convertTimeTo24Hour(task.time);
      const taskTime = time24Hour.includes(':') 
        ? (time24Hour.split(':').length === 2 ? `${time24Hour}:00` : time24Hour)
        : `${time24Hour}:00:00`;
      
      // Map taskType to repeating_day
      // 0 = off-day, 1-6 = series days
      const repeatingDay = task.taskType === 'off-day' ? 0 : null;
      
      // Create the recurring task in the database
      const newBackendTask = await taskApi.createTask(backendUser.id, {
        task_name: task.title,
        task_description: task.description,
        task_complete: false,
        task_category: frontendCategoryToDb(task.category) as any,
        task_type: null,
        task_date: null, // Recurring tasks don't have a specific date
        task_time: taskTime,
        is_repeating: true,
        repeating_day: repeatingDay,
      });
      
      const newTask: RecurringTask = {
        ...task,
        id: newBackendTask.id.toString(),
      };
      setRecurringTasks([...recurringTasks, newTask]);
      await refreshUserData();
    } catch (error) {
      // Fallback to local state if API fails
      const newTask: RecurringTask = {
        ...task,
        id: Date.now().toString(),
      };
      setRecurringTasks([...recurringTasks, newTask]);
    }
  };

  const handleUpdateRecurringTask = async (task: RecurringTask) => {
    if (!backendUser) return;
    
    try {
      // Convert time from "09:00 AM" format to "HH:MM:SS" format
      const time24Hour = convertTimeTo24Hour(task.time);
      const taskTime = time24Hour.includes(':') 
        ? (time24Hour.split(':').length === 2 ? `${time24Hour}:00` : time24Hour)
        : `${time24Hour}:00:00`;
      
      // Map taskType to repeating_day
      const repeatingDay = task.taskType === 'off-day' ? 0 : null;
      
      // Update the recurring task in the database
      await taskApi.updateTask(parseInt(task.id), {
        task_name: task.title,
        task_description: task.description,
        task_category: frontendCategoryToDb(task.category) as any,
        task_time: taskTime,
        is_repeating: true,
        repeating_day: repeatingDay,
      });
      
      setRecurringTasks(recurringTasks.map(t => t.id === task.id ? task : t));
      await refreshUserData();
    } catch (error) {
      // Fallback to local state if API fails
      setRecurringTasks(recurringTasks.map(t => t.id === task.id ? task : t));
    }
  };

  const handleDeleteRecurringTask = async (taskId: string) => {
    if (!backendUser) return;
    
    try {
      // Delete the recurring task from the database
      await taskApi.deleteTask(parseInt(taskId));
      setRecurringTasks(recurringTasks.filter(task => task.id !== taskId));
      await refreshUserData();
    } catch (error) {
      // Fallback to local state if API fails
      setRecurringTasks(recurringTasks.filter(task => task.id !== taskId));
    }
  };

  // Check if we need to reset non-game day tasks
  useEffect(() => {
    if (!user?.team) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Check if there's a game today for this team
    const hasGameToday = gameSeries.some(series => {
      if (series.homeTeam !== user.team) return false;
      return series.games.some(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate.toISOString().split('T')[0] === todayStr;
      });
    });

    // If there's no game today but there was a game before, reset tasks
    if (!hasGameToday && lastGameDate && lastGameDate !== todayStr) {
      const lastGame = new Date(lastGameDate);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If the last game was yesterday or earlier, and today has no game, reset
      if (lastGame <= yesterday) {
        handleResetNonGameDayTasks();
        setLastGameDate(null);
      }
    }

    // If there's a game today, update the last game date
    if (hasGameToday) {
      setLastGameDate(todayStr);
    }
  }, [user?.team, gameSeries, lastGameDate]);

  if (!user) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
          <div className="text-center">
            <div className="text-lg mb-2">Loading...</div>
            {isInIframe && (
              <div className="text-sm text-[var(--ui-text-muted)]">Waiting for SLUGGER authentication...</div>
            )}
          </div>
        </div>
      );
    }
    // Only show login if not in iframe (SLUGGER handles auth in iframe)
    if (!isInIframe) {
      return <Login />;
    }
    // In iframe but no auth - show error
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div className="text-center">
          <div className="text-lg text-red-700 mb-2">Authentication Error</div>
          <div className="text-sm text-[var(--ui-text-muted)]">Unable to authenticate with SLUGGER platform.</div>
        </div>
      </div>
    );
  }

  // Different menu items based on role
  const getMenuItems = () => {
    if (user.jobRole === 'general_manager') {
      return [
        { id: 'status' as View, icon: BarChart3, label: 'Clubhouse Status' },
        { id: 'games' as View, icon: Trophy, label: 'Game Schedule' },
        { id: 'templates' as View, icon: FileText, label: 'Task Templates' },
        { id: 'budget' as View, icon: DollarSign, label: 'Budget' },
      ];
    }
    return [
      { id: 'checklist' as View, icon: ClipboardList, label: 'Daily Checklists' },
      { id: 'calendar' as View, icon: Calendar, label: 'Task Calendar' },
      { id: 'recurring' as View, icon: Repeat, label: 'Recurring Tasks' },
      { id: 'inventory' as View, icon: Package, label: 'Inventory' },
      { id: 'meals' as View, icon: Utensils, label: 'Meal Planning' },
      { id: 'budget' as View, icon: DollarSign, label: 'Budget' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#F4F6F8]">
        <Sidebar className=" border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 bg-[#1F3A5F] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Clubhouse Manager</h2>
                <p className="text-sm">Baseball Operations</p>
                <div className="mt-2 inline-flex items-center rounded-md bg-white/15 px-2 py-1">
                  <span className="text-xs font-semibold">
                    {user.team ? `${user.team} ${user.jobRole.replace(/_/g, ' ')}` : user.jobRole.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="text-slate-900">
            <SidebarGroup>
              <SidebarGroupContent className="text-slate-900">
                <SidebarMenu className="text-slate-900">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.id)}
                        isActive={activeView === item.id}
                        className="min-h-[48px] py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 data-[active=true]:bg-[#E6EDF6] data-[active=true]:text-[#1F3A5F]"
                      >
                        <item.icon className="h-5 w-5 text-slate-900" />
                        <span className="text-slate-900">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#1F3A5F] text-white">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-slate-600 truncate">
                  {user.team ? `${user.team} ${user.jobRole.replace(/_/g, ' ')}` : user.jobRole.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full h-10 text-sm font-semibold border-slate-300 hover:border-[#1F3A5F] hover:text-[#1F3A5F]"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1">
          <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">
                {menuItems.find(item => item.id === activeView)?.label}
              </h1>
              <p className="text-sm text-slate-600">Manage your clubhouse operations</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <User className="h-4 w-4" />
              <span className="font-medium">{user.username}</span>
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
            {activeView === 'status' && (
              <ClubhouseStatus tasks={tasks} />
            )}
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
              <ClubhouseInventory 
                inventoryData={inventoryData}
                setInventoryData={setInventoryData}
              />
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
            {activeView === 'budget' && (
              <Budget inventoryData={inventoryData} />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
