import { Avatar, AvatarFallback } from '../ui/avatar';
import { formatCommentTime } from './reportUtils';
import type { ReportComment } from './types';

interface CommentItemProps {
  comment: ReportComment;
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback>{comment.authorInitials || 'CM'}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{comment.authorName}</p>
          <p className="text-xs text-muted-foreground">{formatCommentTime(comment.createdAt)}</p>
        </div>
        <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm break-words whitespace-pre-wrap">
          {comment.body}
        </div>
      </div>
    </div>
  );
}
