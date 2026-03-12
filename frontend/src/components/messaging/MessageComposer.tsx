import type { FormEvent } from 'react';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

interface MessageComposerProps {
  disabled?: boolean;
  onSendMessage: (body: string) => Promise<void>;
}

export function MessageComposer({ disabled = false, onSendMessage }: MessageComposerProps) {
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;

    try {
      setSendError('');
      setSending(true);
      await onSendMessage(trimmed);
      setDraft('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      setSendError(message);
    } finally {
      setSending(false);
    }
  };

  const isSubmitDisabled = disabled || sending || !draft.trim();

  return (
    <form
      className="shrink-0 border-t bg-background/95 px-4 py-2.5 shadow-[0_-1px_0_0_rgba(0,0,0,0.03)]"
      onSubmit={submitMessage}
    >
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Message</span>
        <span>{draft.trim().length}/2000</span>
      </div>

      {sendError && <p className="mb-2 text-xs text-destructive">{sendError}</p>}

      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          maxLength={2100}
          placeholder="Write a message..."
          disabled={disabled || sending}
          className="min-h-[64px]"
        />
        <Button type="submit" disabled={isSubmitDisabled}>
          <Send className="mr-2 h-4 w-4" />
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </form>
  );
}
