-- ============================================================
-- DUES TABLES — Player Dues Budgeting Feature
-- ============================================================
-- dues_batch: one row per CM "send dues" action
-- dues: one row per player per batch
-- All writes are performed by serverless functions using the
-- service role key. Clients can only read (via RLS).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- dues_batch table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.dues_batch (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cm_user_id            bigint NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  visiting_team_id      bigint NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  amount_per_player     numeric(10, 2) NOT NULL DEFAULT 8.00,
  note                  text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dues_batch ENABLE ROW LEVEL SECURITY;

-- CMs can read only their own batches
CREATE POLICY "dues_batch: select own"
  ON public.dues_batch
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'sub')::bigint = cm_user_id);

-- No direct writes from authenticated role — service role only

-- ─────────────────────────────────────────────────────────────
-- dues table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.dues (
  id                          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id                    bigint NOT NULL REFERENCES public.dues_batch(id) ON DELETE CASCADE,
  cm_user_id                  bigint NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  player_user_id              bigint NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  amount                      numeric(10, 2) NOT NULL,
  status                      text NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'paid', 'cancelled')),
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  paid_at                     timestamptz,
  cancelled_at                timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dues ENABLE ROW LEVEL SECURITY;

-- CMs can read dues rows for their batches (cm_user_id matches)
CREATE POLICY "dues: select own as cm"
  ON public.dues
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'sub')::bigint = cm_user_id);

-- Players can read dues rows addressed to them
CREATE POLICY "dues: select own as player"
  ON public.dues
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'sub')::bigint = player_user_id);

-- No direct writes from authenticated role — service role only

-- ─────────────────────────────────────────────────────────────
-- Index for fast player dues lookups
-- ─────────────────────────────────────────────────────────────
CREATE INDEX dues_player_user_id_idx ON public.dues (player_user_id);
CREATE INDEX dues_cm_user_id_idx ON public.dues (cm_user_id);
CREATE INDEX dues_batch_cm_user_id_idx ON public.dues_batch (cm_user_id);
