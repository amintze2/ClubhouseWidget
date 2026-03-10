import { supabase } from '../../utils/supabase/client';
import { isClubhouseManagerRole } from '../../utils/roles';

interface ManagerConversationRow {
  id: number;
  created_at: string;
  manager_1_user_id: number;
  manager_2_user_id: number;
}

interface ManagerMessageRow {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  message: string;
  created_at: string;
}

interface ManagerUserRow {
  id: number;
  user_name: string | null;
  user_role: string | null;
  user_team: number | null;
}

export interface ManagerConversationSummary {
  id: number;
  created_at: string;
  manager_1_user_id: number;
  manager_2_user_id: number;
  other_manager_user_id: number;
  other_manager_name: string;
}

export interface ManagerMessage {
  id: number;
  conversation_id: number;
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

function mapConversation(
  conversation: ManagerConversationRow,
  currentUserId: number,
  usersById: Map<number, ManagerUserRow>,
): ManagerConversationSummary {
  const otherManagerUserId =
    conversation.manager_1_user_id === currentUserId
      ? conversation.manager_2_user_id
      : conversation.manager_1_user_id;
  const otherUser = usersById.get(otherManagerUserId);

  return {
    ...conversation,
    other_manager_user_id: otherManagerUserId,
    other_manager_name: otherUser?.user_name || `Manager #${otherManagerUserId}`,
  };
}

async function assertUserIsClubhouseManager(userId: number): Promise<void> {
  const { data: user, error } = await supabase
    .from('user')
    .select('id, user_role')
    .eq('id', userId)
    .single();

  if (error || !user) throw new Error('Authentication required');
  if (!isClubhouseManagerRole(user.user_role)) {
    throw new Error('Only clubhouse managers can use direct messaging');
  }
}

async function fetchUsersByIds(userIds: number[]): Promise<Map<number, ManagerUserRow>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('user')
    .select('id, user_name, user_role, user_team')
    .in('id', userIds);

  if (error) throw new Error(error.message);

  const userMap = new Map<number, ManagerUserRow>();
  (data || []).forEach((user) => userMap.set(user.id, user));
  return userMap;
}

async function fetchConversationById(conversationId: number): Promise<ManagerConversationRow> {
  const { data, error } = await supabase
    .from('manager_conversations')
    .select('id, created_at, manager_1_user_id, manager_2_user_id')
    .eq('id', conversationId)
    .single();

  if (error || !data) throw new Error('Conversation not found');
  return data as ManagerConversationRow;
}

async function assertConversationParticipant(
  conversationId: number,
  currentUserId: number,
): Promise<ManagerConversationRow> {
  const conversation = await fetchConversationById(conversationId);
  const isParticipant =
    conversation.manager_1_user_id === currentUserId ||
    conversation.manager_2_user_id === currentUserId;

  if (!isParticipant) {
    throw new Error('Not authorized to access this conversation');
  }

  return conversation;
}

async function getExistingConversation(
  managerAUserId: number,
  managerBUserId: number,
): Promise<ManagerConversationRow | null> {
  const { data, error } = await supabase
    .from('manager_conversations')
    .select('id, created_at, manager_1_user_id, manager_2_user_id')
    .or(
      `and(manager_1_user_id.eq.${managerAUserId},manager_2_user_id.eq.${managerBUserId}),and(manager_1_user_id.eq.${managerBUserId},manager_2_user_id.eq.${managerAUserId})`,
    )
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as ManagerConversationRow | null) ?? null;
}

