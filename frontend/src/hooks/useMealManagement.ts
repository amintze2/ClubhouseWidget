// Manages meal planning state (player dietary info and per-game meal plans).
// Extracted from App.tsx to reduce component state complexity.
import { useState } from 'react';
import type { PlayerDietaryInfo } from '../types/index';

export function useMealManagement() {
  const [playerDietaryInfo, setPlayerDietaryInfo] = useState<PlayerDietaryInfo[]>([]);
  const [gameMealPlans, setGameMealPlans] = useState<
    { gameId: string; preGameSnack: string; postGameMeal: string }[]
  >([]);

  return { playerDietaryInfo, setPlayerDietaryInfo, gameMealPlans, setGameMealPlans };
}
