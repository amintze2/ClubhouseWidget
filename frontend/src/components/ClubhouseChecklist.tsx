// Daily checklist view for clubhouse staff.
// - Shows all of today's tasks for the current user, including recurring and template tasks.
// - Applies game-day vs off-day logic using taskType to decide when tasks should appear.
// - Provides UI to add, complete, and delete tasks from the checklist.
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TimeSelect } from './TimeSelect';
import { Plus, Clock, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { formatTime12Hour } from '../utils/timeFormat';
import { Task } from '../App';
import { GameSeries } from './GameSchedule';
import { TemplateTask } from './TaskTemplates';
import { HomeGamesWidget } from './HomeGamesWidget';
import { RecurringTask } from './RecurringTasks';

interface ClubhouseChecklistProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  gameSeries?: GameSeries[];
  userTeam?: string;
  nonGameDayTasks: TemplateTask[];
  nonGameDayTaskCompletions: Record<string, boolean>;
  onToggleNonGameDayTask: (taskId: string) => void;
  gameDayTasks: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }>;
  gameDayTaskCompletions: Record<string, Record<string, boolean>>;
  onToggleGameDayTask: (date: string, taskId: string) => void;
  recurringTasks?: RecurringTask[];
  recurringTaskCompletions?: Record<string, Record<string, boolean>>;
  onToggleRecurringTask?: (date: string, taskId: string) => void;
}

type TimePeriod = 'morning' | 'pregame' | 'postgame';

