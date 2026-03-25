// MyDues: player-facing component showing pending and paid dues.
// Pending rows have a "Pay Now" button that opens a Stripe Checkout Session.
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { duesApi } from '../../services/api/dues';
import type { MyDuesRow } from '../../services/api/dues';

export function MyDues() {
  const [dues, setDues] = useState<MyDuesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);

  const loadDues = useCallback(() => {
    setLoading(true);
    duesApi.getMyDues()
      .then(setDues)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDues(); }, [loadDues]);

  const handlePay = async (duesId: number) => {
    setPayingId(duesId);
    try {
      const { url } = await duesApi.getCheckoutUrl(duesId);
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start payment');
      setPayingId(null);
    }
  };

  const pending = dues.filter(d => d.status === 'pending');
  const paid = dues.filter(d => d.status === 'paid');

  if (loading) {
    return <p className="text-sm text-gray-500 py-8 text-center">Loading dues...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Pending section */}
      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          Pending Dues
          {pending.length > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{pending.length}</Badge>
          )}
        </h3>

        {pending.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
              <p className="text-sm text-gray-500">No dues owed right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map(due => {
              const batch = due.dues_batch;
              const cmName = batch?.user?.user_name ?? 'Clubhouse Manager';
              const teamName = batch?.teams?.team_name ?? '';
              const label = [cmName, teamName].filter(Boolean).join(' · ');
              const sentDate = new Date(due.created_at).toLocaleDateString();

              return (
                <Card key={due.id} className="border-yellow-200">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold">${Number(due.amount).toFixed(2)}</span>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{label}</p>
                      {batch?.note && (
                        <p className="text-xs text-gray-500 mt-0.5">{batch.note}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">Sent {sentDate}</p>
                    </div>
                    <Button
                      className="ml-4"
                      disabled={payingId === due.id}
                      onClick={() => handlePay(due.id)}
                    >
                      {payingId === due.id ? 'Redirecting...' : 'Pay Now'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Paid history */}
      {paid.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Paid History
          </h3>
          <div className="space-y-2">
            {paid.map(due => {
              const batch = due.dues_batch;
              const cmName = batch?.user?.user_name ?? 'Clubhouse Manager';
              const teamName = batch?.teams?.team_name ?? '';
              const label = [cmName, teamName].filter(Boolean).join(' · ');
              const paidDate = due.paid_at
                ? new Date(due.paid_at).toLocaleDateString()
                : null;

              return (
                <div key={due.id} className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-lg border border-green-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">${Number(due.amount).toFixed(2)}</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        Paid
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{label}</p>
                    {batch?.note && (
                      <p className="text-xs text-gray-400">{batch.note}</p>
                    )}
                  </div>
                  {paidDate && (
                    <span className="text-xs text-gray-400">Paid {paidDate}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
