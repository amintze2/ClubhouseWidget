import { supabase } from '../../utils/supabase/client';

export interface Team {
  id: number;
  team_name: string;
  created_at: string;
}

export const teamsApi = {
  getAllTeams: async (): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('team_name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

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

  deleteTeam: async (id: number): Promise<void> => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
