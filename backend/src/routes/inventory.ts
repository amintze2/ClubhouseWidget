import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Inventory } from '../types/db';
import { verifySluggerToken } from '../middleware/auth';

const router = Router();

// Get all inventory items for a specific team
router.get('/team/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    // Verify team exists
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .single();

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all inventory items (across all teams)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's team inventory (uses JWT token)
router.get('/me/team', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    // Get SLUGGER user ID from JWT token
    const sluggerUserId = req.user?.sub;

    if (!sluggerUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find user in database by slugger_user_id
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, user_team')
      .eq('slugger_user_id', sluggerUserId)
      .single();

    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    if (!user.user_team) {
      return res.json([]); // User has no team, return empty array
    }

    // Get team's inventory
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('team_id', user.user_team)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single inventory item by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new inventory item for a team
router.post('/team/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    // Verify team exists
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .single();

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const inventoryData: Omit<Inventory, 'id' | 'created_at'> = {
      ...req.body,
      team_id: parseInt(teamId),
    };

    const { data, error } = await supabase
      .from('inventory')
      .insert([inventoryData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new inventory item for current user's team (uses JWT token)
router.post('/me/team', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    // Get SLUGGER user ID from JWT token
    const sluggerUserId = req.user?.sub;

    if (!sluggerUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find user in database by slugger_user_id
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, user_team')
      .eq('slugger_user_id', sluggerUserId)
      .single();

    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    if (!user.user_team) {
      return res.status(400).json({ error: 'User is not assigned to a team' });
    }

    const inventoryData: Omit<Inventory, 'id' | 'created_at'> = {
      ...req.body,
      team_id: user.user_team,
    };

    const { data, error } = await supabase
      .from('inventory')
      .insert([inventoryData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update an inventory item (protected - requires authentication)
router.put('/:id', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<Omit<Inventory, 'id' | 'created_at' | 'team_id'>> = req.body;

    // Don't allow updating team_id through this endpoint (use DELETE + POST if needed)
    delete (updateData as any).team_id;

    // Optional: Verify the inventory item belongs to the authenticated user's team
    const sluggerUserId = req.user?.sub;
    
    if (sluggerUserId) {
      // Find user in database
      const { data: user } = await supabase
        .from('user')
        .select('user_team')
        .eq('slugger_user_id', sluggerUserId)
        .single();

      if (user && user.user_team) {
        // Verify inventory item belongs to this user's team
        const { data: inventory } = await supabase
          .from('inventory')
          .select('team_id')
          .eq('id', id)
          .single();

        if (inventory && inventory.team_id !== user.user_team) {
          return res.status(403).json({ error: 'Forbidden: Cannot update inventory from other teams' });
        }
      }
    }

    const { data, error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an inventory item (protected - requires authentication)
router.delete('/:id', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Optional: Verify the inventory item belongs to the authenticated user's team
    const sluggerUserId = req.user?.sub;
    
    if (sluggerUserId) {
      // Find user in database
      const { data: user } = await supabase
        .from('user')
        .select('user_team')
        .eq('slugger_user_id', sluggerUserId)
        .single();

      if (user && user.user_team) {
        // Verify inventory item belongs to this user's team
        const { data: inventory } = await supabase
          .from('inventory')
          .select('team_id')
          .eq('id', id)
          .single();

        if (inventory && inventory.team_id !== user.user_team) {
          return res.status(403).json({ error: 'Forbidden: Cannot delete inventory from other teams' });
        }
      }
    }

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
