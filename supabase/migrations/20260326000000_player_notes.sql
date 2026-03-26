-- Add player_notes column to store dietary restrictions and other player preferences.
-- Stored as jsonb to allow flexible structure without additional schema changes.
ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS player_notes jsonb DEFAULT NULL;
