import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import type { ManagerConversationSummary, ManagerMessage } from '../../services/api';

interface ConversationThreadProps {
  currentUserId: number;
  conversation: ManagerConversationSummary | null;
  messages: ManagerMessage[];
  loading: boolean;
  loadError?: string;
  onSendMessage: (body: string) => Promise<void>;
}

export function ConversationThread({
  currentUserId,
  conversation,
  messages,
  loading,
  loadError,
  onSendMessage,
}: ConversationThreadProps) {
  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm font-medium">No conversation selected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a conversation from the sidebar or start a new DM.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-hidden">
      <ChatHeader conversation={conversation} />
      <div className="min-h-0 flex-1 overflow-hidden bg-muted/5">
        <MessageList
          currentUserId={currentUserId}
          conversation={conversation}
          messages={messages}
          loading={loading}
          loadError={loadError}
        />
      </div>
      <MessageComposer disabled={loading} onSendMessage={onSendMessage} />
    </div>
  );
}
