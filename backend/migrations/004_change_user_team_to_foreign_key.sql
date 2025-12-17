-- Change user_team from text to foreign key reference to teams table

-- First, we need to handle existing data if any
-- Option 1: If you have existing text values in user_team that need to be migrated to team IDs
-- You would need to map them manually or set them to NULL
-- For now, we'll set all existing user_team values to NULL before changing the column type

-- Set existing user_team text values to NULL (since we can't automatically map text to IDs)
-- Uncomment the line below if you want to clear existing data:
-- UPDATE public."user" SET user_team = NULL WHERE user_team IS NOT NULL;

-- Drop the column (if it exists)
ALTER TABLE public."user" DROP COLUMN IF EXISTS user_team;

-- Add the new column as bigint (matching teams.id type)
ALTER TABLE public."user" ADD COLUMN user_team bigint;

-- Add foreign key constraint
ALTER TABLE public."user" 
ADD CONSTRAINT user_team_fkey 
FOREIGN KEY (user_team) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_team_id ON public."user"(user_team);

