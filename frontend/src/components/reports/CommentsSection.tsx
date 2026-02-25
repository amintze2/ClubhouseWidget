import { ScrollArea } from '../ui/scroll-area';
import { CommentItem } from './CommentItem';
import type { ReportComment } from './types';

interface CommentsSectionProps {
  comments: ReportComment[];
}

export function CommentsSection({ comments }: CommentsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium">Comments</h3>
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ScrollArea className="max-h-64 pr-3">
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
