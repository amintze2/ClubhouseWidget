import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Game } from '../types/db';
import { verifySluggerToken } from '../middleware/auth';

const router = Router();

// Get all games
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;

    // Fetch team names for each game
    if (data && data.length > 0) {
      const teamIds = new Set<number>();
      data.forEach(game => {
        teamIds.add(game.home_team_id);
        teamIds.add(game.away_team_id);
      });

      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name')
        .in('id', Array.from(teamIds));

      if (!teamsError && teams) {
        const teamsMap = new Map(teams.map(t => [t.id, t.team_name]));
        const gamesWithTeams = data.map(game => ({
          ...game,
          home_team_name: teamsMap.get(game.home_team_id),
          away_team_name: teamsMap.get(game.away_team_id),
        }));
        return res.json(gamesWithTeams);
      }
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single game by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Fetch team names
    const { data: homeTeam } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', data.home_team_id)
      .single();

    const { data: awayTeam } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', data.away_team_id)
      .single();

    res.json({
      ...data,
      home_team_name: homeTeam?.team_name,
      away_team_name: awayTeam?.team_name,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get games by date
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) throw error;

    // Fetch team names for each game
    if (data && data.length > 0) {
      const teamIds = new Set<number>();
      data.forEach(game => {
        teamIds.add(game.home_team_id);
        teamIds.add(game.away_team_id);
      });

      const { data: teams } = await supabase
        .from('teams')
        .select('id, team_name')
        .in('id', Array.from(teamIds));

      if (teams) {
        const teamsMap = new Map(teams.map(t => [t.id, t.team_name]));
        const gamesWithTeams = data.map(game => ({
          ...game,
          home_team_name: teamsMap.get(game.home_team_id),
          away_team_name: teamsMap.get(game.away_team_id),
        }));
        return res.json(gamesWithTeams);
      }
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get games by team ID (home or away)
router.get('/team/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;

    // Fetch team names for each game
    if (data && data.length > 0) {
      const teamIds = new Set<number>();
      data.forEach(game => {
        teamIds.add(game.home_team_id);
        teamIds.add(game.away_team_id);
      });

      const { data: teams } = await supabase
        .from('teams')
        .select('id, team_name')
        .in('id', Array.from(teamIds));

      if (teams) {
        const teamsMap = new Map(teams.map(t => [t.id, t.team_name]));
        const gamesWithTeams = data.map(game => ({
          ...game,
          home_team_name: teamsMap.get(game.home_team_id),
          away_team_name: teamsMap.get(game.away_team_id),
        }));
        return res.json(gamesWithTeams);
      }
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new game (protected - requires authentication)
router.post('/', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { home_team_id, away_team_id, date, time } = req.body;

    if (!home_team_id || !away_team_id) {
      return res.status(400).json({ error: 'home_team_id and away_team_id are required' });
    }

    if (home_team_id === away_team_id) {
      return res.status(400).json({ error: 'home_team_id and away_team_id must be different' });
    }

    // Verify both teams exist
    const { data: homeTeam, error: homeError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', home_team_id)
      .single();

    if (homeError || !homeTeam) {
      return res.status(404).json({ error: 'Home team not found' });
    }

    const { data: awayTeam, error: awayError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', away_team_id)
      .single();

    if (awayError || !awayTeam) {
      return res.status(404).json({ error: 'Away team not found' });
    }

    const gameData: Omit<Game, 'id' | 'created_at'> = {
      home_team_id: parseInt(home_team_id),
      away_team_id: parseInt(away_team_id),
      date: date || null,
      time: time || null,
    };

    const { data, error } = await supabase
      .from('games')
      .insert([gameData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a game (protected - requires authentication)
router.put('/:id', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<Omit<Game, 'id' | 'created_at'>> = req.body;

    // If updating team IDs, verify they're different
    if (updateData.home_team_id && updateData.away_team_id) {
      if (updateData.home_team_id === updateData.away_team_id) {
        return res.status(400).json({ error: 'home_team_id and away_team_id must be different' });
      }
    }

    // If updating team IDs, verify teams exist
    if (updateData.home_team_id) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', updateData.home_team_id)
        .single();

      if (teamError || !team) {
        return res.status(404).json({ error: 'Home team not found' });
      }
    }

    if (updateData.away_team_id) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', updateData.away_team_id)
        .single();

      if (teamError || !team) {
        return res.status(404).json({ error: 'Away team not found' });
      }
    }

    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a game (protected - requires authentication)
router.delete('/:id', verifySluggerToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('games')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

