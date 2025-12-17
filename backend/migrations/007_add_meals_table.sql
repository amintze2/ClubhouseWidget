-- Add meals table and meal_id column to inventory table

-- Create meals table
CREATE TABLE IF NOT EXISTS public.meals (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  game_id bigint NOT NULL,
  meal_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meals_pkey PRIMARY KEY (id),
  CONSTRAINT meals_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_meals_game_id ON public.meals(game_id);

-- Add meal_id column to inventory table (optional/nullable)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS meal_id bigint;

-- Add foreign key constraint from inventory to meals
ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_meal_id_fkey 
FOREIGN KEY (meal_id) REFERENCES public.meals(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_meal_id ON public.inventory(meal_id);

