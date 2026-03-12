import React, { useState } from 'react';
import { ConversationList } from './messaging/ConversationList';
import { MessageThread } from './messaging/MessageThread';
import { NewConversationModal } from './messaging/NewConversationModal';
import { messagesApi, Conversation } from '../services/api/messages';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

export function MessagingView() {
  const { user: backendUser } = useAuth();
  const { refreshConversations } = useMessaging();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    // Mark as read
    if (backendUser?.id) {
      messagesApi.markRead(conversationId, backendUser.id).catch(console.error);
      refreshConversations();
    }
  };

  const handleConversationCreated = (conversation: Conversation) => {
    setShowNewModal(false);
    setActiveConversationId(conversation.id);
    refreshConversations();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-lg border bg-white overflow-hidden">
      {/* Left panel: conversation list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-sm">Messages</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setShowNewModal(true)}
            title="New Message"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      </div>

      {/* Right panel: thread */}
      <div className="flex-1 flex flex-col min-w-0">
        <MessageThread conversationId={activeConversationId} />
      </div>

      {showNewModal && backendUser && (
        <NewConversationModal
          currentUserId={backendUser.id}
          currentUserTeamId={backendUser.user_team}
          onConversationCreated={handleConversationCreated}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
