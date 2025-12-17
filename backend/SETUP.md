# Environment Setup Guide

## Creating Your .env File

1. **Create the .env file** in the `backend` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Get your Supabase credentials**:
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project (or create a new one)
   - Navigate to **Settings** → **API**
   - You'll find:
     - **Project URL** - Copy this to `SUPABASE_URL`
     - **anon public** key - Copy this to `SUPABASE_ANON_KEY`

3. **Edit your .env file** with your actual credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   PORT=3001
   ```

## Common Issues

### Error: "Missing Supabase environment variables"
- Make sure your `.env` file is in the `backend` directory
- Check that the variable names are exactly: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Ensure there are no extra spaces or quotes around the values
- Make sure you've saved the `.env` file

### Error: "Invalid API key" or connection errors
- Verify your Supabase URL starts with `https://`
- Make sure you're using the **anon public** key, not the service role key
- Check that your Supabase project is active and not paused

### Error: "Cannot find module 'dotenv'"
- Run `npm install` in the backend directory to install dependencies

## Verifying Your Setup

After creating your `.env` file, test the connection:

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

Then visit `http://localhost:3001/health` in your browser or use curl:
```bash
curl http://localhost:3001/health
```

You should get a response like:
```json
{
  "status": "ok",
  "message": "Server and database are running",
  "timestamp": "2024-..."
}
```

