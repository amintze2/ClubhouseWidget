import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { messagesApi, Message } from '../services/api/messages';

interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
}

export function useMessages(conversationId: string | null): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // 5.2 Fetch initial messages on mount / conversation change
  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const data = await messagesApi.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.error('useMessages: failed to load messages', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 5.3 + 5.4 Subscribe to realtime inserts; unsubscribe on cleanup
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Refetch with sender info rather than using raw payload
          try {
            const fullMessages = await messagesApi.getMessages(conversationId);
            setMessages(fullMessages);
          } catch {
            // fallback: append raw payload without sender info
            const raw = payload.new as Message;
            setMessages(prev => {
              if (prev.some(m => m.id === raw.id)) return prev;
              return [...prev, raw];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, loading };
}
