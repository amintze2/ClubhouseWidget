import { supabase } from '../../utils/supabase/client';
import type { TaskCategory } from './tasks';
import { z } from 'zod';

const inventoryWriteSchema = z.object({
  meal_id: z.number().int().nullable().optional(),
  inventory_type: z.string().nullable().optional(),
  inventory_item: z.string().min(1).max(500).nullable().optional(),
  current_stock: z.number().min(0).nullable().optional(),
  required_stock: z.number().min(0).nullable().optional(),
  unit: z.string().max(50).nullable().optional(),
  purchase_link: z.string().url().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  price_per_unit: z.number().min(0).nullable().optional(),
});

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
  price_per_unit: string | null; // numeric(10,2) — use string to preserve decimal precision
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

  createInventory: async (teamId: number, data: Omit<Inventory, 'id' | 'created_at' | 'team_id'>): Promise<Inventory> => {
    inventoryWriteSchema.parse(data);
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
    inventoryWriteSchema.partial().parse(data);
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
