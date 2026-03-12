import React, { useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { messagesApi } from '../../services/api/messages';
import { useAuth } from '../../contexts/AuthContext';
import { MessageInput } from './MessageInput';
import { MessageSquare } from 'lucide-react';

interface MessageThreadProps {
  conversationId: string | null;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const { user: backendUser } = useAuth();
  const { messages, loading } = useMessages(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!conversationId || !backendUser?.id) return;
    await messagesApi.sendMessage(conversationId, backendUser.id, content);
  };

  // Empty state: no conversation selected
  if (!conversationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-gray-400 gap-3 h-full">
        <MessageSquare className="h-10 w-10 opacity-30" />
        <p className="text-sm">Select a conversation or start a new one</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="text-center text-sm text-gray-400 py-8">Loading messages…</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_user_id === backendUser?.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
            >
              {!isOwn && (
                <span className="text-[11px] text-gray-500 px-1">
                  {msg.sender_name ?? 'Unknown'}
                  {msg.sender_team ? ` · ${msg.sender_team}` : ''}
                </span>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-400 px-1">
                {formatTimestamp(msg.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={!backendUser?.id} />
    </div>
  );
}
