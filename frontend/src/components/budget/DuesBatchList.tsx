// DuesBatchList: shows all dues batches the CM has sent,
// with per-player status badges and cancel buttons for pending rows.
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { DuesBatch } from '../../services/api/dues';
import { duesApi } from '../../services/api/dues';

interface Props {
  batches: DuesBatch[];
  onBatchesChange: () => void;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> Paid
      </Badge>
    );
  }
  if (status === 'cancelled') {
    return (
      <Badge variant="outline" className="text-gray-500 flex items-center gap-1 w-fit">
        <XCircle className="h-3 w-3" /> Cancelled
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

export function DuesBatchList({ batches, onBatchesChange }: Props) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancel = async (duesId: number) => {
    if (!window.confirm('Cancel this dues request? The player will no longer be able to pay.')) return;
    setCancellingId(duesId);
    try {
      await duesApi.cancelDue(duesId);
      onBatchesChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel dues');
    } finally {
      setCancellingId(null);
    }
  };

  if (batches.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No dues sent yet. Use the form above to bill a visiting team.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map(batch => {
        const teamName = batch.teams?.team_name ?? 'Unknown Team';
        const sentDate = new Date(batch.created_at).toLocaleDateString();
        const paidCount = batch.dues.filter(d => d.status === 'paid').length;
        const pendingCount = batch.dues.filter(d => d.status === 'pending').length;

        return (
          <Card key={batch.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{teamName}</CardTitle>
                  <CardDescription>
                    Sent {sentDate}{batch.note ? ` · ${batch.note}` : ''}
                  </CardDescription>
                </div>
                <div className="text-sm text-gray-500 text-right">
                  <span className="text-green-600 font-medium">{paidCount} paid</span>
                  {' · '}
                  <span className="text-yellow-600">{pendingCount} pending</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {batch.dues.map(due => (
                  <div key={due.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {due.user?.user_name ?? `Player #${due.player_user_id}`}
                      </span>
                      <StatusBadge status={due.status} />
                      {due.paid_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(due.paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">${Number(due.amount).toFixed(2)}</span>
                      {due.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                          disabled={cancellingId === due.id}
                          onClick={() => handleCancel(due.id)}
                        >
                          {cancellingId === due.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
