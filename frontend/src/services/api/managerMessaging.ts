import { supabase } from '../../utils/supabase/client';
import { isClubhouseManagerRole } from '../../utils/roles';

// ── Types (string UUIDs; message field kept as 'message' for Joey's UI) ────

export interface ManagerConversationSummary {
  id: string;
  created_at: string;
  conversation_type: 'direct' | 'group' | 'bulletin';
  name: string | null;
  other_manager_user_id: number | null;
  other_manager_name: string;
  unread_count: number;
}

export interface ManagerMessage {
  id: string;
  conversation_id: string;
  sender_user_id: number;
  message: string;
  created_at: string;
}

export interface ManagerConversationThread {
  conversation: ManagerConversationSummary;
  messages: ManagerMessage[];
}

export interface EligibleManager {
  id: number;
  user_name: string | null;
  user_team: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function assertUserIsClubhouseManager(userId: number): Promise<void> {
  const { data: user, error } = await supabase
    .from('user')
    .select('id, user_role')
    .eq('id', userId)
    .single();
  if (error || !user) throw new Error('Authentication required');
  if (!isClubhouseManagerRole(user.user_role)) {
    throw new Error('Only clubhouse managers can use messaging');
  }
}

async function getUnreadCount(conversationId: string, userId: number): Promise<number> {
  const { data: participation } = await supabase
    .from('conversation_participants')
    .select('last_read_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (!participation?.last_read_at) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);
    return count ?? 0;
  }

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .gt('created_at', participation.last_read_at);
  return count ?? 0;
}

async function buildSummary(
  conv: { id: string; created_at: string; type: string; name: string | null },
  currentUserId: number,
): Promise<ManagerConversationSummary> {
  const type = conv.type as 'direct' | 'group' | 'bulletin';
  let otherUserId: number | null = null;
  let displayName = conv.name ?? 'Conversation';

  if (type === 'direct') {
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conv.id);

    const other = (parts ?? []).find(p => p.user_id !== currentUserId);
    otherUserId = other?.user_id ?? null;

    if (otherUserId) {
      const { data: otherUser } = await supabase
        .from('user')
        .select('user_name')
        .eq('id', otherUserId)
        .single();
      displayName = otherUser?.user_name ?? `Manager #${otherUserId}`;
    }
  } else if (type === 'bulletin') {
    displayName = conv.name ?? 'Atlantic League Board';
  }

  const unread = await getUnreadCount(conv.id, currentUserId);

  return {
    id: conv.id,
    created_at: conv.created_at,
    conversation_type: type,
    name: conv.name,
    other_manager_user_id: otherUserId,
    other_manager_name: displayName,
    unread_count: unread,
  };
}

// ── API ────────────────────────────────────────────────────────────────────

export const managerMessagingApi = {
  listConversations: async (currentUserId: number): Promise<ManagerConversationSummary[]> => {
    await assertUserIsClubhouseManager(currentUserId);

    const { data: participations, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (error) throw new Error(error.message);
    if (!participations?.length) return [];

    const convIds = participations.map(p => p.conversation_id);

    const { data: conversations, error: cError } = await supabase
      .from('conversations')
      .select('id, created_at, type, name')
      .in('id', convIds)
      .order('created_at', { ascending: false });

    if (cError) throw new Error(cError.message);

    const summaries = await Promise.all(
      (conversations ?? []).map(conv => buildSummary(conv, currentUserId))
    );

    // Bulletin pinned first, then by recency
    return summaries.sort((a, b) => {
      if (a.conversation_type === 'bulletin') return -1;
      if (b.conversation_type === 'bulletin') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  },

  getConversationThread: async (
    currentUserId: number,
    conversationId: string,
  ): Promise<ManagerConversationThread> => {
    await assertUserIsClubhouseManager(currentUserId);

    const { data: conv, error: cError } = await supabase
      .from('conversations')
      .select('id, created_at, type, name')
      .eq('id', conversationId)
      .single();

    if (cError || !conv) throw new Error('Conversation not found');

    const summary = await buildSummary(conv, currentUserId);

    const { data: msgs, error: mError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_user_id, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (mError) throw new Error(mError.message);

    return {
      conversation: summary,
      messages: (msgs ?? []).map(m => ({
        id: m.id,
        conversation_id: m.conversation_id,
        sender_user_id: m.sender_user_id,
        message: m.content,
        created_at: m.created_at,
      })),
    };
  },

  searchEligibleManagers: async (
    currentUserId: number,
    searchTerm: string,
  ): Promise<EligibleManager[]> => {
    await assertUserIsClubhouseManager(currentUserId);

    const { data: users, error } = await supabase
      .from('user')
      .select('id, user_name, user_role, user_team')
      .ilike('user_role', '%manager%')
      .order('user_name', { ascending: true })
      .limit(50);

    if (error) throw new Error(error.message);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    return (users ?? [])
      .filter(u => isClubhouseManagerRole(u.user_role))
      .filter(u => u.id !== currentUserId)
      .filter(u => {
        if (!normalizedSearch) return true;
        return (u.user_name ?? '').toLowerCase().includes(normalizedSearch);
      })
      .map(u => ({ id: u.id, user_name: u.user_name, user_team: u.user_team }));
  },

  createConversation: async (
    currentUserId: number,
    otherManagerUserId: number,
  ): Promise<ManagerConversationSummary> => {
    await assertUserIsClubhouseManager(currentUserId);
    if (currentUserId === otherManagerUserId) {
      throw new Error('You cannot start a conversation with yourself');
    }

    // Check for existing direct conversation between these two users
    const { data: aConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    const { data: bConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherManagerUserId);

    const aIds = new Set((aConvs ?? []).map(r => r.conversation_id));
    const sharedIds = (bConvs ?? [])
      .map(r => r.conversation_id)
      .filter(id => aIds.has(id));

    if (sharedIds.length) {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id, created_at, type, name')
        .in('id', sharedIds)
        .eq('type', 'direct')
        .limit(1)
        .maybeSingle();
      if (existing) return buildSummary(existing, currentUserId);
    }

    const { data: conv, error: cError } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: currentUserId })
      .select('id, created_at, type, name')
      .single();
    if (cError) throw new Error(cError.message);

    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: currentUserId },
      { conversation_id: conv.id, user_id: otherManagerUserId },
    ]);

    return buildSummary(conv, currentUserId);
  },

  sendMessage: async (
    currentUserId: number,
    conversationId: string,
    messageText: string,
  ): Promise<ManagerMessage> => {
    await assertUserIsClubhouseManager(currentUserId);
    const trimmed = messageText.trim();
    if (!trimmed) throw new Error('Message cannot be empty');
    if (trimmed.length > 2000) throw new Error('Message cannot exceed 2000 characters');

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_user_id: currentUserId, content: trimmed })
      .select('id, conversation_id, sender_user_id, content, created_at')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to send message');

    return {
      id: data.id,
      conversation_id: data.conversation_id,
      sender_user_id: data.sender_user_id,
      message: data.content,
      created_at: data.created_at,
    };
  },

  markRead: async (conversationId: string, userId: number): Promise<void> => {
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  },
};
