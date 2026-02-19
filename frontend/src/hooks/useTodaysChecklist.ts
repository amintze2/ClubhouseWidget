// Derives all computed values needed by ClubhouseChecklist from raw props.
// Extracted from ClubhouseChecklist.tsx to reduce component complexity.
import type { Task, GameSeries, RecurringTask } from '../types/index';
import { convertTimeTo24Hour } from '../utils/timeFormat';

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function useTodaysChecklist({
  tasks,
  recurringTasks,
  recurringTaskCompletions,
  gameSeries,
  userTeam,
}: {
  tasks: Task[];
  recurringTasks: RecurringTask[];
  recurringTaskCompletions: Record<string, Record<string, boolean>>;
  gameSeries: GameSeries[] | undefined;
  userTeam: string | undefined;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const hasGameToday = gameSeries?.some(series => {
    if (!userTeam || series.homeTeam !== userTeam) return false;
    return series.games.some(game => {
      const gameDate = new Date(game.date);
      gameDate.setHours(0, 0, 0, 0);
      return gameDate.getTime() === today.getTime();
    });
  }) ?? false;

  const gameTime = (() => {
    if (!gameSeries || !userTeam) return null;
    for (const series of gameSeries) {
      if (series.homeTeam === userTeam) {
        for (const game of series.games) {
          const gameDate = new Date(game.date);
          gameDate.setHours(0, 0, 0, 0);
          if (gameDate.getTime() === today.getTime()) return game.time;
        }
      }
    }
    return null;
  })();

  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    if (taskDate.getTime() !== today.getTime()) return false;
    if (task.taskType === 1) return hasGameToday;
    if (task.taskType === 2) return !hasGameToday;
    return true;
  });

  const todaysRecurringTasks: Task[] = recurringTasks
    .filter(rt => {
      if (!rt.enabled) return false;
      if (hasGameToday) return rt.taskType === 'game-day';
      return rt.taskType === 'off-day';
    })
    .map(rt => ({
      id: `recurring-${rt.id}-${todayStr}`,
      title: rt.title,
      description: rt.description,
      date: today,
      time: convertTimeTo24Hour(rt.time),
      category: rt.category,
      completed: recurringTaskCompletions[todayStr]?.[rt.id] || false,
      assignedTo: '',
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  const allTodaysTasks = [...todaysTasks, ...todaysRecurringTasks]
    .sort((a, b) => a.time.localeCompare(b.time));

  const gameTimeMinutes = gameTime ? timeToMinutes(gameTime) : 19 * 60;

  const getTasksByTimePeriod = (period: 'morning' | 'pregame' | 'postgame'): Task[] => {
    if (!hasGameToday) return [];
    return allTodaysTasks.filter(task => {
      const mins = timeToMinutes(task.time);
      if (period === 'morning') return mins < 12 * 60;
      if (period === 'pregame') return mins >= 12 * 60 && mins < gameTimeMinutes;
      return mins >= gameTimeMinutes;
    }).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  };

  return {
    today,
    todayStr,
    hasGameToday,
    gameTime,
    todaysTasks,
    todaysRecurringTasks,
    allTodaysTasks,
    morningTasks: getTasksByTimePeriod('morning'),
    pregameTasks: getTasksByTimePeriod('pregame'),
    postgameTasks: getTasksByTimePeriod('postgame'),
  };
}
