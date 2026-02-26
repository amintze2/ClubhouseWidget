import { supabase } from '../../utils/supabase/client';
import type { Inventory } from './inventory';
import type { Task } from './tasks';
import type { Team } from './teams';

export interface User {
  id: number;
  created_at: string;
  user_role: string | null;
  user_team: number | null;
  team_name?: string | null;
  slugger_user_id: string | null;
  user_name: string | null;
}

export interface UserWithData extends User {
  inventory: Inventory[];
  tasks: Task[];
}

async function addTeamNameToUser(user: User): Promise<User> {
  if (user.user_team) {
    const { data: team } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', user.user_team)
      .single();

    if (team) return { ...user, team_name: (team as Pick<Team, 'team_name'>).team_name };
  }
  return { ...user, team_name: null };
}

export const userApi = {
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

  getUserWithData: async (userId: number): Promise<UserWithData> => {
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw new Error(userError.message);
    if (!user) throw new Error('User not found');

    const userWithTeam = await addTeamNameToUser(user);

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