export const managerMessagingApi = {
  listConversations: async (currentUserId: number): Promise<ManagerConversationSummary[]> => {
    await assertUserIsClubhouseManager(currentUserId);

    const { data: conversations, error } = await supabase
      .from('manager_conversations')
      .select('id, created_at, manager_1_user_id, manager_2_user_id')
      .or(`manager_1_user_id.eq.${currentUserId},manager_2_user_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const rows = (conversations || []) as ManagerConversationRow[];
    const participantIds = Array.from(
      new Set(rows.flatMap((row) => [row.manager_1_user_id, row.manager_2_user_id])),
    );
    const usersById = await fetchUsersByIds(participantIds);

    return rows.map((row) => mapConversation(row, currentUserId, usersById));
  },

  getConversationThread: async (
    currentUserId: number,
    conversationId: number,
  ): Promise<ManagerConversationThread> => {
    await assertUserIsClubhouseManager(currentUserId);
    const conversation = await assertConversationParticipant(conversationId, currentUserId);

    const usersById = await fetchUsersByIds([
      conversation.manager_1_user_id,
      conversation.manager_2_user_id,
    ]);
    const summary = mapConversation(conversation, currentUserId, usersById);

    const { data: messages, error } = await supabase
      .from('manager_messages')
      .select('id, conversation_id, sender_user_id, message, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return {
      conversation: summary,
      messages: (messages || []) as ManagerMessageRow[],
    };
  },

  searchEligibleManagers: async (
    currentUserId: number,
    searchTerm: string,
  ): Promise<EligibleManager[]> => {
    await assertUserIsClubhouseManager(currentUserId);

    const { data: conversations, error: conversationsError } = await supabase
      .from('manager_conversations')
      .select('manager_1_user_id, manager_2_user_id')
      .or(`manager_1_user_id.eq.${currentUserId},manager_2_user_id.eq.${currentUserId}`);

    if (conversationsError) throw new Error(conversationsError.message);

    const excludedManagerIds = new Set<number>([currentUserId]);
    (conversations || []).forEach((conversation) => {
      excludedManagerIds.add(conversation.manager_1_user_id);
      excludedManagerIds.add(conversation.manager_2_user_id);
    });

    const { data: users, error } = await supabase
      .from('user')
      .select('id, user_name, user_role, user_team')
      .ilike('user_role', '%manager%')
      .order('user_name', { ascending: true })
      .limit(50);

    if (error) throw new Error(error.message);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    return ((users || []) as ManagerUserRow[])
      .filter((user) => isClubhouseManagerRole(user.user_role))
      .filter((user) => !excludedManagerIds.has(user.id))
      .filter((user) => {
        if (!normalizedSearch) return true;
        return (user.user_name || '').toLowerCase().includes(normalizedSearch);
      })
      .map((user) => ({
        id: user.id,
        user_name: user.user_name,
        user_team: user.user_team,
      }));
  },

  createConversation: async (
    currentUserId: number,
    otherManagerUserId: number,
  ): Promise<ManagerConversationSummary> => {
    await assertUserIsClubhouseManager(currentUserId);

    if (currentUserId === otherManagerUserId) {
      throw new Error('You cannot start a conversation with yourself');
    }

    const usersById = await fetchUsersByIds([currentUserId, otherManagerUserId]);
    const otherManager = usersById.get(otherManagerUserId);

    if (!otherManager) throw new Error('Manager not found');
    if (!isClubhouseManagerRole(otherManager.user_role)) {
      throw new Error('Only clubhouse managers can be added to direct messages');
    }

    const existing = await getExistingConversation(currentUserId, otherManagerUserId);
    if (existing) return mapConversation(existing, currentUserId, usersById);

    const managerOneUserId = Math.min(currentUserId, otherManagerUserId);
    const managerTwoUserId = Math.max(currentUserId, otherManagerUserId);

    const { data, error } = await supabase
      .from('manager_conversations')
      .insert([
        {
          manager_1_user_id: managerOneUserId,
          manager_2_user_id: managerTwoUserId,
        },
      ])
      .select('id, created_at, manager_1_user_id, manager_2_user_id')
      .single();

    if (error) {
      // Handle race with unique conversation constraint.
      if (error.code === '23505') {
        const concurrent = await getExistingConversation(currentUserId, otherManagerUserId);
        if (concurrent) return mapConversation(concurrent, currentUserId, usersById);
      }
      throw new Error(error.message);
    }

    if (!data) throw new Error('Failed to create conversation');
    return mapConversation(data as ManagerConversationRow, currentUserId, usersById);
  },

  sendMessage: async (
    currentUserId: number,
    conversationId: number,
    messageText: string,
  ): Promise<ManagerMessage> => {
    await assertUserIsClubhouseManager(currentUserId);
    await assertConversationParticipant(conversationId, currentUserId);

    const trimmed = messageText.trim();
    if (!trimmed) throw new Error('Message cannot be empty');
    if (trimmed.length > 2000) throw new Error('Message cannot exceed 2000 characters');

    const { data, error } = await supabase
      .from('manager_messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_user_id: currentUserId,
          message: trimmed,
        },
      ])
      .select('id, conversation_id, sender_user_id, message, created_at')
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to send message');
    return data as ManagerMessage;
  },
};

