import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Task } from '../types/db';
import { verifySluggerToken } from '../middleware/auth';

const router = Router();

// Get all tasks for a specific user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const { data: user } = await supabase
      .from('user')
      .select('id')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data, error } = await supabase
      .from('task')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's tasks (uses JWT token, no userId needed)
router.get('/me', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    // Get SLUGGER user ID from JWT token
    const sluggerUserId = req.user?.sub;

    if (!sluggerUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find user in database by slugger_user_id
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('slugger_user_id', sluggerUserId)
      .single();

    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Get all tasks for this user
    const { data, error } = await supabase
      .from('task')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks (across all users)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('task')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks by completion status for a user
router.get('/user/:userId/status/:complete', async (req: Request, res: Response) => {
  try {
    const { userId, complete } = req.params;
    const isComplete = complete === 'true' || complete === '1';

    // Verify user exists
    const { data: user } = await supabase
      .from('user')
      .select('id')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data, error } = await supabase
      .from('task')
      .select('*')
      .eq('user_id', userId)
      .eq('task_complete', isComplete)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('task')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task for a user
router.post('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const { data: user } = await supabase
      .from('user')
      .select('id')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const taskData: Omit<Task, 'id' | 'created_at'> = {
      ...req.body,
      user_id: parseInt(userId),
    };

    const { data, error } = await supabase
      .from('task')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task for the current authenticated user (uses JWT token)
router.post('/me', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    // Get SLUGGER user ID from JWT token
    const sluggerUserId = req.user?.sub;

    if (!sluggerUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find user in database by slugger_user_id
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('slugger_user_id', sluggerUserId)
      .single();

    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const taskData: Omit<Task, 'id' | 'created_at'> = {
      ...req.body,
      user_id: user.id, // Use the database user ID
    };

    const { data, error } = await supabase
      .from('task')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task (protected - requires authentication)
router.put('/:id', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>> = req.body;

    // Don't allow updating user_id through this endpoint
    delete (updateData as any).user_id;

    // Optional: Verify the task belongs to the authenticated user
    // Get SLUGGER user ID from JWT token
    const sluggerUserId = req.user?.sub;
    
    if (sluggerUserId) {
      // Find user in database
      const { data: user } = await supabase
        .from('user')
        .select('id')
        .eq('slugger_user_id', sluggerUserId)
        .single();

      if (user) {
        // Verify task belongs to this user
        const { data: task } = await supabase
          .from('task')
          .select('user_id')
          .eq('id', id)
          .single();

        if (task && task.user_id !== user.id) {
          return res.status(403).json({ error: 'Forbidden: Cannot update other user\'s tasks' });
        }
      }
    }

    const { data, error } = await supabase
      .from('task')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle task completion status
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current task
    const { data: task, error: fetchError } = await supabase
      .from('task')
      .select('task_complete')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Toggle completion status
    const { data, error } = await supabase
      .from('task')
      .update({ task_complete: !task.task_complete })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task (protected - requires authentication)
router.delete('/:id', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Optional: Verify the task belongs to the authenticated user
    const sluggerUserId = req.user?.sub;
    
    if (sluggerUserId) {
      // Find user in database
      const { data: user } = await supabase
        .from('user')
        .select('id')
        .eq('slugger_user_id', sluggerUserId)
        .single();

      if (user) {
        // Verify task belongs to this user
        const { data: task } = await supabase
          .from('task')
          .select('user_id')
          .eq('id', id)
          .single();

        if (task && task.user_id !== user.id) {
          return res.status(403).json({ error: 'Forbidden: Cannot delete other user\'s tasks' });
        }
      }
    }

    const { error } = await supabase
      .from('task')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

