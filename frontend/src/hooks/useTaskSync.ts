import { useState, useEffect } from 'react';
import type { User as BackendUser, UserWithData } from '../services/api';
import type { Task } from '../App';
import type { RecurringTask } from '../components/RecurringTasks';

// Maps DB enum values (both spaced and underscored formats) to frontend Task categories
const DB_TO_TASK_CATEGORY: Record<string, Task['category']> = {
  'medical & safety': 'sanitation',
  'medical_safety': 'sanitation',
  'equipment & field support': 'maintenance',
  'equipment_field_support': 'maintenance',
  'laundry & cleaning': 'laundry',
  'laundry_cleaning': 'laundry',
  'hygiene & personal care': 'sanitation',
  'hygiene_personal_care': 'sanitation',
  'meals & nutrition': 'food',
  'meals_nutrition': 'food',
  'misc': 'administration',
  'miscellaneous': 'administration',
};

export function dbCategoryToFrontend(dbCategory: string | null): Task['category'] {
  if (!dbCategory) return 'sanitation';
  return DB_TO_TASK_CATEGORY[String(dbCategory).trim().toLowerCase()] ?? 'sanitation';
}

function convertTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

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
