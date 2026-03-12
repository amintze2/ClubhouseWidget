import type { ManagerConversationSummary } from '../../services/api';

interface ChatHeaderProps {
  conversation: ManagerConversationSummary;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  return (
    <div className="border-b bg-background px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {conversation.other_manager_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{conversation.other_manager_name}</p>
          <p className="text-xs text-muted-foreground">Direct message</p>
        </div>
      </div>
    </div>
  );
}
