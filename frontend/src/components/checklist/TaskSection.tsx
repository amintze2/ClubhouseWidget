// Game-day task section card (wraps renderGameDayTaskList from ClubhouseChecklist).
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TaskItem } from './TaskItem';
import type { Task, TemplateTask } from '../../types/index';

interface TaskSectionProps {
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  templateTasks: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }>;
  completions: Record<string, boolean>;
  periodTasks: Task[];
  todayStr: string;
  recurringTaskCompletions: Record<string, Record<string, boolean>>;
  onToggleGameDayTask: (date: string, taskId: string) => void;
  onToggleRecurringTask?: (date: string, taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskSection({
  title, description, bgColor, borderColor,
  templateTasks, completions, periodTasks, todayStr,
  recurringTaskCompletions, onToggleGameDayTask,
  onToggleRecurringTask, onToggleTask, onDeleteTask,
}: TaskSectionProps) {
  const completedTemplateTasks = templateTasks.filter(t => completions[t.id]).length;
  const completedPeriodTasks = periodTasks.filter(task => {
    if (task.id.startsWith('recurring-')) {
      const parts = task.id.split('-');
      const rid = parts.length >= 3 ? parts.slice(1, -1).join('-') : parts[1];
      return recurringTaskCompletions[todayStr]?.[rid] || false;
    }
    return task.completed;
  }).length;
  const totalTasks = templateTasks.length + periodTasks.length;
  const progress = totalTasks > 0 ? ((completedTemplateTasks + completedPeriodTasks) / totalTasks) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-4">
            {completedTemplateTasks + completedPeriodTasks} / {totalTasks}
          </Badge>
        </div>
        <div className="pt-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% Complete</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templateTasks.map(task => (
            <TaskItem
              key={task.id}
              checkboxId={`gameday-task-${task.id}`}
              isChecked={completions[task.id] || false}
              onToggle={() => onToggleGameDayTask(todayStr, task.id)}
              title={task.title}
              category={task.category}
              description={task.description}
              containerClassName={`${bgColor} ${borderColor}`}
            />
          ))}
          {periodTasks.map(task => {
            const isRecurring = task.id.startsWith('recurring-');
            let recurringTaskId: string | null = null;
            if (isRecurring) {
              const parts = task.id.split('-');
              recurringTaskId = parts.length >= 3 ? parts.slice(1, -1).join('-') : parts[1];
            }
            const isCompleted = isRecurring
              ? (recurringTaskCompletions[todayStr]?.[recurringTaskId || ''] || false)
              : task.completed;

            return (
              <TaskItem
                key={task.id}
                checkboxId={`task-${task.id}`}
                isChecked={isCompleted}
                onToggle={() => {
                  if (isRecurring && onToggleRecurringTask && recurringTaskId) {
                    onToggleRecurringTask(todayStr, recurringTaskId);
                  } else {
                    onToggleTask(task.id);
                  }
                }}
                title={task.title}
                category={task.category}
                description={task.description}
                time={task.time}
                isRecurring={isRecurring}
                onDelete={!isRecurring ? () => onDeleteTask(task.id) : undefined}
                containerClassName={isRecurring ? 'bg-blue-50 border-blue-200' : `${bgColor} ${borderColor}`}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
