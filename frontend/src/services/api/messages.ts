import { supabase } from '../../utils/supabase/client';
import type { User } from './users';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'bulletin';
  name: string | null;
  team_a_id: number | null;
  team_b_id: number | null;
  created_by: number | null;
  created_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: number;
  last_read_at: string | null;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: number;
  content: string;
  created_at: string;
  // joined from user + teams
  sender_name?: string;
  sender_team?: string;
}

export interface ConversationWithMeta extends Conversation {
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  participant_names?: string[];
}

export interface CMUser extends Pick<User, 'id' | 'user_name' | 'user_team'> {
  team_name: string | null;
}

// ── API ────────────────────────────────────────────────────────────────────

export const messagesApi = {
  // 3.2 Fetch all conversations for a user with last message + unread count
  getMyConversations: async (userId: number): Promise<ConversationWithMeta[]> => {
    // Get conversation IDs the user participates in, with last_read_at
    const { data: participations, error: pError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (pError) throw new Error(pError.message);
    if (!participations?.length) return [];

    const convIds = participations.map(p => p.conversation_id);
    const lastReadMap = new Map(participations.map(p => [p.conversation_id, p.last_read_at]));

    // Fetch conversations
    const { data: conversations, error: cError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds);

    if (cError) throw new Error(cError.message);
    if (!conversations?.length) return [];

    // Fetch last message and unread count for each conversation
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const lastRead = lastReadMap.get(conv.id) ?? null;

        const { data: lastMsgRows } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMsg = lastMsgRows?.[0] ?? null;

        let unreadCount = 0;
        if (lastRead) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .gt('created_at', lastRead);
          unreadCount = count ?? 0;
        } else if (lastMsg) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);
          unreadCount = count ?? 0;
        }

        return {
          ...conv,
          type: conv.type as 'direct' | 'group' | 'bulletin',
          last_message: lastMsg?.content ?? null,
          last_message_at: lastMsg?.created_at ?? null,
          unread_count: unreadCount,
        } as ConversationWithMeta;
      })
    );

    // Bulletin pinned first, then sort by last_message_at desc
    return enriched.sort((a, b) => {
      if (a.type === 'bulletin') return -1;
      if (b.type === 'bulletin') return 1;
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
  },

  // 3.3 Fetch all messages for a conversation with sender info
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_user_id,
        content,
        created_at,
        user:sender_user_id (
          user_name,
          user_team,
          teams:user_team ( team_name )
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      sender_user_id: row.sender_user_id,
      content: row.content,
      created_at: row.created_at,
      sender_name: row.user?.user_name ?? 'Unknown',
      sender_team: row.user?.teams?.team_name ?? null,
    }));
  },

  // 3.4 Send a message
  sendMessage: async (
    conversationId: string,
    senderUserId: number,
    content: string
  ): Promise<Message> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_user_id: senderUserId, content })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Message;
  },

  // 3.5 Find or create a direct (1:1) conversation
  findOrCreateDirect: async (userIdA: number, userIdB: number): Promise<Conversation> => {
    // Find a conversation where both users are participants and type = 'direct'
    const { data: aConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userIdA);

    const { data: bConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userIdB);

    const aIds = new Set((aConvs ?? []).map(r => r.conversation_id));
    const sharedIds = (bConvs ?? [])
      .map(r => r.conversation_id)
      .filter(id => aIds.has(id));

    if (sharedIds.length) {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .in('id', sharedIds)
        .eq('type', 'direct')
        .limit(1)
        .single();
      if (existing) return existing as Conversation;
    }

    // Create new direct conversation
    const { data: conv, error: cError } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: userIdA })
      .select()
      .single();
    if (cError) throw new Error(cError.message);

    const { error: pError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conv.id, user_id: userIdA },
        { conversation_id: conv.id, user_id: userIdB },
      ]);
    if (pError) throw new Error(pError.message);

    return conv as Conversation;
  },

  // 3.6 Find or create a team thread (group) conversation
  findOrCreateTeamThread: async (
    teamAId: number,
    teamBId: number,
    createdBy: number
  ): Promise<Conversation> => {
    const [loId, hiId] = teamAId < teamBId ? [teamAId, teamBId] : [teamBId, teamAId];

    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('type', 'group')
      .eq('team_a_id', loId)
      .eq('team_b_id', hiId)
      .limit(1)
      .maybeSingle();

    if (existing) return existing as Conversation;

    // Get all CMs from both teams
    const { data: teamUsers, error: uError } = await supabase
      .from('user')
      .select('id')
      .in('user_team', [loId, hiId]);
    if (uError) throw new Error(uError.message);

    // Derive conversation name from teams
    const { data: teamRows } = await supabase
      .from('teams')
      .select('id, team_name')
      .in('id', [loId, hiId]);
    const nameA = teamRows?.find(t => t.id === loId)?.team_name ?? 'Team A';
    const nameB = teamRows?.find(t => t.id === hiId)?.team_name ?? 'Team B';

    const { data: conv, error: cError } = await supabase
      .from('conversations')
      .insert({ type: 'group', name: `${nameA} ↔ ${nameB}`, team_a_id: loId, team_b_id: hiId, created_by: createdBy })
      .select()
      .single();
    if (cError) throw new Error(cError.message);

    const participants = (teamUsers ?? []).map(u => ({
      conversation_id: conv.id,
      user_id: u.id,
    }));
    if (participants.length) {
      const { error: pError } = await supabase
        .from('conversation_participants')
        .insert(participants);
      if (pError) throw new Error(pError.message);
    }

    return conv as Conversation;
  },

  // 3.7 Mark a conversation as read for a user
  markRead: async (conversationId: string, userId: number): Promise<void> => {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  // 3.8 Fetch all CMs across all teams (for contact picker)
  getAllCMs: async (): Promise<CMUser[]> => {
    const { data, error } = await supabase
      .from('user')
      .select(`
        id,
        user_name,
        user_team,
        teams:user_team ( team_name )
      `)
      .not('user_team', 'is', null);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      user_name: row.user_name,
      user_team: row.user_team,
      team_name: row.teams?.team_name ?? null,
    }));
  },
};
