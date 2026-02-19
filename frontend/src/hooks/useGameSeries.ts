import { useState, useEffect } from 'react';
import { gamesApi, teamsApi } from '../services/api';
import type { Game } from '../services/api';
import type { GameSeries } from '../types/index';

function groupGamesIntoSeries(games: Game[]): GameSeries[] {
  const seriesMap = new Map<string, GameSeries>();

  games.forEach((game) => {
    const key = `${game.home_team_id}-${game.away_team_id}`;
    const reverseKey = `${game.away_team_id}-${game.home_team_id}`;

    let existingSeries = seriesMap.get(key) ?? seriesMap.get(reverseKey);
    const activeKey = seriesMap.has(key) ? key : reverseKey;

    const gameDate = game.date ? new Date(game.date) : new Date();

    if (existingSeries) {
      existingSeries.games.push({
        id: game.id.toString(),
        date: gameDate,
        gameNumber: existingSeries.games.length + 1,
      });
    } else {
      seriesMap.set(key, {
        id: `series-${game.id}`,
        homeTeam: game.home_team_name || `Team ${game.home_team_id}`,
        visitingTeam: game.away_team_name || `Team ${game.away_team_id}`,
        games: [{ id: game.id.toString(), date: gameDate, gameNumber: 1 }],
      });
    }

    void activeKey; // suppress unused variable warning
  });

  return Array.from(seriesMap.values()).sort((a, b) => {
    const aDate = a.games[0]?.date ?? new Date(0);
    const bDate = b.games[0]?.date ?? new Date(0);
    return aDate.getTime() - bDate.getTime();
  });
}

export function useGameSeries(teamId: number | null | undefined) {
  const [gameSeries, setGameSeries] = useState<GameSeries[]>([]);

  useEffect(() => {
    if (!teamId) return;
    gamesApi.getGamesByTeam(teamId)
      .then(games => setGameSeries(groupGamesIntoSeries(games)))
      .catch(() => {});
  }, [teamId]);

  const handleAddGameSeries = async (series: Omit<GameSeries, 'id'>) => {
    if (!teamId) return;
    try {
      const teams = await teamsApi.getAllTeams();
      const homeTeam = teams.find(t => t.team_name === series.homeTeam);
      const awayTeam = teams.find(t => t.team_name === series.visitingTeam);
      if (!homeTeam || !awayTeam) return;

      for (const game of series.games) {
        await gamesApi.createGame({
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          date: game.date.toISOString().split('T')[0],
          time: (game as any).time ?? null,
        });
      }

      // Refetch to reflect new games
      const updated = await gamesApi.getGamesByTeam(teamId);
      setGameSeries(groupGamesIntoSeries(updated));
    } catch {}
  };

  const handleDeleteGameSeries = async (seriesId: string) => {
    try {
      const series = gameSeries.find(s => s.id === seriesId);
      if (!series) return;
      for (const game of series.games) {
        await gamesApi.deleteGame(parseInt(game.id));
      }
      setGameSeries(prev => prev.filter(s => s.id !== seriesId));
    } catch {}
  };

  return { gameSeries, setGameSeries, handleAddGameSeries, handleDeleteGameSeries };
}