export function ClubhouseChecklist({ 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask, 
  gameSeries, 
  userTeam,
  nonGameDayTasks,
  nonGameDayTaskCompletions,
  onToggleNonGameDayTask,
  gameDayTasks,
  gameDayTaskCompletions,
  onToggleGameDayTask,
  recurringTasks = [],
  recurringTaskCompletions = {},
  onToggleRecurringTask,
}: ClubhouseChecklistProps) {
  const [openDialog, setOpenDialog] = useState<TimePeriod | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    category: 'sanitation' as 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration',
  });

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's a game today for the user's team
  const hasGameToday = gameSeries?.some(series => {
    if (!userTeam) return false;
    const isHomeGame = series.homeTeam === userTeam;
    if (!isHomeGame) return false;
    
    return series.games.some(game => {
      const gameDate = new Date(game.date);
      gameDate.setHours(0, 0, 0, 0);
      return gameDate.getTime() === today.getTime();
    });
  });

  // Get today's game time if there is one
  const getTodaysGameTime = (): string | null => {
    if (!gameSeries || !userTeam) return null;
    
    for (const series of gameSeries) {
      if (series.homeTeam === userTeam) {
        for (const game of series.games) {
          const gameDate = new Date(game.date);
          gameDate.setHours(0, 0, 0, 0);
          if (gameDate.getTime() === today.getTime()) {
            return game.time;
          }
        }
      }
    }
    return null;
  };

  const gameTime = getTodaysGameTime();

  // Filter today's tasks
  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    const isToday = taskDate.getTime() === today.getTime();
    
    if (!isToday) return false;
    
    // Filter by task_type:
    // task_type = 1: only show on game days
    // task_type = 2: only show on off days
    // task_type = null/undefined: show on all days (backward compatibility)
    if (task.taskType === 1) {
      return hasGameToday;
    }
    if (task.taskType === 2) {
      return !hasGameToday;
    }
    
    // task_type is null or undefined - show on all days
    return true;
  });

  // Get recurring tasks for today
  const getRecurringTasksForToday = (): Task[] => {
    const todayStr = today.toISOString().split('T')[0];
    
    // Filter for enabled recurring tasks based on day type
    const relevantRecurringTasks = recurringTasks.filter(task => {
      if (!task.enabled) return false;
      if (hasGameToday && task.taskType === 'game-day') return true;
      if (!hasGameToday && task.taskType === 'off-day') return true;
      return false;
    });
    
    // Convert recurring tasks to Task format for display
    return relevantRecurringTasks.map(recurringTask => {
      // Convert 12-hour time to 24-hour format for sorting
      const [time, period] = recurringTask.time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hours24 = hours;
      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        hours24 = hours + 12;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        hours24 = 0;
      }
      const time24 = `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      return {
        id: `recurring-${recurringTask.id}-${todayStr}`,
        title: recurringTask.title,
        description: recurringTask.description,
        date: today,
        time: time24,
        category: recurringTask.category,
        completed: recurringTaskCompletions[todayStr]?.[recurringTask.id] || false,
        assignedTo: '',
      };
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const todaysRecurringTasks = getRecurringTasksForToday();
  const todayStr = today.toISOString().split('T')[0];
  
  // Combine regular tasks and recurring tasks for today
  const allTodaysTasks = [...todaysTasks, ...todaysRecurringTasks].sort((a, b) => a.time.localeCompare(b.time));

  // Helper function to convert time string to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Group tasks by time period
  const getTasksByTimePeriod = (period: TimePeriod): Task[] => {
    if (!hasGameToday) return [];
    
    const gameTimeMinutes = gameTime ? timeToMinutes(gameTime) : 19 * 60; // Default to 7 PM if no game time
    
    return allTodaysTasks.filter(task => {
      const taskMinutes = timeToMinutes(task.time);
      
      switch (period) {
        case 'morning': // Morning / Pre-Arrival (midnight to noon)
          return taskMinutes < 12 * 60;
        case 'pregame': // Pre-Game (noon to game time)
          return taskMinutes >= 12 * 60 && taskMinutes < gameTimeMinutes;
        case 'postgame': // Post-Game / End of Day (game time to midnight)
          return taskMinutes >= gameTimeMinutes;
        default:
          return false;
      }
    }).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  };

  const morningTasks = hasGameToday ? getTasksByTimePeriod('morning') : [];
  const pregameTasks = hasGameToday ? getTasksByTimePeriod('pregame') : [];
  const postgameTasks = hasGameToday ? getTasksByTimePeriod('postgame') : [];

  const addTask = (period: TimePeriod) => {
    if (!newTask.title.trim()) return;

    onAddTask({
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      date: new Date(newTask.date),
      time: newTask.time,
      category: newTask.category,
      completed: false,
      assignedTo: '',
    });

    setNewTask({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      category: 'sanitation',
    });
    setOpenDialog(null);
  };

  const calculateProgress = (items: Task[] | TemplateTask[], completions?: Record<string, boolean>) => {
    if (items.length === 0) return 0;
    
    if (completions) {
      // For template tasks
      const completed = items.filter(item => completions[item.id]).length;
      return (completed / items.length) * 100;
    } else {
      // For regular tasks
      const completed = (items as Task[]).filter(item => item.completed).length;
      return (completed / items.length) * 100;
    }
  };

  const getCategoryBadgeColor = (category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration') => {
    switch (category) {
      case 'sanitation':
        return 'bg-blue-100 text-blue-800';
      case 'laundry':
        return 'bg-purple-100 text-purple-800';
      case 'food':
        return 'bg-orange-100 text-orange-800';
      case 'communication':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800';
      case 'administration':
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getCategoryLabel = (category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration') => {
    switch (category) {
      case 'sanitation':
        return '🧼 Sanitation & Facilities';
      case 'laundry':
        return '🧺 Laundry & Uniforms';
      case 'food':
        return '🍽️ Food & Nutrition';
      case 'communication':
        return '💬 Communication & Coordination';
      case 'maintenance':
        return '🧰 Maintenance & Supplies';
      case 'administration':
        return '💵 Administration & Compliance';
    }
  };

  // Render non-game day tasks
  const renderNonGameDayTasks = () => {
    const allNonGameDayTasks = [...nonGameDayTasks];
    const allCompletions = { ...nonGameDayTaskCompletions };
    
    // Add recurring tasks for off-days
    const offDayRecurringTasks = todaysRecurringTasks.filter(rt => {
      // Extract recurring task ID from format "recurring-{id}-{date}"
      const parts = rt.id.split('-');
      if (parts.length < 3) return false;
      const recurringTaskId = parts.slice(1, -1).join('-'); // Handle IDs that might contain dashes
      const recurringTask = recurringTasks.find(r => r.id === recurringTaskId);
      return recurringTask?.taskType === 'off-day';
    });
    
    // Calculate total progress including all tasks (template, recurring, and regular scheduled)
    const totalTasks = allNonGameDayTasks.length + offDayRecurringTasks.length + todaysTasks.length;
    const completedTemplateTasks = allNonGameDayTasks.filter(t => allCompletions[t.id]).length;
    const completedRecurringTasks = offDayRecurringTasks.filter(rt => {
      const parts = rt.id.split('-');
      const recurringTaskId = parts.length >= 3 ? parts.slice(1, -1).join('-') : parts[1];
      return recurringTaskCompletions[todayStr]?.[recurringTaskId] || false;
    }).length;
    const completedRegularTasks = todaysTasks.filter(t => t.completed).length;
    const completedTasks = completedTemplateTasks + completedRecurringTasks + completedRegularTasks;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Daily Clubhouse Tasks</CardTitle>
              <CardDescription className="text-base text-slate-600">Standard tasks for off days</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-4 bg-[#1F3A5F] text-white text-sm px-3 py-1">
              {completedTasks} / {totalTasks}
            </Badge>
          </div>
          {totalTasks > 0 && (
            <div className="pt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-base text-slate-600 mt-2">{Math.round(progress)}% Complete</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {totalTasks === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <p className="text-base">No tasks for today.</p>
              </div>
            ) : (
              <>
                {/* Combine all tasks and sort by time */}
                {[
                  // Template tasks (no time, show first)
                  ...nonGameDayTasks.map(task => ({ ...task, type: 'template' as const, displayTime: '00:00' })),
                  // Recurring tasks with time
                  ...offDayRecurringTasks.map(task => ({ ...task, type: 'recurring' as const, displayTime: task.time })),
                  // Regular scheduled tasks with time
                  ...todaysTasks.map(task => ({ ...task, type: 'regular' as const, displayTime: task.time }))
                ]
                  .sort((a, b) => {
                    // Template tasks first (no time), then sort by time
                    if (a.type === 'template' && b.type !== 'template') return -1;
                    if (a.type !== 'template' && b.type === 'template') return 1;
                    if (a.type === 'template' && b.type === 'template') return 0;
                    return a.displayTime.localeCompare(b.displayTime);
                  })
                  .map((item) => {
                    if (item.type === 'template') {
                      const task = item as typeof item & { id: string; title: string; description?: string; category: Task['category'] };
                      return (
                        <div key={task.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 bg-white">
                          <Checkbox
                            id={`nongame-${task.id}`}
                            checked={nonGameDayTaskCompletions[task.id] || false}
                            onCheckedChange={() => onToggleNonGameDayTask(task.id)}
                            className="mt-1 h-5 w-5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`nongame-${task.id}`}
                              className={`block cursor-pointer text-base ${nonGameDayTaskCompletions[task.id] ? 'line-through text-slate-400' : ''}`}
                            >
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span>{task.title}</span>
                                <Badge className={getCategoryBadgeColor(task.category)}>
                                  {getCategoryLabel(task.category)}
                                </Badge>
                                {nonGameDayTaskCompletions[task.id] && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-base text-slate-600">{task.description}</p>
                              )}
                            </label>
                          </div>
                        </div>
                      );
                    } else if (item.type === 'recurring') {
                      const task = item as Task;
                      const parts = task.id.split('-');
                      const recurringTaskId = parts.length >= 3 ? parts.slice(1, -1).join('-') : parts[1];
                      const isCompleted = recurringTaskCompletions[todayStr]?.[recurringTaskId] || false;
                      
                      return (
                        <div key={task.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border bg-blue-50 border-blue-200">
                          <Checkbox
                            id={`recurring-${task.id}`}
                            checked={isCompleted}
                            onCheckedChange={() => {
                              if (onToggleRecurringTask) {
                                onToggleRecurringTask(todayStr, recurringTaskId);
                              }
                            }}
                            className="mt-1 h-5 w-5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`recurring-${task.id}`}
                              className={`block cursor-pointer text-base ${isCompleted ? 'line-through text-slate-400' : ''}`}
                            >
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span>{task.title}</span>
                                <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                                  Recurring
                                </Badge>
                                <Badge className={getCategoryBadgeColor(task.category)}>
                                  {getCategoryLabel(task.category)}
                                </Badge>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime12Hour(task.time)}
                                </Badge>
                                {isCompleted && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-base text-slate-600">{task.description}</p>
                              )}
                            </label>
                          </div>
                        </div>
                      );
                    } else {
                      const task = item as Task;
                      return (
                        <div key={task.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 bg-white">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={() => onToggleTask(task.id)}
                            className="mt-1 h-5 w-5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`task-${task.id}`}
                              className={`block cursor-pointer text-base ${task.completed ? 'line-through text-slate-400' : ''}`}
                            >
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span>{task.title}</span>
                                <Badge className={getCategoryBadgeColor(task.category)}>
                                  {getCategoryLabel(task.category)}
                                </Badge>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime12Hour(task.time)}
                                </Badge>
                                {task.completed && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-base text-slate-600">{task.description}</p>
                              )}
                            </label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      );
                    }
                  })}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGameDayTaskList = (
    timePeriod: 'morning' | 'pre-game' | 'post-game',
    title: string,
    description: string,
    bgColor: string,
    borderColor: string
  ) => {
    const templateTasks = gameDayTasks.filter(t => t.timePeriod === timePeriod);
    const completions = gameDayTaskCompletions[todayStr] || {};
    
    // Get recurring tasks and regular tasks for this time period
    let periodTasks: Task[] = [];
    if (timePeriod === 'morning') {
      periodTasks = morningTasks;
    } else if (timePeriod === 'pre-game') {
      periodTasks = pregameTasks;
    } else if (timePeriod === 'post-game') {
      periodTasks = postgameTasks;
    }
    
    // Calculate total progress including all tasks
    const totalTasks = templateTasks.length + periodTasks.length;
    const completedTemplateTasks = templateTasks.filter(t => completions[t.id]).length;
    const completedRegularTasks = periodTasks.filter(t => t.completed).length;
    const progress = totalTasks > 0 ? ((completedTemplateTasks + completedRegularTasks) / totalTasks) * 100 : 0;

    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="text-base text-slate-600">{description}</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-4 bg-[#1F3A5F] text-white text-sm px-3 py-1">
              {completedTemplateTasks + completedRegularTasks} / {totalTasks}
            </Badge>
          </div>
          <div className="pt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-base text-slate-600 mt-2">{Math.round(progress)}% Complete</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Template tasks */}
            {templateTasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-start space-x-4 p-4 rounded-lg transition-colors border ${bgColor} ${borderColor}`}
              >
                <Checkbox
                  id={`gameday-task-${task.id}`}
                  checked={completions[task.id] || false}
                  onCheckedChange={() => onToggleGameDayTask(todayStr, task.id)}
                  className="mt-1 h-5 w-5"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`gameday-task-${task.id}`}
                    className={`block cursor-pointer text-base ${completions[task.id] ? 'line-through text-slate-400' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span>{task.title}</span>
                      <Badge className={getCategoryBadgeColor(task.category)}>
                        {getCategoryLabel(task.category)}
                      </Badge>
                      {completions[task.id] && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-base text-slate-600">{task.description}</p>
                    )}
                  </label>
                </div>
              </div>
            ))}
            
            {/* Recurring and regular tasks for this time period */}
            {periodTasks.map((task) => {
              const isRecurring = task.id.startsWith('recurring-');
              // Extract recurring task ID from format "recurring-{id}-{date}"
              let recurringTaskId: string | null = null;
              if (isRecurring) {
                const parts = task.id.split('-');
                recurringTaskId = parts.length >= 3 ? parts.slice(1, -1).join('-') : parts[1];
              }
              const isCompleted = isRecurring 
                ? (recurringTaskCompletions[todayStr]?.[recurringTaskId || ''] || false)
                : task.completed;
              
              return (
                <div 
                  key={task.id} 
                  className={`flex items-start space-x-4 p-4 rounded-lg transition-colors border ${
                    isRecurring ? 'bg-blue-50 border-blue-200' : bgColor
                  }`}
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={isCompleted}
                    onCheckedChange={() => {
                      if (isRecurring && onToggleRecurringTask && recurringTaskId) {
                        onToggleRecurringTask(todayStr, recurringTaskId);
                      } else {
                        onToggleTask(task.id);
                      }
                    }}
                    className="mt-1 h-5 w-5"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`block cursor-pointer text-base ${isCompleted ? 'line-through text-slate-400' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span>{task.title}</span>
                        {isRecurring && (
                          <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                            Recurring
                          </Badge>
                        )}
                        <Badge className={getCategoryBadgeColor(task.category)}>
                          {getCategoryLabel(task.category)}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime12Hour(task.time)}
                        </Badge>
                        {isCompleted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-base text-slate-600">{task.description}</p>
                      )}
                    </label>
                  </div>
                  {!isRecurring && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate overall progress for accordion
  const todayGameDayCompletions = gameDayTaskCompletions[todayStr] || {};
  const morningTemplateTasks = gameDayTasks.filter(t => t.timePeriod === 'morning');
  const pregameTemplateTasks = gameDayTasks.filter(t => t.timePeriod === 'pre-game');
  const postgameTemplateTasks = gameDayTasks.filter(t => t.timePeriod === 'post-game');
  
  const morningProgress = calculateProgress(morningTemplateTasks, todayGameDayCompletions);
  const pregameProgress = calculateProgress(pregameTemplateTasks, todayGameDayCompletions);
  const postgameProgress = calculateProgress(postgameTemplateTasks, todayGameDayCompletions);
  const nonGameDayProgress = calculateProgress(nonGameDayTasks, nonGameDayTaskCompletions);

  return (
    <div className="space-y-6">
      {gameSeries && userTeam && (
        <HomeGamesWidget gameSeries={gameSeries} teamName={userTeam} />
      )}
      
      {/* Summary Accordion */}
      {hasGameToday ? (
        <Accordion type="single" collapsible className="space-y-3">
          <AccordionItem value="morning" className="border border-slate-200 rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-5 hover:no-underline text-base">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Morning / Pre-Arrival Tasks</h3>
                  <p className="text-base text-slate-600">
                    {morningTemplateTasks.filter(t => todayGameDayCompletions[t.id]).length} of {morningTemplateTasks.length} completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4 bg-[#1F3A5F] text-white text-sm px-3 py-1">
                  {Math.round(morningProgress)}%
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-5">
              <Progress value={morningProgress} className="mb-2" />
              <p className="text-base text-slate-600">{Math.round(morningProgress)}% Complete</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pregame" className="border border-slate-200 rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-5 hover:no-underline text-base">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Pre-Game Tasks</h3>
                  <p className="text-base text-slate-600">
                    {pregameTemplateTasks.filter(t => todayGameDayCompletions[t.id]).length} of {pregameTemplateTasks.length} completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4 bg-[#1F3A5F] text-white text-sm px-3 py-1">
                  {Math.round(pregameProgress)}%
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-5">
              <Progress value={pregameProgress} className="mb-2" />
              <p className="text-base text-slate-600">{Math.round(pregameProgress)}% Complete</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="postgame" className="border border-slate-200 rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-5 hover:no-underline text-base">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Post-Game / End of Day Tasks</h3>
                  <p className="text-base text-slate-600">
                    {postgameTemplateTasks.filter(t => todayGameDayCompletions[t.id]).length} of {postgameTemplateTasks.length} completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4 bg-[#1F3A5F] text-white text-sm px-3 py-1">
                  {Math.round(postgameProgress)}%
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-5">
              <Progress value={postgameProgress} className="mb-2" />
              <p className="text-base text-slate-600">{Math.round(postgameProgress)}% Complete</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          <AccordionItem value="nongameday" className="border border-slate-200 rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-5 hover:no-underline text-base">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Daily Clubhouse Tasks</h3>
                  <p className="text-base text-slate-600">
                    {nonGameDayTasks.filter(t => nonGameDayTaskCompletions[t.id]).length} of {nonGameDayTasks.length} completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4 bg-[#1F3A5F] text-white text-sm px-3 py-1">
                  {Math.round(nonGameDayProgress)}%
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-5">
              <Progress value={nonGameDayProgress} className="mb-2" />
              <p className="text-base text-slate-600">{Math.round(nonGameDayProgress)}% Complete</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Detailed Task Lists */}
      <div className="space-y-6">
        {hasGameToday ? (
          <>
            {renderGameDayTaskList('morning', 'Morning / Pre-Arrival Tasks', 'Tasks to complete before players arrive', 'bg-orange-50', 'border-orange-200')}
            {renderGameDayTaskList('pre-game', 'Pre-Game Tasks', 'Tasks to complete before game time', 'bg-yellow-50', 'border-yellow-200')}
            {renderGameDayTaskList('post-game', 'Post-Game / End of Day Tasks', 'Tasks to complete after the game', 'bg-green-50', 'border-green-200')}
          </>
        ) : (
          renderNonGameDayTasks()
        )}
      </div>
    </div>
  );
}
