import { useEffect, useRef } from 'react';
import type { ManagerConversationSummary, ManagerMessage } from '../../services/api';

interface MessageListProps {
  currentUserId: number;
  conversation: ManagerConversationSummary;
  messages: ManagerMessage[];
  loading: boolean;
  loadError?: string;
}

function formatMessageTime(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function MessageList({
  currentUserId,
  conversation,
  messages,
  loading,
  loadError,
}: MessageListProps) {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages, conversation.id]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex h-full min-w-0 flex-col overflow-x-hidden overflow-y-auto px-4 pt-4 pb-3"
    >
      {loadError ? (
        <div className="flex min-h-full flex-1 items-center">
          <p className="text-sm text-destructive">{loadError}</p>
        </div>
      ) : loading ? (
        <div className="flex min-h-full flex-1 items-center">
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex min-h-full flex-1 items-end">
          <p className="pb-1 text-sm text-muted-foreground">No messages yet. Say hello.</p>
        </div>
      ) : (
        <div className="mt-auto flex min-h-full w-full min-w-0 flex-col justify-end gap-1.5">
          {messages.map((message) => {
            const isCurrentUser =
              Number(message.sender_user_id) === Number(currentUserId);

            return (
              <div key={message.id} className="w-full min-w-0 overflow-hidden">
                <div
                  className={`w-fit max-w-[62%] min-w-0 overflow-hidden rounded-2xl px-2.5 py-1.5 text-sm ${
                    isCurrentUser ? 'ml-auto' : 'mr-auto'
                  } ${
                    isCurrentUser
                      ? 'rounded-br-md bg-blue-600 text-white'
                      : 'rounded-bl-md border bg-background text-foreground'
                  }`}
                >
                  <p
                    className="max-w-full whitespace-pre-wrap break-words"
                    style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                  >
                    {message.message}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      isCurrentUser ? 'text-blue-100/90' : 'text-muted-foreground'
                    }`}
                  >
                    {isCurrentUser ? 'You' : conversation.other_manager_name} -{' '}
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
