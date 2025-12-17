import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { supabase } from './config/supabase';
import usersRouter from './routes/users';
import inventoryRouter from './routes/inventory';
import tasksRouter from './routes/tasks';
import teamsRouter from './routes/teams';
import gamesRouter from './routes/games';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('user').select('count').limit(1);
    
    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      });
    }
    
    res.json({ 
      status: 'ok', 
      message: 'Server and database are running',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error',
      error: err.message 
    });
  }
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/games', gamesRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Clubhouse Widget Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      inventory: '/api/inventory',
      tasks: '/api/tasks',
      teams: '/api/teams',
      games: '/api/games',
    },
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
    console.log(`📦 Inventory API: http://localhost:${PORT}/api/inventory`);
    console.log(`✅ Tasks API: http://localhost:${PORT}/api/tasks`);
    console.log(`🏆 Teams API: http://localhost:${PORT}/api/teams`);
    console.log(`⚽ Games API: http://localhost:${PORT}/api/games`);
  });
}

export { app, supabase };

