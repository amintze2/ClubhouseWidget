import { supabase } from '../../utils/supabase/client';

export interface Meal {
  id: number;
  game_id: number;
  pre_game_snack: string | null;
  post_game_meal: string | null;
  created_at: string;
}

export const mealsApi = {
  getMealByGameId: async (gameId: number): Promise<Meal | null> => {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('game_id', gameId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  getMealsByGameIds: async (gameIds: number[]): Promise<Meal[]> => {
    if (gameIds.length === 0) return [];

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .in('game_id', gameIds);

    if (error) throw new Error(error.message);
    return data || [];
  },

  upsertMeal: async (gameId: number, data: { pre_game_snack?: string | null; post_game_meal?: string | null }): Promise<Meal> => {
    const existing = await mealsApi.getMealByGameId(gameId);

    if (existing) {
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

  deleteMeal: async (id: number): Promise<void> => {
    const { error } = await supabase.from('meals').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
