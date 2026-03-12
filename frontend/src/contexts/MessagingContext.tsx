import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { messagesApi, ConversationWithMeta } from '../services/api/messages';

interface MessagingContextType {
  conversations: ConversationWithMeta[];
  totalUnread: number;
  refreshConversations: () => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessaging must be used within MessagingProvider');
  return ctx;
};

interface MessagingProviderProps {
  userId: number | null;
  children: ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ userId, children }) => {
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await messagesApi.getMyConversations(userId);
      setConversations(data);
    } catch (err) {
      console.error('MessagingContext: failed to load conversations', err);
    }
  }, [userId]);

  // Load on mount / userId change
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Global realtime subscription: listen for new messages in any of the user's conversations
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`global-messages-user-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          // Refresh conversation list to get updated unread counts and last message
          refreshConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshConversations]);

  return (
    <MessagingContext.Provider value={{ conversations, totalUnread, refreshConversations }}>
      {children}
    </MessagingContext.Provider>
  );
};
