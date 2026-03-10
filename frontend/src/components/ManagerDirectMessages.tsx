import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  managerMessagingApi,
  type ManagerConversationSummary,
  type ManagerMessage,
} from '../services/api';
import { isClubhouseManagerRole } from '../utils/roles';
import { ConversationThread } from './messaging/ConversationThread';
import { MessagingSidebar } from './messaging/MessagingSidebar';

export function ManagerDirectMessages() {
  const { user } = useAuth();
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [conversationsError, setConversationsError] = useState('');
  const [threadError, setThreadError] = useState('');
  const [conversations, setConversations] = useState<ManagerConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ManagerConversationSummary | null>(null);
  const [messages, setMessages] = useState<ManagerMessage[]>([]);

  const currentUserId = user?.id ?? null;
  const isClubhouseManager = isClubhouseManagerRole(user?.user_role);

  const selectedConversationFromList = useMemo(
    () =>
      selectedConversationId === null
        ? null
        : conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    if (!currentUserId || !isClubhouseManager) {
      setLoadingConversations(false);
      return;
    }

    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        setConversationsError('');
        const data = await managerMessagingApi.listConversations(currentUserId);
        setConversations(data);
        if (data.length > 0) {
          setSelectedConversationId((current) => current ?? data[0].id);
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Failed to load conversations';
        setConversationsError(message);
      } finally {
        setLoadingConversations(false);
      }
    };

    loadConversations();
  }, [currentUserId, isClubhouseManager]);

  useEffect(() => {
    if (!currentUserId || !selectedConversationId || !isClubhouseManager) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    const loadThread = async () => {
      try {
        setLoadingThread(true);
        setThreadError('');
        const thread = await managerMessagingApi.getConversationThread(
          currentUserId,
          selectedConversationId,
        );
        setSelectedConversation(thread.conversation);
        setMessages(thread.messages);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load thread';
        setThreadError(message);
      } finally {
        setLoadingThread(false);
      }
    };

    loadThread();
  }, [currentUserId, isClubhouseManager, selectedConversationId]);

  const handleStartConversation = async (managerId: number) => {
    if (!currentUserId) return;

    const conversation = await managerMessagingApi.createConversation(currentUserId, managerId);
    setConversations((previous) => {
      const alreadyExists = previous.some((item) => item.id === conversation.id);
      if (alreadyExists) return previous;
      return [conversation, ...previous];
    });
    setSelectedConversationId(conversation.id);
  };

  const handleSendMessage = async (body: string) => {
    if (!currentUserId || !selectedConversationId) return;

    const newMessage = await managerMessagingApi.sendMessage(
      currentUserId,
      selectedConversationId,
      body,
    );
    setMessages((previous) => [...previous, newMessage]);
  };

  if (!isClubhouseManager) {
    return (
      <div className="rounded-md border bg-background px-4 py-3 text-sm text-muted-foreground">
        Direct messages are only available to clubhouse managers.
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="rounded-md border bg-background px-4 py-3 text-sm text-muted-foreground">
        Sign in to access direct messages.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0">
        <h2 className="text-xl font-semibold">Direct Messages</h2>
      </div>

      <div className="min-h-[70vh] min-w-0 flex-1 overflow-hidden rounded-lg border bg-background xl:min-h-0">
        <div className="flex h-full min-h-0">
          <div className="h-full w-[200px] shrink-0">
            <MessagingSidebar
              currentUserId={currentUserId}
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              loadingConversations={loadingConversations}
              conversationsError={conversationsError}
              onSelectConversation={setSelectedConversationId}
              onStartConversation={handleStartConversation}
            />
          </div>

          <main className="min-h-0 min-w-0 flex-1 bg-background">
            <ConversationThread
              currentUserId={currentUserId}
              conversation={selectedConversation || selectedConversationFromList}
              messages={messages}
              loading={loadingThread}
              loadError={threadError}
              onSendMessage={handleSendMessage}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
