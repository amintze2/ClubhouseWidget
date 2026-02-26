import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { issuesApi, type IssueComment } from '../services/api';
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
import { ReportDetails } from './reports/ReportDetails';
import { ReportTableRowDescription } from './reports/ReportTableRowDescription';
import { buildInitials, formatReportTimestamp, getStatusBadgeClass } from './reports/reportUtils';
import type {
  DisplayIssue,
  ReportComment,
  ReportStatus,
  ReportStatusFilter,
  TeamContextFilter,
} from './reports/types';

function toReportComment(dbComment: IssueComment, authorName: string): ReportComment {
  return {
    id: String(dbComment.id),
    reportId: String(dbComment.issue_id),
    authorRole: 'clubhouse_manager',
    authorName,
    authorInitials: buildInitials(authorName),
    body: dbComment.comment ?? '',
    createdAt: dbComment.created_at,
  };
}

export function ManagerPlayerReports() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<DisplayIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [teamFilter, setTeamFilter] = useState<TeamContextFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');
  const [commentsByReportId, setCommentsByReportId] = useState<Record<string, ReportComment[]>>({});

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

  const openIssueDetails = async (issueId: number) => {
    setSelectedIssueId(issueId);
    // Only fetch if we haven't loaded comments for this issue yet
    if (commentsByReportId[String(issueId)] === undefined) {
      try {
        const dbComments = await issuesApi.getIssueComments(issueId);
        const authorName = user?.user_name || 'Clubhouse Manager';
        setCommentsByReportId((prev) => ({
          ...prev,
          [String(issueId)]: dbComments.map((c) => toReportComment(c, authorName)),
        }));
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setCommentsByReportId((prev) => ({ ...prev, [String(issueId)]: [] }));
      }
    }
  };

  const getReportComments = (reportId: number) => commentsByReportId[reportId.toString()] ?? [];

  const getLatestCommentPreview = (reportId: number) => {
    const comments = getReportComments(reportId);
    return comments.length > 0 ? comments[comments.length - 1] : null;
  };

  const handleAddComment = async (reportId: string, body: string) => {
    const authorName = user?.user_name || 'Clubhouse Manager';
    try {
      const dbComment = await issuesApi.addIssueComment(parseInt(reportId, 10), body);
      const nextComment = toReportComment(dbComment, authorName);
      setCommentsByReportId((prev) => ({
        ...prev,
        [reportId]: [...(prev[reportId] ?? []), nextComment],
      }));
      setStatusUpdateMessage('Comment added.');
    } catch (err) {
      console.error('Failed to save comment:', err);
      setStatusUpdateMessage('Failed to save comment. Please try again.');
    }
  };

  const handleStatusUpdate = (issueId: number, nextStatus: ReportStatus) => {
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
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16%]">Submitted</TableHead>
                  <TableHead className="w-[16%]">Team</TableHead>
                  <TableHead className="w-[10%]">Team Context</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[38%]">Description</TableHead>
                  <TableHead className="w-[10%]">Action</TableHead>
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
                      <TableCell>{formatReportTimestamp(issue.created_at)}</TableCell>
                      <TableCell>{issue.player_team ?? '-'}</TableCell>
                      <TableCell className="capitalize">{issue.team_context}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeClass(issue.status)}>
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[38%]">
                        <ReportTableRowDescription
                          description={issue.description}
                          latestComment={getLatestCommentPreview(issue.id)}
                          onOpen={() => openIssueDetails(issue.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="outline" size="sm" onClick={() => openIssueDetails(issue.id)}>
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
        <DialogContent className="sm:max-w-2xl">
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle>Report Details</DialogTitle>
                <DialogDescription>
                  {selectedIssue.player_team ?? 'Unknown Team'}
                  {selectedIssue.team_context === 'away' && selectedIssue.away_team
                    ? ` | Away: ${selectedIssue.away_team}`
                    : ''}
                </DialogDescription>
              </DialogHeader>

              <ReportDetails
                report={selectedIssue}
                comments={getReportComments(selectedIssue.id)}
                onAddComment={handleAddComment}
                onClose={() => setSelectedIssueId(null)}
              />

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
