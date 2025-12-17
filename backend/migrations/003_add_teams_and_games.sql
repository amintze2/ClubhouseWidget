-- Add teams and games tables

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  team_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id)
);

-- Create games table (references teams)
CREATE TABLE IF NOT EXISTS public.games (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  home_team_id bigint NOT NULL,
  away_team_id bigint NOT NULL,
  date date,
  time time,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_home_team_id_fkey FOREIGN KEY (home_team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT games_away_team_id_fkey FOREIGN KEY (away_team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT games_different_teams CHECK (home_team_id != away_team_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_home_team_id ON public.games(home_team_id);
CREATE INDEX IF NOT EXISTS idx_games_away_team_id ON public.games(away_team_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON public.games(date);

