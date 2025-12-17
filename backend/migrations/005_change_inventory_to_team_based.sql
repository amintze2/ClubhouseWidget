-- Change inventory from user-based to team-based

-- Drop the old foreign key constraint and index
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_user_id_fkey;
DROP INDEX IF EXISTS idx_inventory_user_id;

-- Drop the user_id column
ALTER TABLE public.inventory DROP COLUMN IF EXISTS user_id;

-- Add team_id column
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS team_id bigint;

-- Add foreign key constraint to teams
ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_team_id ON public.inventory(team_id);

