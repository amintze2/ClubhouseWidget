-- ============================================================
-- PAYMENT TABLES — Phase 3 Stripe Scaffolding
-- ============================================================
-- All tables have RLS enabled from creation.
-- Only the service role (webhook handler) may write to these tables.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- subscriptions table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id                        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id                   bigint NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  stripe_subscription_id    text UNIQUE NOT NULL,
  stripe_customer_id        text NOT NULL,
  status                    text NOT NULL,          -- active, canceled, past_due, trialing, etc.
  plan                      text,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Teams can read their own subscription
CREATE POLICY "subscriptions: select own team"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'team_id')::bigint = team_id);

-- No direct writes from authenticated role — service role only
-- (INSERT/UPDATE/DELETE are implicitly denied for authenticated role)

-- ─────────────────────────────────────────────────────────────
-- payments table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id                        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id                   bigint NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  stripe_invoice_id         text,
  stripe_payment_intent_id  text,
  amount                    numeric(10, 2) NOT NULL,
  currency                  text NOT NULL DEFAULT 'usd',
  status                    text NOT NULL,          -- succeeded, failed, pending
  created_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Teams can read their own payment history
CREATE POLICY "payments: select own team"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'team_id')::bigint = team_id);

-- No direct writes from authenticated role — service role only

-- ─────────────────────────────────────────────────────────────
-- audit_log table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type  text NOT NULL,
  team_id     bigint REFERENCES public.teams(id) ON DELETE SET NULL,
  user_id     bigint REFERENCES public."user"(id) ON DELETE SET NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for authenticated role (audit logs are internal)
-- Service role can insert via webhook handler

-- ─────────────────────────────────────────────────────────────
-- price_per_unit: integer → numeric(10,2)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.inventory
  ALTER COLUMN price_per_unit TYPE numeric(10, 2)
  USING price_per_unit::numeric(10, 2);
