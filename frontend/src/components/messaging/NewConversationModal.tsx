import React, { useState, useEffect } from 'react';
import { messagesApi, Conversation, CMUser } from '../../services/api/messages';
import { teamsApi, Team } from '../../services/api/teams';
import { Button } from '../ui/button';
import { X, Search } from 'lucide-react';

interface NewConversationModalProps {
  currentUserId: number;
  currentUserTeamId: number | null;
  onConversationCreated: (conversation: Conversation) => void;
  onClose: () => void;
}

export function NewConversationModal({
  currentUserId,
  currentUserTeamId,
  onConversationCreated,
  onClose,
}: NewConversationModalProps) {
  const [tab, setTab] = useState<'person' | 'team'>('person');
  const [allCMs, setAllCMs] = useState<CMUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      messagesApi.getAllCMs(),
      teamsApi.getAllTeams(),
    ]).then(([cms, ts]) => {
      setAllCMs(cms);
      setTeams(ts);
    }).finally(() => setLoading(false));
  }, []);

  // Person tab: all CMs except current user, filtered by search
  const otherCMs = allCMs
    .filter(cm => cm.id !== currentUserId)
    .filter(cm => {
      const q = search.toLowerCase();
      return (
        cm.user_name?.toLowerCase().includes(q) ||
        cm.team_name?.toLowerCase().includes(q)
      );
    });

  // Group by team
  const cmsByTeam = otherCMs.reduce<Record<string, CMUser[]>>((acc, cm) => {
    const key = cm.team_name ?? 'Unknown Team';
    if (!acc[key]) acc[key] = [];
    acc[key].push(cm);
    return acc;
  }, {});

  // Team tab: all teams except the current user's team
  const otherTeams = teams
    .filter(t => t.id !== currentUserTeamId)
    .filter(t => t.team_name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectPerson = async (cm: CMUser) => {
    if (creating) return;
    setCreating(true);
    try {
      const conv = await messagesApi.findOrCreateDirect(currentUserId, cm.id);
      onConversationCreated(conv);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectTeam = async (team: Team) => {
    if (creating || !currentUserTeamId) return;
    setCreating(true);
    try {
      const conv = await messagesApi.findOrCreateTeamThread(currentUserTeamId, team.id, currentUserId);
      onConversationCreated(conv);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-base">New Message</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => { setTab('person'); setSearch(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'person'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Message a Person
          </button>
          <button
            onClick={() => { setTab('team'); setSearch(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'team'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Message a Team
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'person' ? 'Search by name or team…' : 'Search teams…'}
              className="flex-1 text-sm outline-none bg-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
          )}

          {!loading && tab === 'person' && (
            otherCMs.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No managers found</div>
            ) : (
              Object.entries(cmsByTeam).sort(([a], [b]) => a.localeCompare(b)).map(([teamName, cms]) => (
                <div key={teamName}>
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                    {teamName}
                  </div>
                  {cms.map(cm => (
                    <button
                      key={cm.id}
                      onClick={() => handleSelectPerson(cm)}
                      disabled={creating}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {(cm.user_name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{cm.user_name ?? 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{cm.team_name ?? ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )
          )}

          {!loading && tab === 'team' && (
            otherTeams.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No teams found</div>
            ) : (
              otherTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  disabled={creating || !currentUserTeamId}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 disabled:opacity-50"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {team.team_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{team.team_name}</p>
                    <p className="text-xs text-gray-400">All clubhouse managers</p>
                  </div>
                </button>
              ))
            )
          )}

          {!loading && tab === 'team' && !currentUserTeamId && (
            <div className="px-4 pb-4 text-xs text-amber-600">
              You must be assigned to a team to start a team thread.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
