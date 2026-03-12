## Context

The Clubhouse Widget is a React + TypeScript frontend deployed to Vercel, calling Supabase directly for all data. Auth is handled via the Slugger iframe bootstrap flow. There are currently 10 Atlantic League teams in the DB, each with one or more clubhouse managers (CMs) identified by `user_role` and `user_team` foreign key.

There is no existing messaging infrastructure. Supabase Realtime (postgres_changes) is available and already part of the stack via the supabase-js client.

## Goals / Non-Goals

**Goals:**
- Real-time 1:1 direct messaging between any two CMs
- Team thread conversations (all CMs of two teams in one thread, deduplicated)
- Persistent league-wide bulletin board (all 10 teams' CMs, pinned)
- Unread badge on sidebar tab, visible from any view in the app
- New CMs auto-join relevant conversations when assigned to a team
- Messages persist indefinitely

**Non-Goals:**
- File/image attachments
- Message editing or deletion
- Read receipts per-user (last_read_at per conversation is sufficient)
- Push notifications (in-app badge only)
- Moderation or admin controls
- Message search

## Decisions

### D1: Three conversation types in one table (`direct | group | bulletin`)

**Decision**: Single `conversations` table with a `type` discriminator, rather than separate tables per type.

**Rationale**: All three types share the same participant and message model. A single table simplifies queries, RLS policies, and the API service. The `bulletin` type is just a `group` with a system seed — no structural difference.

**Alternative considered**: Separate `direct_messages` and `group_chats` tables. Rejected — doubles the RLS surface area and requires the UI to fan out queries.

---

### D2: Team thread deduplication via `team_a_id / team_b_id` columns

**Decision**: Store `team_a_id` (lower) and `team_b_id` (higher) on group conversations to enable unique lookup of the canonical thread between two teams.

**Rationale**: Without this, creating a "message the Cubs" conversation would risk duplicate threads. With it, the API does a single `SELECT WHERE team_a_id = X AND team_b_id = Y` before creating.

**Alternative considered**: Dedup by comparing sorted participant sets. Rejected — expensive as team rosters grow, and fragile when roster changes occur between thread creation and lookup.

---

### D3: Dynamic team membership via Supabase database trigger

**Decision**: A `AFTER INSERT OR UPDATE ON user` trigger auto-inserts rows into `conversation_participants` when `user_team` is set.

**Rationale**: Keeps team thread membership current without requiring app-level logic on every user update path. The trigger fires on `user_team` changes, adds the user to all conversations where `team_a_id = user_team OR team_b_id = user_team`, and always adds to the bulletin board.

**Alternative considered**: App-level upsert in `userApi`. Rejected — would require every code path that sets `user_team` to also manage participants, which is fragile.

---

### D4: Global MessagingContext for unread count

**Decision**: A `MessagingContext` provider wraps the app and subscribes to `messages INSERT` on mount. It tracks unread count across all conversations using `last_read_at` from `conversation_participants`.

**Rationale**: The sidebar unread badge must be live even when the user is on the checklist or inventory view. A context-level subscription is the cleanest way to achieve this without prop-drilling or polling.

**Alternative considered**: Poll every 30s for unread count. Rejected — adds latency and unnecessary DB load when Realtime is already available.

---

### D5: Supabase Realtime (postgres_changes) over a custom websocket

**Decision**: Use Supabase's built-in `postgres_changes` subscriptions.

**Rationale**: Already available via `supabase-js`. No new infrastructure, no new npm packages, consistent with the existing Supabase-first pattern in the codebase.

---

### D6: No new npm packages

**Decision**: Implement message UI with existing Tailwind + Radix UI (shadcn/ui) primitives already in the project.

**Rationale**: The design is simple (text list + input). Adding a messaging library (e.g., Stream Chat) would be overkill and introduce a vendor dependency.

## Risks / Trade-offs

- **Realtime connection limit**: Supabase free/pro tiers have concurrent Realtime connection limits. With 10 teams and potentially multiple CMs each, this is unlikely to be an issue in the near term. → Mitigation: monitor in Supabase dashboard; upgrade tier if needed.

- **Trigger complexity**: The auto-join trigger must handle both INSERT (new user) and UPDATE (user changes teams) on the `user` table. An UPDATE that changes `user_team` should add to new team's threads but NOT remove from old team's threads (to preserve history). → Mitigation: trigger only does INSERT INTO conversation_participants, never DELETE.

- **Bulletin board seed**: The bulletin board conversation must be seeded once, with all existing users added as participants. New users are handled by the trigger. → Mitigation: include seed SQL in the migration; make it idempotent with ON CONFLICT DO NOTHING.

- **RLS policy correctness**: Incorrect RLS on `messages` could leak cross-team messages. → Mitigation: explicit policy test in migration — user can only SELECT messages WHERE conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()... but note: auth.uid() is Supabase auth UUID, while our user.id is an integer with slugger_user_id as the auth bridge. RLS must use a helper function or join to resolve the current user's integer id from their JWT.

- **Auth/RLS mismatch**: The app uses `slugger_user_id` as the auth identity; Supabase RLS uses `auth.uid()`. The existing tables likely have RLS policies that handle this already (or bypass via service role in serverless functions). → Mitigation: audit existing RLS approach before writing new policies; mirror the existing pattern.

## Migration Plan

1. Apply DB migration: create `conversations`, `conversation_participants`, `messages` tables
2. Apply RLS policies (mirror existing pattern in the project)
3. Create auto-join trigger function + trigger on `user` table
4. Seed bulletin board: INSERT bulletin conversation, INSERT all current users as participants
5. Regenerate Supabase TypeScript types (`supabase gen types typescript`)
6. Deploy frontend changes (new context, hook, components, sidebar update)
7. No rollback complexity — new tables, no changes to existing data

## Open Questions

- What is the existing RLS pattern for user identity resolution (`auth.uid()` → `user.id`)? Needs to be confirmed before writing policies.
