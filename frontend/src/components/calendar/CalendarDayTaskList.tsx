// Right-panel card in CalendarView: shows tasks for the selected date + add-task dialog.
import React, { useState } from 'react';
import type { MouseEvent, FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Plus, Clock, User, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { formatTime12Hour } from '../../utils/timeFormat';
import { getCategoryBadgeColor as getCategoryColor, getCategoryLabel } from '../../utils/categoryHelpers';
import { CalendarTaskDialog } from './CalendarTaskDialog';
import type { Task, TemplateTask } from '../../types/index';

interface Props {
  selectedDate: Date | undefined;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  isGameDayFn: (date: Date) => boolean;
  getGameTypeFn: (date: Date) => 'home' | 'away' | 'both' | null;
  getGamesForDateFn: (date: Date | undefined) => Array<{ homeTeam: string; visitingTeam: string; time?: string; gameNumber: number }>;
  selectedDateTasks: Task[];
  selectedDateTemplateTasks: TemplateTask[];
  selectedDateRecurringTasks: Task[];
  gameDayTaskCompletions: Record<string, Record<string, boolean>>;
  nonGameDayTaskCompletions: Record<string, boolean>;
  recurringTaskCompletions: Record<string, Record<string, boolean>>;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleGameDayTask?: (date: string, taskId: string) => void;
  onToggleNonGameDayTask?: (taskId: string) => void;
  onToggleRecurringTask?: (date: string, taskId: string) => void;
}

export function CalendarDayTaskList({
  selectedDate, onAddTask,
  isGameDayFn, getGameTypeFn, getGamesForDateFn,
  selectedDateTasks, selectedDateTemplateTasks, selectedDateRecurringTasks,
  gameDayTaskCompletions, nonGameDayTaskCompletions, recurringTaskCompletions,
  onToggleTask, onDeleteTask, onToggleGameDayTask, onToggleNonGameDayTask, onToggleRecurringTask,
}: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    time: '09:00',
    category: 'maintenance' as Task['category'],
  });

  const handleAddTask = (e?: MouseEvent | FormEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
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
      setNewTask({ title: '', description: '', time: '09:00', category: 'maintenance' });
      setIsDialogOpen(false);
    }
  };

  const totalTaskCount = selectedDateTasks.length + selectedDateTemplateTasks.length + selectedDateRecurringTasks.length;
  const isGame = selectedDate ? isGameDayFn(selectedDate) : false;
  const gameType = selectedDate ? getGameTypeFn(selectedDate) : null;
  const games = getGamesForDateFn(selectedDate);
  const selectedDateStr = selectedDate?.toISOString().split('T')[0] || '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              }) : 'Select a date'}
            </CardTitle>
            <CardDescription>
              {selectedDate && isGame ? (
                <>{totalTaskCount} {totalTaskCount === 1 ? 'task' : 'tasks'} scheduled</>
              ) : (
                <>Off Day - {totalTaskCount} {totalTaskCount === 1 ? 'task' : 'tasks'} scheduled</>
              )}
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {/* Game details */}
            {isGame && games.length > 0 && (
              <Card className={`${
                gameType === 'home' ? 'bg-green-50 border-green-200' :
                gameType === 'away' ? 'bg-orange-50 border-orange-200' :
                'bg-purple-50 border-purple-200'
              }`}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={
                        gameType === 'home' ? 'bg-green-600 text-white' :
                        gameType === 'away' ? 'bg-orange-600 text-white' :
                        'bg-purple-600 text-white'
                      }>
                        {gameType === 'home' ? '🏠 Home Game' : gameType === 'away' ? '✈️ Away Game' : '🏠✈️ Games'}
                      </Badge>
                    </div>
                    {games.map((game, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium">{game.homeTeam} vs {game.visitingTeam}</div>
                        {game.time && (
                          <div className="text-gray-600 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />{game.time}
                          </div>
                        )}
                        {game.gameNumber > 1 && (
                          <div className="text-gray-500 text-xs mt-1">Game {game.gameNumber} of series</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {totalTaskCount === 0 && (!isGame || games.length === 0) && (
              <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-500">
                <CalendarIcon className="h-12 w-12 mb-4 text-gray-300" />
                <p>No tasks scheduled for this day</p>
                <p className="text-sm mt-2">Click "Add Task" to create one</p>
              </div>
            )}

            {/* Template tasks */}
            {selectedDateTemplateTasks.map((task) => {
              const isGameDayTask = 'timePeriod' in task;
              const isCompleted = isGameDayTask
                ? gameDayTaskCompletions[selectedDateStr]?.[task.id] || false
                : nonGameDayTaskCompletions[task.id] || false;
              const bgColor = isGameDayTask
                ? (task.timePeriod === 'morning' ? 'bg-orange-50 border-orange-200' :
                   task.timePeriod === 'pre-game' ? 'bg-yellow-50 border-yellow-200' :
                   'bg-green-50 border-green-200')
                : 'bg-blue-50 border-blue-200';
              const badgeLabel = isGameDayTask
                ? (task.timePeriod === 'morning' ? 'Morning' : task.timePeriod === 'pre-game' ? 'Pre-Game' : 'Post-Game')
                : 'Daily Task';
              const badgeColor = isGameDayTask
                ? (task.timePeriod === 'morning' ? 'bg-orange-200 text-orange-800' :
                   task.timePeriod === 'pre-game' ? 'bg-yellow-200 text-yellow-800' :
                   'bg-green-200 text-green-800')
                : 'bg-blue-200 text-blue-800';

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
                              {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                            </label>
                          </div>
                        </div>
                        <Badge variant="secondary" className={badgeColor}>{badgeLabel}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getCategoryColor(task.category)}>{getCategoryLabel(task.category)}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Recurring tasks */}
            {selectedDateRecurringTasks.map((task) => {
              const recurringTaskId = task.id.split('-')[1]; // Extract the recurring task ID
              const isCompleted = recurringTaskCompletions[selectedDateStr]?.[recurringTaskId] || false;
              return (
                <Card key={task.id} className="shadow-sm bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            id={`recurring-task-${task.id}`}
                            checked={isCompleted}
                            onCheckedChange={() => {
                              if (onToggleRecurringTask && selectedDateStr) {
                                onToggleRecurringTask(selectedDateStr, recurringTaskId);
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`recurring-task-${task.id}`}
                              className={`block cursor-pointer ${isCompleted ? 'line-through text-gray-400' : ''}`}
                            >
                              <h3 className="font-medium mb-1">{task.title}</h3>
                              {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                            </label>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-200 text-blue-800">Recurring</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{formatTime12Hour(task.time)}
                        </Badge>
                        <Badge className={getCategoryColor(task.category)}>{getCategoryLabel(task.category)}</Badge>
                        {isCompleted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
                        )}
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
                            {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
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
                        <Clock className="h-3 w-3" />{formatTime12Hour(task.time)}
                      </Badge>
                      <Badge className={getCategoryColor(task.category)}>{getCategoryLabel(task.category)}</Badge>
                      {task.assignedTo && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <User className="h-3 w-3" />{task.assignedTo}
                        </Badge>
                      )}
                      {task.completed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <CalendarTaskDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        newTask={newTask}
        setNewTask={setNewTask}
        onSubmit={handleAddTask}
      />
    </Card>
  );
}
