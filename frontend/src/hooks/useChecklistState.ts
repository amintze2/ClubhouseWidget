// Manages template task and completion-tracking state for the daily checklist.
// Extracted from App.tsx to reduce component state complexity.
// Contains the game-day reset effect that clears completions after the last game passes.
import { useState, useEffect } from 'react';
import type { TemplateTask, GameSeries } from '../types/index';

export function useChecklistState(gameSeries: GameSeries[], userTeam: string | undefined) {
  const [nonGameDayTasks, setNonGameDayTasks] = useState<TemplateTask[]>([]);
  // gameDayTasks is intentionally a static empty array — game-day templates are not yet wired to a data source
  const gameDayTasks: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }> = [];
  const [nonGameDayTaskCompletions, setNonGameDayTaskCompletions] = useState<Record<string, boolean>>({});
  const [gameDayTaskCompletions, setGameDayTaskCompletions] = useState<Record<string, Record<string, boolean>>>({});
  const [recurringTaskCompletions, setRecurringTaskCompletions] = useState<Record<string, Record<string, boolean>>>({});
  const [lastGameDate, setLastGameDate] = useState<string | null>(null);

  // Reset non-game-day task completions when the game day passes
  useEffect(() => {
    if (!userTeam) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const hasGameToday = gameSeries.some(series => {
      if (series.homeTeam !== userTeam) return false;
      return series.games.some(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate.toISOString().split('T')[0] === todayStr;
      });
    });

    if (!hasGameToday && lastGameDate && lastGameDate !== todayStr) {
      const lastGame = new Date(lastGameDate);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastGame <= yesterday) {
        setNonGameDayTaskCompletions({});
        setLastGameDate(null);
      }
    }

    if (hasGameToday) setLastGameDate(todayStr);
  }, [userTeam, gameSeries, lastGameDate]);

  const handleAddNonGameDayTask = (task: Omit<TemplateTask, 'id'>) =>
    setNonGameDayTasks(prev => [...prev, { ...task, id: Date.now().toString() }]);

  const handleDeleteNonGameDayTask = (taskId: string) =>
    setNonGameDayTasks(prev => prev.filter(t => t.id !== taskId));

  const handleToggleNonGameDayTask = (taskId: string) =>
    setNonGameDayTaskCompletions(prev => ({ ...prev, [taskId]: !prev[taskId] }));

  const handleToggleGameDayTask = (date: string, taskId: string) =>
    setGameDayTaskCompletions(prev => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [taskId]: !(prev[date]?.[taskId] || false) },
    }));

  const handleToggleRecurringTask = (date: string, taskId: string) =>
    setRecurringTaskCompletions(prev => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [taskId]: !(prev[date]?.[taskId] || false) },
    }));

  return {
    nonGameDayTasks,
    gameDayTasks,
    nonGameDayTaskCompletions,
    gameDayTaskCompletions,
    recurringTaskCompletions,
    handleAddNonGameDayTask,
    handleDeleteNonGameDayTask,
    handleToggleNonGameDayTask,
    handleToggleGameDayTask,
    handleToggleRecurringTask,
  };
}
