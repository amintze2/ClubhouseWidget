## Why

Clubhouse managers across Atlantic League teams need to coordinate logistics (supplies, travel, equipment) with their counterparts on other teams, but currently have no in-app way to do so. Adding real-time messaging directly in the widget eliminates out-of-band coordination via text/email and keeps communication in context.

## What Changes

- New **Messages** tab added to the left sidebar (RoleSidebar) with an unread count badge
- Three conversation types: direct 1:1, team thread (all CMs of two teams), and a persistent league-wide bulletin board
- Real-time message delivery via Supabase Realtime subscriptions
- New CMs are auto-added to relevant conversations when assigned to a team (Supabase trigger)
- Three new database tables: `conversations`, `conversation_participants`, `messages`

## Capabilities

### New Capabilities

- `cm-messaging`: Real-time messaging between clubhouse managers across all 10 Atlantic League teams, including direct messages, team threads, and a league-wide bulletin board

### Modified Capabilities

- `navigation`: Add 'messages' to the View type and sidebar navigation with unread badge support

## Impact

- **New DB tables**: `conversations`, `conversation_participants`, `messages` with RLS policies and an auto-join trigger
- **New frontend service**: `frontend/src/services/api/messages.ts`
- **New context**: `frontend/src/contexts/MessagingContext.tsx` (global unread subscription)
- **New hook**: `frontend/src/hooks/useMessages.ts` (real-time active thread)
- **New components**: `MessagingView`, `ConversationList`, `MessageThread`, `MessageInput`, `NewConversationModal`
- **Modified**: `frontend/src/types/index.ts` (View union), `frontend/src/components/RoleSidebar.tsx` (new tab + badge)
- **Dependencies**: Supabase Realtime (already available), no new npm packages required
