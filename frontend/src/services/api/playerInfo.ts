import { supabase } from '../../utils/supabase/client';

export interface PlayerPreference {
  player_id: number;
  preferred_name: string | null;
  other_details: string | null;
  updated_at: string;
}

export interface PlayerRestriction {
  player_id: number;
  restriction: string;
  is_custom: boolean;
  created_at: string;
}

export interface PlayerInfoRecord {
  preferences: PlayerPreference | null;
  restrictions: PlayerRestriction[];
}

export interface UpsertPlayerPreferenceInput {
  preferred_name: string | null;
  other_details: string | null;
}

export interface ReplacePlayerRestrictionsInput {
  restriction: string;
  is_custom: boolean;
}

export const playerInfoApi = {
  getPlayerInfo: async (playerId: number): Promise<PlayerInfoRecord> => {
    const [{ data: preferences, error: preferencesError }, { data: restrictions, error: restrictionsError }] =
      await Promise.all([
        supabase
          .from('player_preferences')
          .select('*')
          .eq('player_id', playerId)
          .maybeSingle(),
        supabase
          .from('player_restrictions')
          .select('*')
          .eq('player_id', playerId)
          .order('created_at', { ascending: true }),
      ]);

    if (preferencesError) throw new Error(preferencesError.message);
    if (restrictionsError) throw new Error(restrictionsError.message);

    return {
      preferences,
      restrictions: restrictions || [],
    };
  },

  upsertPlayerPreferences: async (
    playerId: number,
    input: UpsertPlayerPreferenceInput
  ): Promise<PlayerPreference> => {
    const { data, error } = await supabase
      .from('player_preferences')
      .upsert(
        {
          player_id: playerId,
          preferred_name: input.preferred_name,
          other_details: input.other_details,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to save player preferences');
    return data;
  },

  replacePlayerRestrictions: async (
    playerId: number,
    restrictions: ReplacePlayerRestrictionsInput[]
  ): Promise<PlayerRestriction[]> => {
    const { error: deleteError } = await supabase
      .from('player_restrictions')
      .delete()
      .eq('player_id', playerId);

    if (deleteError) throw new Error(deleteError.message);

    if (restrictions.length === 0) return [];

    const { data, error } = await supabase
      .from('player_restrictions')
      .insert(
        restrictions.map((restriction) => ({
          player_id: playerId,
          restriction: restriction.restriction,
          is_custom: restriction.is_custom,
        }))
      )
      .select()
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },
};
