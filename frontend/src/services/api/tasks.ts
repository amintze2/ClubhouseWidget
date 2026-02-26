import { supabase } from '../../utils/supabase/client';

// Matches the PostgreSQL enum type
export type TaskCategory =
  | 'Medical & Safety'
  | 'Equipment & Field Support'
  | 'Laundry & Cleaning'
  | 'Hygiene & Personal Care'
  | 'Meals & Nutrition'
  | 'Misc';

export interface Task {
  id: number;
  user_id: number | null;
  task_name: string | null;
  task_complete: boolean | null;
  task_category: TaskCategory | null;
  task_description: string | null;
  task_type: number | null;
  task_date: string | null;
  task_time: string | null;
  is_repeating: boolean;
  repeating_day: number | null;
  created_at: string;
}

export const taskApi = {
  getUserTasks: async (userId: number): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('task')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  createTask: async (userId: number, data: Omit<Task, 'id' | 'created_at' | 'user_id'>): Promise<Task> => {
    const { data: result, error } = await supabase
      .from('task')
      .insert([{ ...data, user_id: userId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to create task');
    return result;
  },

  updateTask: async (id: number, data: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>>): Promise<Task> => {
    const { data: result, error } = await supabase
      .from('task')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Task not found');
    return result;
  },

  toggleTask: async (id: number): Promise<Task> => {
    const { data: task, error: fetchError } = await supabase
      .from('task')
      .select('task_complete')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    if (!task) throw new Error('Task not found');

    const { data: result, error } = await supabase
      .from('task')
      .update({ task_complete: !task.task_complete })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to toggle task');
    return result;
  },

  deleteTask: async (id: number): Promise<void> => {
    const { error } = await supabase.from('task').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
