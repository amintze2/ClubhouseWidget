// DuesManager: CM-facing component for sending dues to a visiting team's roster.
// - Loads all teams and players for the selected visiting team
// - Defaults to $8/player, allows per-player override
// - Sends the batch via the dues API
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DollarSign, Send, Users } from 'lucide-react';
import { teamsApi } from '../../services/api/teams';
import { supabase } from '../../utils/supabase/client';
import { duesApi } from '../../services/api/dues';
import type { DuesBatch } from '../../services/api/dues';
import { DuesBatchList } from './DuesBatchList';
import type { Team } from '../../services/api/teams';

const DEFAULT_AMOUNT = 8.00;

interface Player {
  id: number;
  user_name: string | null;
}

interface PlayerRow {
  player: Player;
  checked: boolean;
  amount: string;
}

interface Props {
  cmTeamId: number | null;
}

export function DuesManager({ cmTeamId }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
  const [playerRows, setPlayerRows] = useState<PlayerRow[]>([]);
  const [globalAmount, setGlobalAmount] = useState(String(DEFAULT_AMOUNT));
  const [note, setNote] = useState('');
  const [batches, setBatches] = useState<DuesBatch[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Load teams on mount
  useEffect(() => {
    teamsApi.getAllTeams().then(setTeams).catch(() => {});
  }, []);

  // Load sent batches
  const loadBatches = useCallback(() => {
    setLoadingBatches(true);
    duesApi.getBatches()
      .then(setBatches)
      .catch(() => {})
      .finally(() => setLoadingBatches(false));
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  // Load players when team is selected
  useEffect(() => {
    if (!selectedTeamId) {
      setPlayerRows([]);
      return;
    }
    setLoadingPlayers(true);
    supabase
      .from('user')
      .select('id, user_name')
      .eq('user_team', selectedTeamId)
      .ilike('user_role', '%player%')
      .then(({ data }) => {
        const rows: PlayerRow[] = (data ?? []).map(p => ({
          player: p as Player,
          checked: true,
          amount: globalAmount,
        }));
        setPlayerRows(rows);
      })
      .catch(() => {})
      .finally(() => setLoadingPlayers(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId]);

  const handleGlobalAmountChange = (val: string) => {
    setGlobalAmount(val);
    setPlayerRows(rows => rows.map(r => ({ ...r, amount: val })));
  };

  const handlePlayerAmountChange = (idx: number, val: string) => {
    setPlayerRows(rows => rows.map((r, i) => i === idx ? { ...r, amount: val } : r));
  };

  const handleTogglePlayer = (idx: number) => {
    setPlayerRows(rows => rows.map((r, i) => i === idx ? { ...r, checked: !r.checked } : r));
  };

  const selectedRows = playerRows.filter(r => r.checked);
  const canSend = selectedTeamId !== '' && selectedRows.length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await duesApi.sendDues({
        visitingTeamId: Number(selectedTeamId),
        players: selectedRows.map(r => ({
          userId: r.player.id,
          amount: parseFloat(r.amount) || DEFAULT_AMOUNT,
        })),
        note: note.trim() || undefined,
      });
      // Reset form
      setSelectedTeamId('');
      setPlayerRows([]);
      setNote('');
      setGlobalAmount(String(DEFAULT_AMOUNT));
      loadBatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send dues');
    } finally {
      setSending(false);
    }
  };

  const visitingTeams = teams.filter(t => t.id !== cmTeamId);

  return (
    <div className="space-y-6">
      {/* Send dues form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Send Dues</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">Bill a visiting team's roster for clubhouse dues</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Team + amount row */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Visiting Team</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Select team...</option>
                {visitingTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.team_name}</option>
                ))}
              </select>
            </div>

            <div className="w-36">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (all players)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border rounded-md pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={globalAmount}
                  onChange={e => handleGlobalAmountChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                placeholder="e.g. April away series"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          {/* Player roster */}
          {loadingPlayers && (
            <p className="text-sm text-gray-500">Loading roster...</p>
          )}

          {!loadingPlayers && playerRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Users className="h-4 w-4" /> Players
                </label>
                <span className="text-xs text-gray-400">
                  {selectedRows.length} of {playerRows.length} selected
                </span>
              </div>
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {playerRows.map((row, idx) => (
                  <div key={row.player.id} className="flex items-center gap-3 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={() => handleTogglePlayer(idx)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="flex-1 text-sm">
                      {row.player.user_name ?? `Player #${row.player.id}`}
                    </span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border rounded pl-5 pr-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={row.amount}
                        disabled={!row.checked}
                        onChange={e => handlePlayerAmountChange(idx, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingPlayers && selectedTeamId !== '' && playerRows.length === 0 && (
            <p className="text-sm text-gray-500">No players found for this team.</p>
          )}

          <div className="flex items-center justify-between pt-1">
            {selectedRows.length > 0 && (
              <span className="text-sm text-gray-600">
                Total:{' '}
                <span className="font-semibold">
                  ${selectedRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0).toFixed(2)}
                </span>
              </span>
            )}
            <Button
              className="ml-auto flex items-center gap-2"
              disabled={!canSend || sending}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : `Send Dues to ${selectedRows.length} Player${selectedRows.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sent batches */}
      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          Sent Dues
          {!loadingBatches && batches.length > 0 && (
            <Badge variant="outline">{batches.length}</Badge>
          )}
        </h3>
        {loadingBatches ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <DuesBatchList batches={batches} onBatchesChange={loadBatches} />
        )}
      </div>
    </div>
  );
}
