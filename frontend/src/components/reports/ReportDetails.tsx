import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { CommentsSection } from './CommentsSection';
import { CommentComposer } from './CommentComposer';
import { formatReportTimestamp, getStatusBadgeClass } from './reportUtils';
import type { Report, ReportComment } from './types';

interface ReportDetailsProps {
  report: Report;
  comments: ReportComment[];
  onAddComment: (reportId: string, body: string) => void;
  onClose: () => void;
}

export function ReportDetails({ report, comments, onAddComment, onClose }: ReportDetailsProps) {
  const reportId = report.id.toString();
  const teamLabel =
    report.team_context === 'away' && report.away_team
      ? report.away_team
      : (report.player_team || 'Unknown Team');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Status</Label>
          <div>
            <Badge variant="outline" className={getStatusBadgeClass(report.status)}>
              {report.status}
            </Badge>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Team</Label>
          <p className="text-sm text-muted-foreground">{teamLabel}</p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Submitted</Label>
          <p className="text-sm text-muted-foreground">
            {formatReportTimestamp(report.created_at)} ({report.team_context} context)
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium">Original Description</p>
        <p className="mt-2 text-sm text-muted-foreground break-words whitespace-pre-wrap">
          {report.description}
        </p>
      </div>

      <CommentsSection comments={comments} />

      <div className="space-y-2">
        <CommentComposer onSubmit={(body) => onAddComment(reportId, body)} />
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
