## 1. Database Migration

- [x] 1.1 Create `conversations` table with columns: id (uuid), type ('direct'|'group'|'bulletin'), name (text nullable), team_a_id (int nullable → teams), team_b_id (int nullable → teams), created_by (int nullable → user), created_at
- [x] 1.2 Create `conversation_participants` table with composite PK (conversation_id, user_id), last_read_at (timestamp), joined_at (timestamp)
- [x] 1.3 Create `messages` table with columns: id (uuid), conversation_id, sender_user_id, content (text), created_at
- [x] 1.4 Add RLS policies on all three tables (read/write gated to participants; mirror existing RLS identity pattern in the project)
- [x] 1.5 Write auto-join trigger function: on INSERT or UPDATE to `user` where user_team changes, add user to all conversations where team_a_id or team_b_id matches, and to the bulletin board
- [x] 1.6 Attach trigger to `user` table
- [x] 1.7 Seed the bulletin board: INSERT one bulletin conversation ('Atlantic League Board'), then INSERT all current users as participants (idempotent with ON CONFLICT DO NOTHING)

## 2. Supabase Types

- [x] 2.1 Regenerate TypeScript types via `supabase gen types typescript` and update the generated types file in the project

## 3. API Service

- [x] 3.1 Create `frontend/src/services/api/messages.ts` with types: `Conversation`, `ConversationParticipant`, `Message`, `ConversationWithLastMessage`
- [x] 3.2 Implement `messagesApi.getMyConversations(userId)` — fetch all conversations the user participates in, with last message preview and unread count
- [x] 3.3 Implement `messagesApi.getMessages(conversationId)` — fetch all messages for a conversation ordered by created_at
- [x] 3.4 Implement `messagesApi.sendMessage(conversationId, senderUserId, content)` — insert a new message
- [x] 3.5 Implement `messagesApi.findOrCreateDirect(userIdA, userIdB)` — check for existing direct conversation; create if not found
- [x] 3.6 Implement `messagesApi.findOrCreateTeamThread(teamAId, teamBId, createdBy)` — lookup by ordered team_a_id/team_b_id; create with all team members if not found
- [x] 3.7 Implement `messagesApi.markRead(conversationId, userId)` — update last_read_at to now
- [x] 3.8 Implement `messagesApi.getAllCMs()` — fetch all users with their team names (for contact picker)
- [x] 3.9 Export new API from `frontend/src/services/api/index.ts`

## 4. Global Messaging Context

- [x] 4.1 Create `frontend/src/contexts/MessagingContext.tsx` with provider that loads conversation list on mount
- [x] 4.2 Subscribe to `messages` INSERT via Supabase Realtime in MessagingContext; update unread count in state
- [x] 4.3 Expose `{ conversations, totalUnread, refreshConversations }` from context
- [x] 4.4 Wrap `<App />` (or `<AuthProvider>` children) with `<MessagingProvider>`

## 5. Real-time Hook

- [x] 5.1 Create `frontend/src/hooks/useMessages.ts` that accepts a `conversationId` and returns `{ messages, loading }`
- [x] 5.2 On mount, fetch initial messages via `messagesApi.getMessages`
- [x] 5.3 Subscribe to Supabase Realtime for new messages in the active conversation; append to state on INSERT
- [x] 5.4 Unsubscribe on unmount or when conversationId changes

## 6. Type and Navigation Updates

- [x] 6.1 Add `'messages'` to the `View` union type in `frontend/src/types/index.ts`
- [x] 6.2 Add Messages tab to `frontend/src/components/RoleSidebar.tsx` with an icon
- [x] 6.3 Read `totalUnread` from MessagingContext in RoleSidebar and display badge on Messages tab when > 0

## 7. MessagingView Shell

- [x] 7.1 Create `frontend/src/components/MessagingView.tsx` with two-panel layout: conversation list (left) and thread panel (right)
- [x] 7.2 Wire MessagingView into App.tsx view router for the `'messages'` view

## 8. ConversationList Component

- [x] 8.1 Create `frontend/src/components/messaging/ConversationList.tsx` that renders conversation list from MessagingContext
- [x] 8.2 Pin bulletin board conversation at the top; sort remaining by most recent message
- [x] 8.3 Show conversation name, last message preview, timestamp, and unread count badge per conversation
- [x] 8.4 Highlight selected conversation; call `messagesApi.markRead` on selection

## 9. MessageThread Component

- [x] 9.1 Create `frontend/src/components/messaging/MessageThread.tsx` that accepts a `conversationId` and uses `useMessages` hook
- [x] 9.2 Render message bubbles with sender name, team name, content, and timestamp
- [x] 9.3 Auto-scroll to bottom on new messages
- [x] 9.4 Show empty state when no conversation is selected

## 10. MessageInput Component

- [x] 10.1 Create `frontend/src/components/messaging/MessageInput.tsx` with a plain text textarea and send button
- [x] 10.2 Submit on Enter key (Shift+Enter for newline); disable send button when input is empty
- [x] 10.3 On send: call `messagesApi.sendMessage`, clear input

## 11. NewConversationModal

- [x] 11.1 Create `frontend/src/components/messaging/NewConversationModal.tsx` with two tabs: "Person" and "Team"
- [x] 11.2 "Person" tab: fetch all CMs via `messagesApi.getAllCMs()`, render searchable list grouped by team; on select, call `findOrCreateDirect` and open thread
- [x] 11.3 "Team" tab: show all 10 teams (excluding current user's team); on select, call `findOrCreateTeamThread` and open thread
- [x] 11.4 Wire "+ New Message" button in MessagingView to open the modal
