// Daily checklist view for clubhouse staff.
// - Shows all of today's tasks for the current user, including recurring and template tasks.
// - Applies game-day vs off-day logic using taskType to decide when tasks should appear.
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import type { Task, GameSeries, TemplateTask, RecurringTask } from '../types/index';
import { HomeGamesWidget } from './HomeGamesWidget';
import { useTodaysChecklist } from '../hooks/useTodaysChecklist';
import { TaskItem } from './checklist/TaskItem';
import { TaskSection } from './checklist/TaskSection';

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

  const {
    today,
    todayStr,
    hasGameToday,
    todaysTasks,
    todaysRecurringTasks,
    morningTasks,
    pregameTasks,
    postgameTasks,
  } = useTodaysChecklist({ tasks, recurringTasks, recurringTaskCompletions, gameSeries, userTeam });

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
    setNewTask({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '09:00', category: 'sanitation' });
    setOpenDialog(null);
  };

  const calculateProgress = (items: Task[] | TemplateTask[], completions?: Record<string, boolean>) => {
    if (items.length === 0) return 0;
    if (completions) return (items.filter(item => completions[item.id]).length / items.length) * 100;
    return ((items as Task[]).filter(item => item.completed).length / items.length) * 100;
  };

  // ── Non-game day task list ─────────────────────────────────────────────────

  const renderNonGameDayTasks = () => {
    const offDayRecurringTasks = todaysRecurringTasks.filter(rt => {
      const parts = rt.id.split('-');
      if (parts.length < 3) return false;
      const recurringTaskId = parts.slice(1, -1).join('-');
      return recurringTasks.find(r => r.id === recurringTaskId)?.taskType === 'off-day';
    });

    const totalTasks = nonGameDayTasks.length + offDayRecurringTasks.length + todaysTasks.length;
    const completedTemplateTasks = nonGameDayTasks.filter(t => nonGameDayTaskCompletions[t.id]).length;
    const completedRecurringTasks = offDayRecurringTasks.filter(rt => {
      const parts = rt.id.split('-');
      const rid = parts.length >= 3 ? parts.slice(1, -1).join('-') : parts[1];
      return recurringTaskCompletions[todayStr]?.[rid] || false;
    }).length;
    const completedRegularTasks = todaysTasks.filter(t => t.completed).length;
    const completedTasks = completedTemplateTasks + completedRecurringTasks + completedRegularTasks;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const allItems = [
      ...nonGameDayTasks.map(t => ({ ...t, type: 'template' as const, displayTime: '00:00' })),
      ...offDayRecurringTasks.map(t => ({ ...t, type: 'recurring' as const, displayTime: t.time })),
      ...todaysTasks.map(t => ({ ...t, type: 'regular' as const, displayTime: t.time })),
    ].sort((a, b) => {
      if (a.type === 'template' && b.type !== 'template') return -1;
      if (a.type !== 'template' && b.type === 'template') return 1;
      if (a.type === 'template' && b.type === 'template') return 0;
      return a.displayTime.localeCompare(b.displayTime);
    });

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Clubhouse Tasks</CardTitle>
              <CardDescription>Standard tasks for off days</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-4">
              {completedTasks} / {totalTasks}
            </Badge>
          </div>
          {totalTasks > 0 && (
            <div className="pt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% Complete</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {totalTasks === 0 ? (
              <div className="text-center text-gray-500 py-8"><p>No tasks for today.</p></div>
            ) : (
              allItems.map(item => {
                if (item.type === 'template') {
                  return (
                    <TaskItem
                      key={item.id}
                      checkboxId={`nongame-${item.id}`}
                      isChecked={nonGameDayTaskCompletions[item.id] || false}
                      onToggle={() => onToggleNonGameDayTask(item.id)}
                      title={item.title}
                      category={item.category}
                      description={item.description}
                    />
                  );
                }
                if (item.type === 'recurring') {
                  const task = item as Task;
                  const parts = task.id.split('-');
                  const recurringTaskId = parts.length >= 3 ? parts.slice(1, -1).join('-') : parts[1];
                  const isCompleted = recurringTaskCompletions[todayStr]?.[recurringTaskId] || false;
                  return (
                    <TaskItem
                      key={task.id}
                      checkboxId={`recurring-${task.id}`}
                      isChecked={isCompleted}
                      onToggle={() => onToggleRecurringTask?.(todayStr, recurringTaskId)}
                      title={task.title}
                      category={task.category}
                      description={task.description}
                      time={task.time}
                      isRecurring
                    />
                  );
                }
                // regular task
                const task = item as Task;
                return (
                  <TaskItem
                    key={task.id}
                    checkboxId={`task-${task.id}`}
                    isChecked={task.completed}
                    onToggle={() => onToggleTask(task.id)}
                    title={task.title}
                    category={task.category}
                    description={task.description}
                    time={task.time}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Progress calculations for accordion ───────────────────────────────────

  const todayGameDayCompletions = gameDayTaskCompletions[todayStr] || {};
  const morningTemplateTasks = gameDayTasks.filter(t => t.timePeriod === 'morning');
  const pregameTemplateTasks = gameDayTasks.filter(t => t.timePeriod === 'pre-game');
  const postgameTemplateTasks = gameDayTasks.filter(t => t.timePeriod === 'post-game');

  const morningProgress = calculateProgress(morningTemplateTasks, todayGameDayCompletions);
  const pregameProgress = calculateProgress(pregameTemplateTasks, todayGameDayCompletions);
  const postgameProgress = calculateProgress(postgameTemplateTasks, todayGameDayCompletions);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {gameSeries && userTeam && (
        <HomeGamesWidget gameSeries={gameSeries} teamName={userTeam} />
      )}

      {hasGameToday && (
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
                <Badge variant="secondary" className="ml-4">{Math.round(morningProgress)}%</Badge>
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
                <Badge variant="secondary" className="ml-4">{Math.round(pregameProgress)}%</Badge>
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
                <Badge variant="secondary" className="ml-4">{Math.round(postgameProgress)}%</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <Progress value={postgameProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(postgameProgress)}% Complete</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="space-y-6">
        {hasGameToday ? (
          <>
            <TaskSection
              title="Morning / Pre-Arrival Tasks"
              description="Tasks to complete before players arrive"
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              templateTasks={morningTemplateTasks}
              completions={todayGameDayCompletions}
              periodTasks={morningTasks}
              todayStr={todayStr}
              recurringTaskCompletions={recurringTaskCompletions}
              onToggleGameDayTask={onToggleGameDayTask}
              onToggleRecurringTask={onToggleRecurringTask}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
            />
            <TaskSection
              title="Pre-Game Tasks"
              description="Tasks to complete before game time"
              bgColor="bg-yellow-50"
              borderColor="border-yellow-200"
              templateTasks={pregameTemplateTasks}
              completions={todayGameDayCompletions}
              periodTasks={pregameTasks}
              todayStr={todayStr}
              recurringTaskCompletions={recurringTaskCompletions}
              onToggleGameDayTask={onToggleGameDayTask}
              onToggleRecurringTask={onToggleRecurringTask}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
            />
            <TaskSection
              title="Post-Game / End of Day Tasks"
              description="Tasks to complete after the game"
              bgColor="bg-green-50"
              borderColor="border-green-200"
              templateTasks={postgameTemplateTasks}
              completions={todayGameDayCompletions}
              periodTasks={postgameTasks}
              todayStr={todayStr}
              recurringTaskCompletions={recurringTaskCompletions}
              onToggleGameDayTask={onToggleGameDayTask}
              onToggleRecurringTask={onToggleRecurringTask}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
            />
          </>
        ) : renderNonGameDayTasks()}
      </div>
    </div>
  );
}
