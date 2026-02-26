import { supabase } from '../../utils/supabase/client';
import type { TaskCategory } from './tasks';

export interface Inventory {
  id: number;
  team_id: number | null;
  meal_id: number | null;
  inventory_type: TaskCategory | null;
  inventory_item: string | null;
  current_stock: number | null;
  required_stock: number | null;
  unit: string | null;
  purchase_link: string | null;
  note: string | null;
  price_per_unit: number | null;
  created_at: string;
}

export const inventoryApi = {
  getTeamInventory: async (teamId: number): Promise<Inventory[]> => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  getAllInventory: async (): Promise<Inventory[]> => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  createInventory: async (teamId: number, data: Omit<Inventory, 'id' | 'created_at' | 'team_id'>): Promise<Inventory> => {
    const { data: result, error } = await supabase
      .from('inventory')
      .insert([{ ...data, team_id: teamId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to create inventory item');
    return result;
  },

  updateInventory: async (id: number, data: Partial<Omit<Inventory, 'id' | 'created_at' | 'team_id'>>): Promise<Inventory> => {
    const { data: result, error } = await supabase
      .from('inventory')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Inventory item not found');
    return result;
  },

  deleteInventory: async (id: number): Promise<void> => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
