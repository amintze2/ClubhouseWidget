import type { FormEvent, KeyboardEvent } from 'react';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CommentComposerProps {
  onSubmit: (body: string) => void;
  maxLength?: number;
}

export function CommentComposer({ onSubmit, maxLength = 800 }: CommentComposerProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const submitValue = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (trimmed.length > maxLength) {
      setError(`Comment must be ${maxLength} characters or fewer.`);
      return;
    }

    onSubmit(trimmed);
    setValue('');
    setError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitValue();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitValue();
    }
  };

  return (
    <div className="space-y-2">
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <Input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          maxLength={maxLength + 50}
        />
        <Button type="submit" aria-label="Send comment">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
