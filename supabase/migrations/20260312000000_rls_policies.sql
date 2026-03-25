-- ============================================================
-- RLS POLICIES — Phase 1 Security Hardening
-- ============================================================
-- PREREQUISITE: The bootstrap serverless function must generate
-- a Supabase-compatible JWT containing:
--   sub       = dbUser.id::text          (internal app user ID)
--   team_id   = dbUser.user_team::bigint (NULL for unassigned users)
--   role      = 'authenticated'
-- The client must call supabase.auth.setSession({ access_token })
-- after bootstrap completes. These policies will not work with
-- the anon key alone.
-- ============================================================

-- Helper: extract app user ID from JWT sub claim
-- (auth.uid() returns UUID format; we use auth.jwt()->>'sub' for our bigint IDs)

-- ─────────────────────────────────────────────────────────────
-- user table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

-- Users can read their own row only
CREATE POLICY "user: select own row"
  ON public."user"
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'sub')::bigint = id);

-- Users can update their own row only
CREATE POLICY "user: update own row"
  ON public."user"
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'sub')::bigint = id)
  WITH CHECK ((auth.jwt() ->> 'sub')::bigint = id);

-- Inserts are blocked for authenticated role (service role handles upserts)
-- No INSERT policy for authenticated = inserts denied

-- ─────────────────────────────────────────────────────────────
-- task table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.task ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task: select own tasks"
  ON public.task
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'sub')::bigint = user_id);

CREATE POLICY "task: insert own tasks"
  ON public.task
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'sub')::bigint = user_id);

CREATE POLICY "task: update own tasks"
  ON public.task
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'sub')::bigint = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub')::bigint = user_id);

CREATE POLICY "task: delete own tasks"
  ON public.task
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'sub')::bigint = user_id);

-- ─────────────────────────────────────────────────────────────
-- inventory table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory: select own team"
  ON public.inventory
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'team_id')::bigint = team_id);

CREATE POLICY "inventory: insert own team"
  ON public.inventory
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'team_id')::bigint = team_id);

CREATE POLICY "inventory: update own team"
  ON public.inventory
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'team_id')::bigint = team_id)
  WITH CHECK ((auth.jwt() ->> 'team_id')::bigint = team_id);

CREATE POLICY "inventory: delete own team"
  ON public.inventory
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'team_id')::bigint = team_id);

-- ─────────────────────────────────────────────────────────────
-- conversations table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can only read conversations they participate in
CREATE POLICY "conversations: select own"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id
      FROM public.conversation_participants
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );

-- Users can create conversations (group and direct)
CREATE POLICY "conversations: insert"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'sub')::bigint = created_by);

-- ─────────────────────────────────────────────────────────────
-- conversation_participants table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Users can read participants for conversations they're in
CREATE POLICY "conversation_participants: select own"
  ON public.conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id
      FROM public.conversation_participants
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );

-- Users can insert participants (when creating conversations)
CREATE POLICY "conversation_participants: insert"
  ON public.conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id
      FROM public.conversations
      WHERE created_by = (auth.jwt() ->> 'sub')::bigint
    )
  );

-- Users can update their own participation (e.g., last_read_at)
CREATE POLICY "conversation_participants: update own"
  ON public.conversation_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::bigint)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::bigint);

-- ─────────────────────────────────────────────────────────────
-- messages table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages in conversations they participate in
CREATE POLICY "messages: select from own conversations"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id
      FROM public.conversation_participants
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );

-- Users can send messages to conversations they participate in
CREATE POLICY "messages: insert to own conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'sub')::bigint = sender_user_id
    AND conversation_id IN (
      SELECT conversation_id
      FROM public.conversation_participants
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );
