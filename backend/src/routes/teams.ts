import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Team } from '../types/db';
import { verifySluggerToken } from '../middleware/auth';

const router = Router();

// Get all teams
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('team_name', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single team by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new team (protected - requires authentication)
router.post('/', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { team_name } = req.body;

    if (!team_name) {
      return res.status(400).json({ error: 'team_name is required' });
    }

    const teamData: Omit<Team, 'id' | 'created_at'> = {
      team_name,
    };

    const { data, error } = await supabase
      .from('teams')
      .insert([teamData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a team (protected - requires authentication)
router.put('/:id', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<Omit<Team, 'id' | 'created_at'>> = req.body;

    const { data, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a team (protected - requires authentication)
router.delete('/:id', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

