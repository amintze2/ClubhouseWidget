import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { issuesApi, Issue } from '../services/api';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

type TeamContextFilter = 'all' | 'home' | 'away';
type ReportStatusFilter = 'all' | 'New' | 'In Progress' | 'Resolved';
type ReportStatus = 'New' | 'In Progress' | 'Resolved';

interface DisplayIssue extends Issue {
  status: ReportStatus;
}

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStatusBadgeClass = (status: ReportStatus) => {
  if (status === 'New') {
    return 'border-red-200 bg-red-100 text-red-800';
  }
  if (status === 'In Progress') {
    return 'border-amber-200 bg-amber-100 text-amber-800';
  }
  return 'border-green-200 bg-green-100 text-green-800';
};

export function ManagerPlayerReports() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<DisplayIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [teamFilter, setTeamFilter] = useState<TeamContextFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const data = await issuesApi.getAllIssues();
        setIssues(data.map((issue) => ({ ...issue, status: 'New' as ReportStatus })));
      } catch (err) {
        setFetchError('Failed to load reports. Please try again.');
        console.error('Failed to fetch issues:', err);
      } finally {
        setLoadingIssues(false);
      }
    };
    fetchIssues();
  }, []);

  const managerTeam = user?.team_name ?? null;

  // Filter to only issues that belong to this manager's team:
  // - home issues: player's team matches the manager's team
  // - away issues: the selected away team matches the manager's team
  const teamScopedIssues = useMemo(() => {
    if (!managerTeam) return issues;
    return issues.filter((issue) => {
      if (issue.team_context === 'home') return issue.player_team === managerTeam;
      if (issue.team_context === 'away') return issue.away_team === managerTeam;
      return false;
    });
  }, [issues, managerTeam]);

  const filteredIssues = useMemo(() => {
    return teamScopedIssues.filter((issue) => {
      const matchesTeam = teamFilter === 'all' ? true : issue.team_context === teamFilter;
      const matchesStatus = statusFilter === 'all' ? true : issue.status === statusFilter;
      return matchesTeam && matchesStatus;
    });
  }, [teamScopedIssues, teamFilter, statusFilter]);

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId) ?? null;

  const handleStatusUpdate = (issueId: number, nextStatus: ReportStatus) => {
    // TODO: persist status updates to Supabase
    setIssues((prev) =>
      prev.map((issue) => (issue.id === issueId ? { ...issue, status: nextStatus } : issue)),
    );
    setStatusUpdateMessage(`Status updated to ${nextStatus}.`);
    setSelectedIssueId(null);
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-2xl">Player Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Issues submitted by players for clubhouse managers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incoming Reports</CardTitle>
          <CardDescription>Review, filter, and update report status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusUpdateMessage && <p className="text-sm text-muted-foreground">{statusUpdateMessage}</p>}
          {fetchError && <p className="text-sm text-destructive">{fetchError}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team-filter">Team Context</Label>
              <Select value={teamFilter} onValueChange={(value: string) => setTeamFilter(value as TeamContextFilter)}>
                <SelectTrigger id="team-filter">
                  <SelectValue placeholder="Filter by team context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as ReportStatusFilter)}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingIssues ? (
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Team Context</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>{formatTimestamp(issue.created_at)}</TableCell>
                      <TableCell>{issue.player_team ?? '—'}</TableCell>
                      <TableCell className="capitalize">{issue.team_context}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeClass(issue.status)}>
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{issue.description}</TableCell>
                      <TableCell>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedIssueId(issue.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedIssue !== null} onOpenChange={(open: boolean) => !open && setSelectedIssueId(null)}>
        <DialogContent>
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedIssue.player_team ?? 'Unknown Team'}</DialogTitle>
                <DialogDescription>
                  Submitted {formatTimestamp(selectedIssue.created_at)} | {selectedIssue.team_context} context
                  {selectedIssue.team_context === 'away' && selectedIssue.away_team
                    ? ` — ${selectedIssue.away_team}`
                    : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">{selectedIssue.status}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedIssue.description}</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusUpdate(selectedIssue.id, 'In Progress')}
                >
                  Mark In Progress
                </Button>
                <Button type="button" onClick={() => handleStatusUpdate(selectedIssue.id, 'Resolved')}>
                  Mark as Resolved
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
