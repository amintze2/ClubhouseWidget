// Calendar-based view of clubhouse tasks.
// - Shows tasks, recurring tasks, and template tasks on a weekly calendar.
// - Uses game schedule to distinguish game days vs off days for filtering.
// - Allows adding, toggling, and deleting tasks for specific dates.
import React, { useState } from 'react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Clock, User, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { formatTime12Hour } from '../utils/timeFormat';
import type { Task, GameSeries, TemplateTask, RecurringTask } from '../types/index';
import { HomeGamesWidget } from './HomeGamesWidget';
import { getCategoryBadgeColor as getCategoryColor } from '../utils/categoryHelpers';
import { useCalendarData } from '../hooks/useCalendarData';
import { CalendarDayTaskList } from './calendar/CalendarDayTaskList';

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
  recurringTasks?: RecurringTask[];
  recurringTaskCompletions?: Record<string, Record<string, boolean>>;
  onToggleRecurringTask?: (date: string, taskId: string) => void;
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
  recurringTasks = [],
  recurringTaskCompletions = {},
  onToggleRecurringTask,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const {
    isGameDay,
    getGameType,
    getGamesForDate,
    getTasksForDate,
    getRecurringTasksForDate,
    getTemplateTasksForDate,
    getTasksPerDay,
    getGameTypesPerDay,
  } = useCalendarData({
    tasks, gameSeries, userTeam,
    gameDayTasks, nonGameDayTasks,
    recurringTasks, recurringTaskCompletions,
  });

  return (
    <div className="space-y-6">
      {gameSeries && userTeam && (
        <HomeGamesWidget gameSeries={gameSeries} teamName={userTeam} />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
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

        <CalendarDayTaskList
          selectedDate={selectedDate}
          onAddTask={onAddTask}
          isGameDayFn={isGameDay}
          getGameTypeFn={getGameType}
          getGamesForDateFn={getGamesForDate}
          selectedDateTasks={getTasksForDate(selectedDate)}
          selectedDateTemplateTasks={getTemplateTasksForDate(selectedDate)}
          selectedDateRecurringTasks={getRecurringTasksForDate(selectedDate)}
          gameDayTaskCompletions={gameDayTaskCompletions}
          nonGameDayTaskCompletions={nonGameDayTaskCompletions}
          recurringTaskCompletions={recurringTaskCompletions}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onToggleGameDayTask={onToggleGameDayTask}
          onToggleNonGameDayTask={onToggleNonGameDayTask}
          onToggleRecurringTask={onToggleRecurringTask}
        />
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
                        onCheckedChange={() => onToggleTask(task.id)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                            <Badge variant="secondary" className="bg-green-100 text-green-800" size="sm">Done</Badge>
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
                              <User className="h-3 w-3" />{task.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteTask(task.id); }}
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
