// Handles all task and recurring-task CRUD operations.
// Extracted from App.tsx to reduce component state complexity.
import type { User as BackendUser } from '../services/api';
import { taskApi } from '../services/api';
import type { Task, RecurringTask } from '../types/index';
import { frontendCategoryToDb } from '../utils/categoryMappings';
import { toDbTaskTime } from '../utils/timeFormat';

export function useTaskManagement(
  backendUser: BackendUser | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setRecurringTasks: React.Dispatch<React.SetStateAction<RecurringTask[]>>,
  refreshUserData: () => Promise<void>,
) {
  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    if (!backendUser) return;
    try {
      const newBackendTask = await taskApi.createTask(backendUser.id, {
        task_name: task.title,
        task_description: task.description,
        task_complete: false,
        task_category: frontendCategoryToDb(task.category) as any,
        task_type: null,
        task_date: task.date ? task.date.toISOString().split('T')[0] : null,
        task_time: task.time || null,
        is_repeating: false,
        repeating_day: null,
      });
      setTasks(prev => [...prev, { ...task, id: newBackendTask.id.toString(), taskType: newBackendTask.task_type || null }]);
      await refreshUserData();
    } catch {
      setTasks(prev => [...prev, { ...task, id: Date.now().toString(), taskType: null }]);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!backendUser) return;
    try {
      await taskApi.toggleTask(parseInt(taskId));
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
      await refreshUserData();
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!backendUser) return;
    try {
      await taskApi.deleteTask(parseInt(taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await refreshUserData();
    } catch {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleAddRecurringTask = async (task: Omit<RecurringTask, 'id'>) => {
    if (!backendUser) return;
    try {
      const newBackendTask = await taskApi.createTask(backendUser.id, {
        task_name: task.title,
        task_description: task.description,
        task_complete: false,
        task_category: frontendCategoryToDb(task.category as Task['category']) as any,
        task_type: null,
        task_date: null,
        task_time: toDbTaskTime(task.time),
        is_repeating: true,
        repeating_day: task.taskType === 'off-day' ? 0 : null,
      });
      setRecurringTasks(prev => [...prev, { ...task, id: newBackendTask.id.toString() }]);
      await refreshUserData();
    } catch {
      setRecurringTasks(prev => [...prev, { ...task, id: Date.now().toString() }]);
    }
  };

  const handleUpdateRecurringTask = async (task: RecurringTask) => {
    if (!backendUser) return;
    try {
      await taskApi.updateTask(parseInt(task.id), {
        task_name: task.title,
        task_description: task.description,
        task_category: frontendCategoryToDb(task.category as Task['category']) as any,
        task_time: toDbTaskTime(task.time),
        is_repeating: true,
        repeating_day: task.taskType === 'off-day' ? 0 : null,
      });
      setRecurringTasks(prev => prev.map(t => t.id === task.id ? task : t));
      await refreshUserData();
    } catch {
      setRecurringTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleDeleteRecurringTask = async (taskId: string) => {
    if (!backendUser) return;
    try {
      await taskApi.deleteTask(parseInt(taskId));
      setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
      await refreshUserData();
    } catch {
      setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  return {
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleAddRecurringTask,
    handleUpdateRecurringTask,
    handleDeleteRecurringTask,
  };
}
