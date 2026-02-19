import { useState, useEffect } from 'react';
import type { User as BackendUser, UserWithData } from '../services/api';
import type { Task } from '../types/index';
import type { RecurringTask } from '../types/index';
import { dbCategoryToFrontend } from '../utils/categoryMappings';
import { convertTimeTo12Hour } from '../utils/timeFormat';

export function useTaskSync(backendUser: BackendUser | null, userData: UserWithData | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);

  useEffect(() => {
    if (!backendUser || !userData) return;

    const frontendTasks: Task[] = (userData.tasks || []).map(task => {
      let taskDate: Date;
      if (task.task_date) {
        const dateStr = task.task_date.toString();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          taskDate = new Date(year, month - 1, day);
        } else {
          taskDate = new Date(task.task_date);
        }
      } else {
        taskDate = new Date(task.created_at);
      }

      return {
        id: task.id.toString(),
        title: task.task_name || '',
        description: task.task_description || '',
        date: taskDate,
        time: task.task_time || '09:00',
        category: dbCategoryToFrontend(task.task_category),
        completed: task.task_complete || false,
        assignedTo: backendUser.user_name || '',
        taskType: task.task_type || null,
      };
    });

    const recurringTasksFromDb: RecurringTask[] = (userData.tasks || [])
      .filter(task => task.is_repeating)
      .map(task => {
        const taskType: 'off-day' | 'game-day' = task.repeating_day === 0 ? 'off-day' : 'game-day';
        return {
          id: task.id.toString(),
          title: task.task_name || '',
          description: task.task_description || '',
          category: dbCategoryToFrontend(task.task_category),
          taskType,
          time: convertTimeTo12Hour(task.task_time || '09:00'),
          timePeriod: taskType === 'game-day' ? ('morning' as const) : undefined,
          enabled: true,
        };
      });

    setTasks(frontendTasks);
    setRecurringTasks(recurringTasksFromDb);
  }, [backendUser, userData]);

  return { tasks, setTasks, recurringTasks, setRecurringTasks };
}
