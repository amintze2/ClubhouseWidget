import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { issuesApi, teamsApi, type IssueComment } from '../services/api';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ReportDetails } from './reports/ReportDetails';
import { ReportsTable } from './reports/ReportsTable';
import { buildInitials, getFlaggedBadgeClass } from './reports/reportUtils';
import type { DisplayIssue, ReportComment, ReportStatus, TeamContextFilter } from './reports/types';

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

export function GeneralManagerPlayerReports() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<DisplayIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [teamFilter, setTeamFilter] = useState<TeamContextFilter>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [teamName, setTeamName] = useState<string | null>(null);
  const [flagUpdatingIssueIds, setFlagUpdatingIssueIds] = useState<Set<number>>(new Set());
  const [commentsByReportId, setCommentsByReportId] = useState<Record<string, ReportComment[]>>({});

  useEffect(() => {
    const fetchIssuesForGmTeam = async () => {
      if (!user?.user_team) {
        setIssues([]);
        setLoadingIssues(false);
        setFetchError('No team is assigned to this user.');
        return;
      }

      try {
        setLoadingIssues(true);
        setFetchError('');
        const team = await teamsApi.getTeam(user.user_team);
        setTeamName(team.team_name);
        const data = await issuesApi.getIssuesByPlayerTeam(team.team_name);
        setIssues(
          data.map((issue) => ({
            ...issue,
            gm_flagged: Boolean(issue.gm_flagged),
            status: 'New' as ReportStatus,
          })),
        );
      } catch (err) {
        setFetchError('Failed to load reports. Please try again.');
        console.error('Failed to fetch GM issues:', err);
      } finally {
        setLoadingIssues(false);
      }
    };

    fetchIssuesForGmTeam();
  }, [user?.user_team]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => (teamFilter === 'all' ? true : issue.team_context === teamFilter));
  }, [issues, teamFilter]);

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId) ?? null;

  const getReportComments = (reportId: number) => commentsByReportId[reportId.toString()] ?? [];

  const getLatestCommentPreview = (reportId: number) => {
    const comments = getReportComments(reportId);
    return comments.length > 0 ? comments[comments.length - 1] : null;
  };

  const openIssueDetails = async (issueId: number) => {
    setSelectedIssueId(issueId);
    if (commentsByReportId[String(issueId)] !== undefined) return;

    try {
      const dbComments = await issuesApi.getIssueComments(issueId);
      const authorName = 'Clubhouse Manager';
      setCommentsByReportId((prev) => ({
        ...prev,
        [String(issueId)]: dbComments.map((comment) => toReportComment(comment, authorName)),
      }));
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setCommentsByReportId((prev) => ({ ...prev, [String(issueId)]: [] }));
    }
  };

  const toggleIssueFlag = async (issue: DisplayIssue) => {
    const nextFlagValue = !Boolean(issue.gm_flagged);
    setIssues((prev) =>
      prev.map((item) => (item.id === issue.id ? { ...item, gm_flagged: nextFlagValue } : item)),
    );
    setFlagUpdatingIssueIds((prev) => new Set(prev).add(issue.id));
    setStatusMessage(nextFlagValue ? 'Issue flagged.' : 'Issue unflagged.');

    try {
      await issuesApi.updateIssueFlag(issue.id, nextFlagValue);
    } catch (err) {
      console.error('Failed to update issue flag:', err);
      setIssues((prev) =>
        prev.map((item) => (item.id === issue.id ? { ...item, gm_flagged: !nextFlagValue } : item)),
      );
      setStatusMessage('Failed to update flag. Please try again.');
    } finally {
      setFlagUpdatingIssueIds((prev) => {
        const next = new Set(prev);
        next.delete(issue.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-2xl">Player Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only player issue reporting for {teamName || 'your team'}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incoming Reports</CardTitle>
          <CardDescription>Review reports and flag items for clubhouse follow-up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
          {fetchError && <p className="text-sm text-destructive">{fetchError}</p>}

          <div className="max-w-sm space-y-2">
            <Label htmlFor="team-context-filter">Team Context</Label>
            <Select value={teamFilter} onValueChange={(value: string) => setTeamFilter(value as TeamContextFilter)}>
              <SelectTrigger id="team-context-filter">
                <SelectValue placeholder="Filter by team context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="away">Away</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ReportsTable
            issues={filteredIssues}
            loading={loadingIssues}
            onOpenIssue={openIssueDetails}
            getLatestCommentPreview={getLatestCommentPreview}
            showStatusColumn={true}
            onToggleFlag={toggleIssueFlag}
            flagUpdatingIssueIds={flagUpdatingIssueIds}
          />
        </CardContent>
      </Card>

      <Dialog open={selectedIssue !== null} onOpenChange={(open: boolean) => !open && setSelectedIssueId(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedIssue && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>Report Details</DialogTitle>
                  {selectedIssue.gm_flagged && (
                    <Badge variant="outline" className={getFlaggedBadgeClass(selectedIssue.gm_flagged)}>
                      Flagged
                    </Badge>
                  )}
                </div>
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
                onClose={() => setSelectedIssueId(null)}
                allowCommentComposer={false}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
