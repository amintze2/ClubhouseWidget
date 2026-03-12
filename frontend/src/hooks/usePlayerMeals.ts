import { useCallback, useEffect, useState } from 'react';
import { gamesApi, mealsApi } from '../services/api';
import { supabase } from '../utils/supabase/client';

export interface PlayerMealScheduleItem {
  gameId: number;
  date: string | null;
  time: string | null;
  opponentName: string;
  isHome: boolean;
  preGameSnack: string;
  postGameMeal: string;
}

function toTimestamp(date: string | null, time: string | null) {
  if (!date) return Number.MAX_SAFE_INTEGER;
  if (!time) return new Date(date).getTime();
  return new Date(`${date}T${time}`).getTime();
}

export function usePlayerMeals(teamId: number | null | undefined) {
  const [mealSchedule, setMealSchedule] = useState<PlayerMealScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMealSchedule = useCallback(async () => {
    if (!teamId) {
      setMealSchedule([]);
      setError('No team is assigned to this user.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const games = await gamesApi.getGamesByTeam(teamId);
      const gameIds = games.map((game) => game.id);
      const meals = await mealsApi.getMealsByGameIds(gameIds);
      const mealsByGameId = new Map(meals.map((meal) => [meal.game_id, meal]));

      const schedule = games
        .map<PlayerMealScheduleItem | null>((game) => {
          const isHome = game.home_team_id === teamId;
          const opponentName = isHome
            ? (game.away_team_name ?? `Team ${game.away_team_id}`)
            : (game.home_team_name ?? `Team ${game.home_team_id}`);
          const meal = mealsByGameId.get(game.id);
          const preGameSnack = meal?.pre_game_snack?.trim() ?? '';
          const postGameMeal = meal?.post_game_meal?.trim() ?? '';

          // Only surface games where a meal was actually planned.
          if (!preGameSnack && !postGameMeal) {
            return null;
          }

          return {
            gameId: game.id,
            date: game.date,
            time: game.time,
            opponentName,
            isHome,
            preGameSnack,
            postGameMeal,
          };
        })
        .filter((game): game is PlayerMealScheduleItem => game !== null)
        .sort((a, b) => toTimestamp(a.date, a.time) - toTimestamp(b.date, b.time));

      setMealSchedule(schedule);
    } catch (err) {
      console.error('Failed to load player meal schedule:', err);
      setError('Failed to load meal schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    void loadMealSchedule();
  }, [loadMealSchedule]);

  useEffect(() => {
    if (!teamId) return;

    const refresh = () => {
      void loadMealSchedule();
    };

    const gamesChannel = supabase
      .channel(`player-games-${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, refresh)
      .subscribe();

    const mealsChannel = supabase
      .channel(`player-meals-${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, refresh)
      .subscribe();

    return () => {
      void supabase.removeChannel(gamesChannel);
      void supabase.removeChannel(mealsChannel);
    };
  }, [loadMealSchedule, teamId]);

  return { mealSchedule, loading, error, reload: loadMealSchedule };
}
