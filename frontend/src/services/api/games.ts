import { supabase } from '../../utils/supabase/client';
import type { Team } from './teams';

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

async function addTeamNamesToGames(games: Game[]): Promise<Game[]> {
  if (games.length === 0) return games;

  const teamIds = new Set<number>();
  games.forEach((game) => {
    teamIds.add(game.home_team_id);
    teamIds.add(game.away_team_id);
  });

  const { data: teams } = await supabase
    .from('teams')
    .select('id, team_name')
    .in('id', Array.from(teamIds));

  if (!teams) return games;

  const teamsMap = new Map((teams as Pick<Team, 'id' | 'team_name'>[]).map((t) => [t.id, t.team_name]));
  return games.map((game) => ({
    ...game,
    home_team_name: teamsMap.get(game.home_team_id),
    away_team_name: teamsMap.get(game.away_team_id),
  }));
}

export const gamesApi = {
  getAllGames: async (): Promise<Game[]> => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw new Error(error.message);
    return addTeamNamesToGames(data || []);
  },

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

  getGamesByDate: async (date: string): Promise<Game[]> => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) throw new Error(error.message);
    return addTeamNamesToGames(data || []);
  },

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

  deleteGame: async (id: number): Promise<void> => {
    const { error } = await supabase.from('games').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
