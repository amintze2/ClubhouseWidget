// API service for connecting directly to Supabase (no backend server needed)

// Task category enum (matches PostgreSQL enum type)
// Note: PostgreSQL enum values are stored with spaces and title case
export type TaskCategory = 
  | 'Medical & Safety'
  | 'Equipment & Field Support'
  | 'Laundry & Cleaning'
  | 'Hygiene & Personal Care'
  | 'Meals & Nutrition'
  | 'Misc';

// Import Supabase client
import { supabase } from '../utils/supabase/client';

// SLUGGER SDK integration
import { SluggerWidgetSDK } from './slugger-widget-sdk';

let sluggerSDK: SluggerWidgetSDK | null = null;

export function setSluggerSDK(sdk: SluggerWidgetSDK | null) {
  sluggerSDK = sdk;
}

export function getSluggerSDK(): SluggerWidgetSDK | null {
  return sluggerSDK;
}

// Helper to get current slugger_user_id from SDK
function getSluggerUserId(): string | null {
  if (sluggerSDK && sluggerSDK.isAuthenticated()) {
    const user = sluggerSDK.getUser();
    return user?.id || null;
  }
  return null;
}

export interface User {
  id: number;
  created_at: string;
  user_role: string | null;
  user_team: number | null; // Team ID (foreign key)
  team_name?: string | null; // Team name (included in API responses)
  slugger_user_id: string | null;
  user_name: string | null;
}

export interface Inventory {
  id: number;
  team_id: number | null;
  meal_id: number | null;
  inventory_type: TaskCategory | null;
  inventory_item: string | null;
  current_stock: number | null;
  required_stock: number | null;
  unit: string | null;
  purchase_link: string | null;
  note: string | null;
  price_per_unit: number | null;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number | null;
  task_name: string | null;
  task_complete: boolean | null;
  task_category: TaskCategory | null;
  task_description: string | null;
  task_type: number | null;
  task_date: string | null;
  task_time: string | null;
  is_repeating: boolean;
  repeating_day: number | null;
  created_at: string;
}

export interface UserWithData extends User {
  inventory: Inventory[];
  tasks: Task[];
}

export interface Team {
  id: number;
  team_name: string;
  created_at: string;
}

export interface Game {
  id: number;
  home_team_id: number;
  away_team_id: number;
  date: string | null;
  time: string | null;
  created_at: string;
  home_team_name?: string;
  away_team_name?: string;
}

export interface Meal {
  id: number;
  game_id: number;
  pre_game_snack: string | null;
  post_game_meal: string | null;
  created_at: string;
}

// Helper to add team name to user
async function addTeamNameToUser(user: User): Promise<User> {
  if (user.user_team) {
    const { data: team } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', user.user_team)
      .single();
    
    if (team) {
      return { ...user, team_name: team.team_name };
    }
  }
  return { ...user, team_name: null };
}

// Helper to add team names to games
async function addTeamNamesToGames(games: Game[]): Promise<Game[]> {
  if (games.length === 0) return games;
  
  const teamIds = new Set<number>();
  games.forEach(game => {
    teamIds.add(game.home_team_id);
    teamIds.add(game.away_team_id);
  });

  const { data: teams } = await supabase
    .from('teams')
    .select('id, team_name')
    .in('id', Array.from(teamIds));

  if (!teams) return games;

  const teamsMap = new Map(teams.map(t => [t.id, t.team_name]));
  return games.map(game => ({
    ...game,
    home_team_name: teamsMap.get(game.home_team_id),
    away_team_name: teamsMap.get(game.away_team_id),
  }));
}

