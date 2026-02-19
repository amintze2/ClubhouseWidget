-- Add issues table for player issue reporting

CREATE TABLE IF NOT EXISTS public.issues (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  player_id bigint,
  player_team text,
  team_context text NOT NULL,
  away_team text,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT issues_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_issues_player_id ON public.issues(player_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at);
