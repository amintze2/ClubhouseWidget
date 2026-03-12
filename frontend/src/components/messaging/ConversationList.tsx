import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import type { ManagerConversationSummary } from '../../services/api';

interface ConversationListProps {
  conversations: ManagerConversationSummary[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

function formatConversationDate(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return '';
  const now = new Date();
  const isSameDay =
    parsed.getDate() === now.getDate() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  return parsed.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {conversations.length === 0 ? (
        <p className="px-2 py-2 text-sm text-muted-foreground">No conversations yet.</p>
      ) : (
        <ScrollArea className="h-full pr-1">
          <div className="space-y-2 p-1.5">
            {conversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const displayName = conversation.name ?? conversation.other_manager_name;
              const initial = displayName.charAt(0).toUpperCase();
              const isBulletin = conversation.conversation_type === 'bulletin';

              return (
                <Button
                  key={conversation.id}
                  type="button"
                  variant="ghost"
                  className={`h-auto w-full justify-start rounded-lg border border-transparent px-2.5 py-3 text-left ${
                    isSelected
                      ? 'border-blue-200 bg-accent'
                      : 'hover:bg-background/80'
                  } ${isBulletin ? 'bg-amber-50 hover:bg-amber-100 border-amber-200' : ''}`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="mr-2.5 flex w-10 shrink-0 justify-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      isBulletin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {initial}
                    </div>
                  </div>
                  <div className="flex w-full min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {isBulletin ? 'League bulletin board' : 'Direct message'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] text-muted-foreground">
                        {formatConversationDate(conversation.created_at)}
                      </span>
                      {conversation.unread_count > 0 && (
                        <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
