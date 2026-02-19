// Provides all date/task/game calculation functions for CalendarView.
// Extracted from CalendarView.tsx to reduce component complexity.
import type { Task, GameSeries, TemplateTask, RecurringTask } from '../types/index';
import { convertTimeTo24Hour } from '../utils/timeFormat';

export function useCalendarData({
  tasks,
  gameSeries,
  userTeam,
  gameDayTasks,
  nonGameDayTasks,
  recurringTasks,
  recurringTaskCompletions,
}: {
  tasks: Task[];
  gameSeries: GameSeries[] | undefined;
  userTeam: string | undefined;
  gameDayTasks: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }>;
  nonGameDayTasks: TemplateTask[];
  recurringTasks: RecurringTask[];
  recurringTaskCompletions: Record<string, Record<string, boolean>>;
}) {
  const isGameDay = (date: Date): boolean => {
    if (!gameSeries || !userTeam) return false;
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const normalizedTime = normalizedDate.getTime();
    return gameSeries.some(series => {
      if (series.homeTeam !== userTeam && series.visitingTeam !== userTeam) return false;
      return series.games.some(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate.getTime() === normalizedTime;
      });
    });
  };

  const getGameType = (date: Date): 'home' | 'away' | 'both' | null => {
    if (!gameSeries || !userTeam) return null;
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const normalizedTime = normalizedDate.getTime();
    let hasHomeGame = false;
    let hasAwayGame = false;
    gameSeries.forEach(series => {
      series.games.forEach(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        if (gameDate.getTime() === normalizedTime) {
          if (series.homeTeam === userTeam) hasHomeGame = true;
          else if (series.visitingTeam === userTeam) hasAwayGame = true;
        }
      });
    });
    if (hasHomeGame && hasAwayGame) return 'both';
    if (hasHomeGame) return 'home';
    if (hasAwayGame) return 'away';
    return null;
  };

  const getGamesForDate = (date: Date | undefined): Array<{ homeTeam: string; visitingTeam: string; time?: string; gameNumber: number }> => {
    if (!date || !gameSeries || !userTeam) return [];
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const normalizedTime = normalizedDate.getTime();
    const games: Array<{ homeTeam: string; visitingTeam: string; time?: string; gameNumber: number }> = [];
    gameSeries.forEach(series => {
      series.games.forEach(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        if (gameDate.getTime() === normalizedTime && (series.homeTeam === userTeam || series.visitingTeam === userTeam)) {
          games.push({ homeTeam: series.homeTeam, visitingTeam: series.visitingTeam, time: game.time, gameNumber: game.gameNumber });
        }
      });
    });
    return games;
  };

  const getTasksForDate = (date: Date | undefined): Task[] => {
    if (!date) return [];
    const isGame = isGameDay(date);
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const normalizedTime = normalizedDate.getTime();
    return tasks.filter(task => {
      if (!(task.date instanceof Date) || isNaN(task.date.getTime())) return false;
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      if (taskDate.getTime() !== normalizedTime) return false;
      if (task.taskType === 1) return isGame;
      if (task.taskType === 2) return !isGame;
      return true;
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getRecurringTasksForDate = (date: Date | undefined): Task[] => {
    if (!date) return [];
    const isGame = isGameDay(date);
    const dateStr = date.toISOString().split('T')[0];
    return recurringTasks
      .filter(task => {
        if (!task.enabled) return false;
        if (isGame && task.taskType === 'game-day') return true;
        if (!isGame && task.taskType === 'off-day') return true;
        return false;
      })
      .map(recurringTask => ({
        id: `recurring-${recurringTask.id}-${dateStr}`,
        title: recurringTask.title,
        description: recurringTask.description,
        date: date,
        time: convertTimeTo24Hour(recurringTask.time),
        category: recurringTask.category,
        completed: recurringTaskCompletions[dateStr]?.[recurringTask.id] || false,
        assignedTo: '',
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getTemplateTasksForDate = (date: Date | undefined) => {
    if (!date) return [];
    return isGameDay(date) ? gameDayTasks : nonGameDayTasks;
  };

  const getTasksPerDay = (): Map<string, number> => {
    const tasksMap = new Map<string, number>();
    tasks.forEach(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      const dateStr = taskDate.toDateString();
      tasksMap.set(dateStr, (tasksMap.get(dateStr) || 0) + 1);
    });
    if (gameSeries && userTeam) {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const checkDate = new Date(d);
        const dateStr = checkDate.toDateString();
        if (isGameDay(checkDate)) {
          tasksMap.set(dateStr, (tasksMap.get(dateStr) || 0) + gameDayTasks.length);
        } else if (nonGameDayTasks.length > 0) {
          tasksMap.set(dateStr, (tasksMap.get(dateStr) || 0) + nonGameDayTasks.length);
        }
      }
    }
    return tasksMap;
  };

  const getGameTypesPerDay = (): Map<string, 'home' | 'away' | 'both'> => {
    const gameTypesMap = new Map<string, 'home' | 'away' | 'both'>();
    if (!gameSeries || !userTeam) return gameTypesMap;
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const checkDate = new Date(d);
      const gameType = getGameType(checkDate);
      if (gameType) gameTypesMap.set(checkDate.toDateString(), gameType);
    }
    return gameTypesMap;
  };

  return {
    isGameDay,
    getGameType,
    getGamesForDate,
    getTasksForDate,
    getRecurringTasksForDate,
    getTemplateTasksForDate,
    getTasksPerDay,
    getGameTypesPerDay,
  };
}
