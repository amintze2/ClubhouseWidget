import { useState } from 'react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { TimeSelect } from './TimeSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Plus, Clock, User, Tag, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { formatTime12Hour } from '../utils/timeFormat';
import { Task } from '../App';
import { GameSeries } from './GameSchedule';
import { HomeGamesWidget } from './HomeGamesWidget';
import { TemplateTask } from './TaskTemplates';

interface CalendarViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  gameSeries?: GameSeries[];
  userTeam?: string;
  nonGameDayTasks?: TemplateTask[];
  nonGameDayTaskCompletions?: Record<string, boolean>;
  onToggleNonGameDayTask?: (taskId: string) => void;
  gameDayTasks?: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }>;
  gameDayTaskCompletions?: Record<string, Record<string, boolean>>;
  onToggleGameDayTask?: (date: string, taskId: string) => void;
}

export function CalendarView({ 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask, 
  gameSeries, 
  userTeam,
  nonGameDayTasks = [],
  nonGameDayTaskCompletions = {},
  onToggleNonGameDayTask,
  gameDayTasks = [],
  gameDayTaskCompletions = {},
  onToggleGameDayTask,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    time: '09:00',
    category: 'maintenance' as Task['category'],
  });

  const handleAddTask = () => {
    if (newTask.title && newTask.time && selectedDate) {
      onAddTask({
        title: newTask.title,
        description: newTask.description,
        date: selectedDate,
        time: newTask.time,
        category: newTask.category,
        completed: false,
        assignedTo: '',
      });
      setNewTask({
        title: '',
        description: '',
        time: '09:00',
        category: 'maintenance',
      });
      setIsDialogOpen(false);
    }
  };

  const isGameDay = (date: Date) => {
    if (!gameSeries || !userTeam) return false;
    
    const dateStr = date.toDateString();
    return gameSeries.some(series => {
      if (series.homeTeam !== userTeam && series.visitingTeam !== userTeam) return false;
      return series.games.some(game => {
        const gameDate = new Date(game.date);
        return gameDate.toDateString() === dateStr;
      });
    });
  };

  const getGameType = (date: Date): 'home' | 'away' | 'both' | null => {
    if (!gameSeries || !userTeam) return null;
    
    const dateStr = date.toDateString();
    let hasHomeGame = false;
    let hasAwayGame = false;
    
    gameSeries.forEach(series => {
      series.games.forEach(game => {
        const gameDate = new Date(game.date);
        if (gameDate.toDateString() === dateStr) {
          if (series.homeTeam === userTeam) {
            hasHomeGame = true;
          } else if (series.visitingTeam === userTeam) {
            hasAwayGame = true;
          }
        }
      });
    });
    
    if (hasHomeGame && hasAwayGame) return 'both';
    if (hasHomeGame) return 'home';
    if (hasAwayGame) return 'away';
    return null;
  };

  const getTasksForDate = (date: Date | undefined) => {
    if (!date) return [];
    return tasks.filter(task => 
      task.date.toDateString() === date.toDateString()
    ).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getTemplateTasksForDate = (date: Date | undefined) => {
    if (!date) return [];
    
    if (isGameDay(date)) {
      // Return game day template tasks for game days
      return gameDayTasks;
    } else {
      // Return non-game day template tasks for non-game days
      return nonGameDayTasks;
    }
  };

  const getCategoryColor = (category: Task['category']) => {
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: Task['category']) => {
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
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const getTasksPerDay = () => {
    const tasksMap = new Map<string, number>();
    tasks.forEach(task => {
      const dateStr = task.date.toDateString();
      tasksMap.set(dateStr, (tasksMap.get(dateStr) || 0) + 1);
    });
    
    // Add template tasks to the count
    if (gameSeries && userTeam) {
      // Get a range of dates to check (e.g., current month +/- 1 month)
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const checkDate = new Date(d);
        const dateStr = checkDate.toDateString();
        
        if (isGameDay(checkDate)) {
          // Add game day template tasks
          tasksMap.set(dateStr, (tasksMap.get(dateStr) || 0) + gameDayTasks.length);
        } else if (nonGameDayTasks.length > 0) {
          // Add non-game day template tasks
          tasksMap.set(dateStr, (tasksMap.get(dateStr) || 0) + nonGameDayTasks.length);
        }
      }
    }
    
    return tasksMap;
  };

  const getGameTypesPerDay = () => {
    const gameTypesMap = new Map<string, 'home' | 'away' | 'both'>();
    
    if (!gameSeries || !userTeam) return gameTypesMap;
    
    // Get a range of dates to check
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const checkDate = new Date(d);
      const gameType = getGameType(checkDate);
      if (gameType) {
        gameTypesMap.set(checkDate.toDateString(), gameType);
      }
    }
    
    return gameTypesMap;
  };

  const selectedDateTasks = getTasksForDate(selectedDate);
  const selectedDateTemplateTasks = getTemplateTasksForDate(selectedDate);

  return (
    <div className="space-y-6">
      {gameSeries && userTeam && (
        <HomeGamesWidget gameSeries={gameSeries} teamName={userTeam} />
      )}
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Calendar</CardTitle>
            <CardDescription>View and manage your week's tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyCalendar
              selectedDate={selectedDate || new Date()}
              onSelectDate={setSelectedDate}
              tasksPerDay={getTasksPerDay()}
              gameTypesPerDay={getGameTypesPerDay()}
            />
          </CardContent>
        </Card>

        {/* Tasks for Selected Date */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Select a date'}
                </CardTitle>
                <CardDescription>
                  {selectedDate && isGameDay(selectedDate) ? (
                    <>{selectedDateTasks.length + selectedDateTemplateTasks.length} {(selectedDateTasks.length + selectedDateTemplateTasks.length) === 1 ? 'task' : 'tasks'} scheduled</>
                  ) : (
                    <>Off Day - {selectedDateTasks.length + selectedDateTemplateTasks.length} {(selectedDateTasks.length + selectedDateTemplateTasks.length) === 1 ? 'task' : 'tasks'} scheduled</>
                  )}
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Schedule a New Task</DialogTitle>
                    <DialogDescription>
                      Add a task for {selectedDate?.toLocaleDateString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">Task Title</Label>
                      <Input
                        id="task-title"
                        placeholder="e.g., Clean locker room"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                    </div>
                    <TimeSelect
                      id="task-time"
                      label="Time"
                      value={newTask.time}
                      onChange={(time) => setNewTask({ ...newTask, time })}
                    />
                    <div>
                      <Label htmlFor="task-category">Category</Label>
                      <select
                        id="task-category"
                        className="w-full h-10 px-3 rounded-md border border-gray-300"
                        value={newTask.category}
                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value as Task['category'] })}
                      >
                        <option value="sanitation">🧼 Sanitation & Facilities</option>
                        <option value="laundry">🧺 Laundry & Uniforms</option>
                        <option value="food">🍽️ Food & Nutrition</option>
                        <option value="communication">💬 Communication & Coordination</option>
                        <option value="maintenance">🧰 Maintenance & Supplies</option>
                        <option value="administration">💵 Administration & Compliance</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        placeholder="Task details..."
                        rows={3}
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddTask} className="w-full">
                      Add Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {selectedDateTasks.length === 0 && selectedDateTemplateTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-500">
                  <CalendarIcon className="h-12 w-12 mb-4 text-gray-300" />
                  <p>No tasks scheduled for this day</p>
                  <p className="text-sm mt-2">Click "Add Task" to create one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Template tasks (either game day or non-game day) */}
                  {selectedDateTemplateTasks.map((task) => {
                    const isGameDayTask = 'timePeriod' in task;
                    const selectedDateStr = selectedDate?.toISOString().split('T')[0] || '';
                    const isCompleted = isGameDayTask 
                      ? gameDayTaskCompletions[selectedDateStr]?.[task.id] || false
                      : nonGameDayTaskCompletions[task.id] || false;
                    
                    const bgColor = isGameDayTask 
                      ? (task.timePeriod === 'morning' ? 'bg-orange-50 border-orange-200' :
                         task.timePeriod === 'pre-game' ? 'bg-yellow-50 border-yellow-200' :
                         'bg-green-50 border-green-200')
                      : 'bg-blue-50 border-blue-200';
                    
                    const badgeLabel = isGameDayTask
                      ? (task.timePeriod === 'morning' ? 'Morning' :
                         task.timePeriod === 'pre-game' ? 'Pre-Game' :
                         'Post-Game')
                      : 'Daily Task';
                    
                    return (
                      <Card key={`template-${task.id}`} className={`shadow-sm ${bgColor}`}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <Checkbox
                                  id={`template-task-${task.id}`}
                                  checked={isCompleted}
                                  onCheckedChange={() => {
                                    if (isGameDayTask) {
                                      onToggleGameDayTask?.(selectedDateStr, task.id);
                                    } else {
                                      onToggleNonGameDayTask?.(task.id);
                                    }
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`template-task-${task.id}`}
                                    className={`block cursor-pointer ${isCompleted ? 'line-through text-gray-400' : ''}`}
                                  >
                                    <h3 className="font-medium mb-1">{task.title}</h3>
                                    {task.description && (
                                      <p className="text-sm text-gray-600">{task.description}</p>
                                    )}
                                  </label>
                                </div>
                              </div>
                              <Badge variant="secondary" className={
                                isGameDayTask 
                                  ? (task.timePeriod === 'morning' ? 'bg-orange-200 text-orange-800' :
                                     task.timePeriod === 'pre-game' ? 'bg-yellow-200 text-yellow-800' :
                                     'bg-green-200 text-green-800')
                                  : 'bg-blue-200 text-blue-800'
                              }>
                                {badgeLabel}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge className={getCategoryColor(task.category)}>
                                {getCategoryLabel(task.category)}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Custom scheduled tasks */}
                  {selectedDateTasks.map((task) => (
                    <Card key={task.id} className="shadow-sm">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                id={`task-${task.id}`}
                                checked={task.completed}
                                onCheckedChange={() => onToggleTask(task.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`task-${task.id}`}
                                  className={`block cursor-pointer ${task.completed ? 'line-through text-gray-400' : ''}`}
                                >
                                  <h3 className="font-medium mb-1">{task.title}</h3>
                                  {task.description && (
                                    <p className="text-sm text-gray-600">{task.description}</p>
                                  )}
                                </label>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteTask(task.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime12Hour(task.time)}
                            </Badge>
                            <Badge className={getCategoryColor(task.category)}>
                              {getCategoryLabel(task.category)}
                            </Badge>
                            {task.assignedTo && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {task.assignedTo}
                              </Badge>
                            )}
                            {task.completed && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* All Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>All Upcoming Tasks</CardTitle>
          <CardDescription>Overview of all scheduled tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {tasks
                .filter(task => task.date >= new Date(new Date().setHours(0, 0, 0, 0)))
                .sort((a, b) => {
                  const dateCompare = a.date.getTime() - b.date.getTime();
                  if (dateCompare !== 0) return dateCompare;
                  return a.time.localeCompare(b.time);
                })
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedDate(task.date)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </span>
                          <Badge className={getCategoryColor(task.category)} size="sm">
                            {task.category}
                          </Badge>
                          {task.completed && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800" size="sm">
                              Done
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {task.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime12Hour(task.time)}
                          </span>
                          {task.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
