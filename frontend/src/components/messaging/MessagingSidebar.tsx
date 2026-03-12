import { ConversationList } from './ConversationList';
import { NewConversationPicker } from './NewConversationPicker';
import type { ManagerConversationSummary } from '../../services/api';

interface MessagingSidebarProps {
  currentUserId: number;
  conversations: ManagerConversationSummary[];
  selectedConversationId: string | null;
  loadingConversations: boolean;
  conversationsError: string;
  onSelectConversation: (conversationId: string) => void;
  onStartConversation: (managerId: number) => Promise<void>;
}

export function MessagingSidebar({
  currentUserId,
  conversations,
  selectedConversationId,
  loadingConversations,
  conversationsError,
  onSelectConversation,
  onStartConversation,
}: MessagingSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r bg-muted/20">
      <div className="border-b px-3 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conversations
        </p>
      </div>

      <div className="border-b px-2.5 py-2.5">
        <NewConversationPicker
          currentUserId={currentUserId}
          onStartConversation={onStartConversation}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-1.5 py-1.5">
        {conversationsError ? (
          <p className="px-2 py-1 text-xs text-destructive">{conversationsError}</p>
        ) : loadingConversations ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">Loading conversations...</p>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={onSelectConversation}
          />
        )}
      </div>
    </aside>
  );
}
