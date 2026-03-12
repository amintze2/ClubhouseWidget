import React from 'react';
import { useMessaging } from '../../contexts/MessagingContext';
import { ConversationWithMeta } from '../../services/api/messages';
import { cn } from '../ui/utils';

interface ConversationListProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: ConversationWithMeta;
  isActive: boolean;
  onSelect: () => void;
}) {
  const isBulletin = conversation.type === 'bulletin';

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-gray-50 transition-colors border-b border-gray-100',
        isActive && 'bg-blue-50 hover:bg-blue-50',
        isBulletin && 'bg-amber-50 hover:bg-amber-100'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-sm font-medium truncate', isBulletin && 'text-amber-800')}>
          {conversation.name ?? 'Direct Message'}
          {isBulletin && <span className="ml-1 text-[10px] font-normal text-amber-600 uppercase tracking-wide">Pinned</span>}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-gray-400">{formatTime(conversation.last_message_at)}</span>
          {conversation.unread_count > 0 && (
            <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
      {conversation.last_message && (
        <p className="text-xs text-gray-500 truncate">{conversation.last_message}</p>
      )}
      {!conversation.last_message && (
        <p className="text-xs text-gray-400 italic">No messages yet</p>
      )}
    </button>
  );
}

export function ConversationList({ activeConversationId, onSelectConversation }: ConversationListProps) {
  const { conversations } = useMessaging();

  if (conversations.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-400">
        No conversations yet.<br />Start one with the + button.
      </div>
    );
  }

  return (
    <div>
      {conversations.map(conv => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeConversationId}
          onSelect={() => onSelectConversation(conv.id)}
        />
      ))}
    </div>
  );
}
