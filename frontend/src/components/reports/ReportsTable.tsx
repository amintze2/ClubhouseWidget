import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { cn } from '../ui/utils';
import { ReportTableRowDescription } from './ReportTableRowDescription';
import {
  formatReportTimestamp,
  getFlaggedBadgeClass,
  getFlaggedReportRowClass,
  getStatusBadgeClass,
} from './reportUtils';
import type { DisplayIssue, ReportComment } from './types';

interface ReportsTableProps {
  issues: DisplayIssue[];
  loading: boolean;
  onOpenIssue: (issueId: number) => void;
  getLatestCommentPreview: (reportId: number) => ReportComment | null;
  showStatusColumn?: boolean;
  onToggleFlag?: (issue: DisplayIssue) => void;
  flagUpdatingIssueIds?: Set<number>;
  emptyMessage?: string;
}

export function ReportsTable({
  issues,
  loading,
  onOpenIssue,
  getLatestCommentPreview,
  showStatusColumn = true,
  onToggleFlag,
  flagUpdatingIssueIds,
  emptyMessage = 'No reports found.',
}: ReportsTableProps) {
  const hasFlagActions = typeof onToggleFlag === 'function';
  const totalColumns = 5 + (showStatusColumn ? 1 : 0) + (hasFlagActions ? 1 : 0);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading reports...</p>;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[16%]">Submitted</TableHead>
            <TableHead className="w-[16%]">Team</TableHead>
            <TableHead className="w-[12%]">Team Context</TableHead>
            {showStatusColumn && <TableHead className="w-[12%]">Status</TableHead>}
            <TableHead className={cn(showStatusColumn ? 'w-[34%]' : 'w-[38%]')}>Description</TableHead>
            {hasFlagActions && <TableHead className="w-[10%]">Flag</TableHead>}
            <TableHead className="w-[10%]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={totalColumns} className="text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            issues.map((issue) => {
              const isFlagged = Boolean(issue.gm_flagged);
              const isFlagUpdating = flagUpdatingIssueIds?.has(issue.id) ?? false;
              return (
                <TableRow key={issue.id} className={getFlaggedReportRowClass(isFlagged)}>
                  <TableCell>{formatReportTimestamp(issue.created_at)}</TableCell>
                  <TableCell>{issue.player_team ?? '-'}</TableCell>
                  <TableCell className="capitalize">{issue.team_context}</TableCell>
                  {showStatusColumn && (
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeClass(issue.status)}>
                        {issue.status}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className={cn(showStatusColumn ? 'w-[34%]' : 'w-[38%]', 'min-w-0 overflow-hidden')}>
                    <div className="space-y-1">
                      {isFlagged && (
                        <Badge variant="outline" className={getFlaggedBadgeClass(isFlagged)}>
                          Flagged
                        </Badge>
                      )}
                      <ReportTableRowDescription
                        description={issue.description}
                        latestComment={getLatestCommentPreview(issue.id)}
                        onOpen={() => onOpenIssue(issue.id)}
                      />
                    </div>
                  </TableCell>
                  {hasFlagActions && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleFlag(issue)}
                        disabled={isFlagUpdating}
                      >
                        {isFlagUpdating ? 'Saving...' : isFlagged ? 'Unflag' : 'Flag'}
                      </Button>
                    </TableCell>
                  )}
                  <TableCell>
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenIssue(issue.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
