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
    return taskDate.getTime() === today.getTime();
  });

  // Helper function to convert time string to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Group tasks by time period
  const getTasksByTimePeriod = (period: TimePeriod): Task[] => {
    if (!hasGameToday) return [];
    
    const gameTimeMinutes = gameTime ? timeToMinutes(gameTime) : 19 * 60; // Default to 7 PM if no game time
    
    return todaysTasks.filter(task => {
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
    const progress = calculateProgress(nonGameDayTasks, nonGameDayTaskCompletions);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Clubhouse Tasks</CardTitle>
              <CardDescription>Standard tasks for off days</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-4">
              {nonGameDayTasks.filter(t => nonGameDayTaskCompletions[t.id]).length} / {nonGameDayTasks.length}
            </Badge>
          </div>
          {nonGameDayTasks.length > 0 && (
            <div className="pt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% Complete</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nonGameDayTasks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No non-game day tasks defined. Contact your General Manager.</p>
              </div>
            ) : (
              nonGameDayTasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border">
                  <Checkbox
                    id={`nongame-${task.id}`}
                    checked={nonGameDayTaskCompletions[task.id] || false}
                    onCheckedChange={() => onToggleNonGameDayTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`nongame-${task.id}`}
                      className={`block cursor-pointer ${nonGameDayTaskCompletions[task.id] ? 'line-through text-gray-400' : ''}`}
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
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                    </label>
                  </div>
                </div>
              ))
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const templateTasks = gameDayTasks.filter(t => t.timePeriod === timePeriod);
    const completions = gameDayTaskCompletions[todayStr] || {};
    const progress = calculateProgress(templateTasks, completions);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-4">
              {templateTasks.filter(t => completions[t.id]).length} / {templateTasks.length}
            </Badge>
          </div>
          <div className="pt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% Complete</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templateTasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors border ${bgColor} ${borderColor}`}
              >
                <Checkbox
                  id={`gameday-task-${task.id}`}
                  checked={completions[task.id] || false}
                  onCheckedChange={() => onToggleGameDayTask(todayStr, task.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`gameday-task-${task.id}`}
                    className={`block cursor-pointer ${completions[task.id] ? 'line-through text-gray-400' : ''}`}
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
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate overall progress for accordion
  const todayStr = today.toISOString().split('T')[0];
  
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
        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="morning" className="border rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold">Morning / Pre-Arrival Tasks</h3>
                  <p className="text-sm text-gray-500">
                    {morningTemplateTasks.filter(t => todayGameDayCompletions[t.id]).length} of {morningTemplateTasks.length} completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4">
                  {Math.round(morningProgress)}%
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <Progress value={morningProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(morningProgress)}% Complete</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pregame" className="border rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold">Pre-Game Tasks</h3>
                  <p className="text-sm text-gray-500">
                    {pregameTemplateTasks.filter(t => todayGameDayCompletions[t.id]).length} of {pregameTemplateTasks.length} completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4">
                  {Math.round(pregameProgress)}%
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <Progress value={pregameProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(pregameProgress)}% Complete</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="postgame" className="border rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold">Post-Game / End of Day Tasks</h3>
                  <p className="text-sm text-gray-500">
                    {postgameTemplateTasks.filter(t => todayGameDayCompletions[t.id]).length} of {postgameTemplateTasks.length} completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4">
                  {Math.round(postgameProgress)}%
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <Progress value={postgameProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(postgameProgress)}% Complete</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="nongameday" className="border rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold">Daily Clubhouse Tasks</h3>
                  <p className="text-sm text-gray-500">
                    {nonGameDayTasks.filter(t => nonGameDayTaskCompletions[t.id]).length} of {nonGameDayTasks.length} completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4">
                  {Math.round(nonGameDayProgress)}%
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <Progress value={nonGameDayProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(nonGameDayProgress)}% Complete</p>
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
