import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { managerMessagingApi, type EligibleManager } from '../../services/api';

interface NewConversationPickerProps {
  currentUserId: number;
  onStartConversation: (managerId: number) => Promise<void>;
}

export function NewConversationPicker({
  currentUserId,
  onStartConversation,
}: NewConversationPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EligibleManager[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const managers = await managerMessagingApi.searchEligibleManagers(currentUserId, query);
        if (!cancelled) setResults(managers);
      } catch (fetchError) {
        if (!cancelled) {
          const message =
            fetchError instanceof Error ? fetchError.message : 'Failed to search managers';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [currentUserId, query]);

  const startConversation = async (managerId: number) => {
    try {
      setActionLoadingId(managerId);
      setError('');
      await onStartConversation(managerId);
      setQuery('');
      setResults([]);
    } catch (startError) {
      const message =
        startError instanceof Error ? startError.message : 'Failed to start conversation';
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const hasQuery = query.trim().length > 0;
  const showResultsPanel = hasQuery || loading || Boolean(error);

  return (
    <div className="space-y-2">
      <h3 className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Start New DM
      </h3>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-8 pl-10 text-sm"
          placeholder="Search manager"
        />
      </div>

      {showResultsPanel && (
        <div className="rounded-md border bg-background p-1.5">
          {error && <p className="pb-2 text-xs text-destructive">{error}</p>}
          {loading ? (
            <p className="text-xs text-muted-foreground">Searching...</p>
          ) : (
            <ScrollArea className="max-h-[180px] pr-1">
              {results.length === 0 ? (
                <p className="text-xs text-muted-foreground">No eligible managers found.</p>
              ) : (
                <div className="space-y-1">
                  {results.map((manager) => (
                    <div
                      key={manager.id}
                      className="flex items-center justify-between gap-3 rounded-md px-1 py-1"
                    >
                      <p className="truncate text-sm">{manager.user_name || `Manager #${manager.id}`}</p>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => startConversation(manager.id)}
                        disabled={actionLoadingId === manager.id}
                      >
                        {actionLoadingId === manager.id ? 'Opening...' : 'Open'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
