import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { User } from '../types/db';
import { verifySluggerToken } from '../middleware/auth';

const router = Router();

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch team names for users with team IDs
    if (data && data.length > 0) {
      const teamIds = data
        .map(user => user.user_team)
        .filter((id): id is number => id !== null);
      
      if (teamIds.length > 0) {
        const { data: teams } = await supabase
          .from('teams')
          .select('id, team_name')
          .in('id', teamIds);

        if (teams) {
          const teamsMap = new Map(teams.map(t => [t.id, t.team_name]));
          const usersWithTeamNames = data.map(user => ({
            ...user,
            team_name: user.user_team ? teamsMap.get(user.user_team) || null : null,
          }));
          return res.json(usersWithTeamNames);
        }
      }
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch team name if user has a team
    if (data.user_team) {
      const { data: team } = await supabase
        .from('teams')
        .select('team_name')
        .eq('id', data.user_team)
        .single();

      return res.json({
        ...data,
        team_name: team?.team_name || null,
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by slugger_user_id
router.get('/slugger/:sluggerUserId', async (req: Request, res: Response) => {
  try {
    const { sluggerUserId } = req.params;

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('slugger_user_id', sluggerUserId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch team name if user has a team
    if (data.user_team) {
      const { data: team } = await supabase
        .from('teams')
        .select('team_name')
        .eq('id', data.user_team)
        .single();

      return res.json({
        ...data,
        team_name: team?.team_name || null,
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user from JWT token (requires authentication)
// This route uses the middleware to get the authenticated user
router.get('/me', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    // req.user is set by verifySluggerToken middleware
    // req.user.sub contains the SLUGGER user ID (Cognito user ID)
    const sluggerUserId = req.user?.sub;

    if (!sluggerUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find user in database by slugger_user_id
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('slugger_user_id', sluggerUserId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Fetch team name if user has a team
    if (data.user_team) {
      const { data: team } = await supabase
        .from('teams')
        .select('team_name')
        .eq('id', data.user_team)
        .single();

      return res.json({
        ...data,
        team_name: team?.team_name || null,
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get users by team ID
router.get('/team/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_team', parseInt(teamId))
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const userData: Omit<User, 'id' | 'created_at'> = req.body;

    const { data, error } = await supabase
      .from('user')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<Omit<User, 'id' | 'created_at'>> = req.body;

    const { data, error } = await supabase
      .from('user')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a user (will cascade delete inventory and tasks)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('user')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's complete data (uses JWT token, no ID needed)
router.get('/me/complete', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    // Get SLUGGER user ID from JWT token
    const sluggerUserId = req.user?.sub;

    if (!sluggerUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find user in database by slugger_user_id
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('slugger_user_id', sluggerUserId)
      .single();

    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Get team's inventory (if user has a team)
    let inventory = [];
    if (user.user_team) {
      const { data: teamInventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('team_id', user.user_team)
        .order('created_at', { ascending: false });

      if (inventoryError) throw inventoryError;
      inventory = teamInventory || [];
    }

    // Get user's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('task')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    // Fetch team name if user has a team
    let teamName = null;
    if (user.user_team) {
      const { data: team } = await supabase
        .from('teams')
        .select('team_name')
        .eq('id', user.user_team)
        .single();
      teamName = team?.team_name || null;
    }

    res.json({
      ...user,
      team_name: teamName,
      inventory: inventory || [],
      tasks: tasks || [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user with all associated inventory and tasks by database ID
// This route is public (used in standalone mode for manual login)
// For authenticated access, use /me/complete instead
router.get('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get user
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('id', id)
      .single();

    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get team's inventory (if user has a team)
    let inventory = [];
    if (user.user_team) {
      const { data: teamInventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('team_id', user.user_team)
        .order('created_at', { ascending: false });

      if (inventoryError) throw inventoryError;
      inventory = teamInventory || [];
    }

    // Get user's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('task')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    // Fetch team name if user has a team
    let teamName = null;
    if (user.user_team) {
      const { data: team } = await supabase
        .from('teams')
        .select('team_name')
        .eq('id', user.user_team)
        .single();
      teamName = team?.team_name || null;
    }

    res.json({
      ...user,
      team_name: teamName,
      inventory: inventory || [],
      tasks: tasks || [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