// User API calls
export const userApi = {
  // Get user by slugger_user_id (for login)
  getUserBySluggerId: async (sluggerUserId: string): Promise<User> => {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('slugger_user_id', sluggerUserId)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('User not found');

    return addTeamNameToUser(data);
  },

  // Get user by ID with all associated data
  getUserWithData: async (userId: number): Promise<UserWithData> => {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw new Error(userError.message);
    if (!user) throw new Error('User not found');

    const userWithTeam = await addTeamNameToUser(user);

    // Get team's inventory (if user has a team)
    let inventory: Inventory[] = [];
    if (user.user_team) {
      const { data: teamInventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('team_id', user.user_team)
        .order('created_at', { ascending: false });

      if (inventoryError) throw new Error(inventoryError.message);
      inventory = teamInventory || [];
    }

    // Get user's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('task')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (tasksError) throw new Error(tasksError.message);

    return {
      ...userWithTeam,
      inventory: inventory || [],
      tasks: tasks || [],
    };
  },
};

// Inventory API calls
export const inventoryApi = {
  // Get inventory for a specific team
  getTeamInventory: async (teamId: number): Promise<Inventory[]> => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get all inventory items
  getAllInventory: async (): Promise<Inventory[]> => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create inventory item for a team
  createInventory: async (teamId: number, data: Omit<Inventory, 'id' | 'created_at' | 'team_id'>): Promise<Inventory> => {
    const { data: result, error } = await supabase
      .from('inventory')
      .insert([{ ...data, team_id: teamId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to create inventory item');
    return result;
  },

  // Update inventory item
  updateInventory: async (id: number, data: Partial<Omit<Inventory, 'id' | 'created_at' | 'team_id'>>): Promise<Inventory> => {
    const { data: result, error } = await supabase
      .from('inventory')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Inventory item not found');
    return result;
  },

  // Delete inventory item
  deleteInventory: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

// Task API calls
export const taskApi = {
  // Get tasks for a specific user
  getUserTasks: async (userId: number): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('task')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create task
  createTask: async (userId: number, data: Omit<Task, 'id' | 'created_at' | 'user_id'>): Promise<Task> => {
    const { data: result, error } = await supabase
      .from('task')
      .insert([{ ...data, user_id: userId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to create task');
    return result;
  },

  // Update task
  updateTask: async (id: number, data: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>>): Promise<Task> => {
    const { data: result, error } = await supabase
      .from('task')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Task not found');
    return result;
  },

  // Toggle task completion
  toggleTask: async (id: number): Promise<Task> => {
    // First get the current task
    const { data: task, error: fetchError } = await supabase
      .from('task')
      .select('task_complete')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    if (!task) throw new Error('Task not found');

    // Toggle the completion status
    const { data: result, error } = await supabase
      .from('task')
      .update({ task_complete: !task.task_complete })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to toggle task');
    return result;
  },

  // Delete task
  deleteTask: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('task')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

// Games API calls
export const gamesApi = {
  // Get all games
  getAllGames: async (): Promise<Game[]> => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw new Error(error.message);
    return addTeamNamesToGames(data || []);
  },

  // Get game by ID
  getGame: async (id: number): Promise<Game> => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Game not found');

    const gamesWithTeams = await addTeamNamesToGames([data]);
    return gamesWithTeams[0];
  },

  // Get games by date
  getGamesByDate: async (date: string): Promise<Game[]> => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) throw new Error(error.message);
    return addTeamNamesToGames(data || []);
  },

  // Get games by team ID
  getGamesByTeam: async (teamId: number): Promise<Game[]> => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw new Error(error.message);
    return addTeamNamesToGames(data || []);
  },

  // Create game
  createGame: async (data: Omit<Game, 'id' | 'created_at'>): Promise<Game> => {
    const { data: result, error } = await supabase
      .from('games')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to create game');

    const gamesWithTeams = await addTeamNamesToGames([result]);
    return gamesWithTeams[0];
  },

  // Update game
  updateGame: async (id: number, data: Partial<Omit<Game, 'id' | 'created_at'>>): Promise<Game> => {
    const { data: result, error } = await supabase
      .from('games')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Game not found');

    const gamesWithTeams = await addTeamNamesToGames([result]);
    return gamesWithTeams[0];
  },

  // Delete game
  deleteGame: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

// Teams API calls
export const teamsApi = {
  // Get all teams
  getAllTeams: async (): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('team_name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get team by ID
  getTeam: async (id: number): Promise<Team> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Team not found');
    return data;
  },

  // Create team
  createTeam: async (data: Omit<Team, 'id' | 'created_at'>): Promise<Team> => {
    const { data: result, error } = await supabase
      .from('teams')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to create team');
    return result;
  },

  // Update team
  updateTeam: async (id: number, data: Partial<Omit<Team, 'id' | 'created_at'>>): Promise<Team> => {
    const { data: result, error } = await supabase
      .from('teams')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Team not found');
    return result;
  },

  // Delete team
  deleteTeam: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

// Meals API calls
export const mealsApi = {
  // Get meal by game ID
  getMealByGameId: async (gameId: number): Promise<Meal | null> => {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('game_id', gameId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  // Get meals for multiple games
  getMealsByGameIds: async (gameIds: number[]): Promise<Meal[]> => {
    if (gameIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .in('game_id', gameIds);

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create or update meal for a game
  upsertMeal: async (gameId: number, data: { pre_game_snack?: string | null; post_game_meal?: string | null }): Promise<Meal> => {
    // First check if meal exists
    const existing = await mealsApi.getMealByGameId(gameId);
    
    if (existing) {
      // Update existing meal
      const { data: result, error } = await supabase
        .from('meals')
        .update(data)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!result) throw new Error('Failed to update meal');
      return result;
    } else {
      // Create new meal
      const { data: result, error } = await supabase
        .from('meals')
        .insert([{ game_id: gameId, ...data }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!result) throw new Error('Failed to create meal');
      return result;
    }
  },

  // Delete meal
  deleteMeal: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};
