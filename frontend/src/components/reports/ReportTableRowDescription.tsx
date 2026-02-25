import type { ReportComment } from './types';

interface ReportTableRowDescriptionProps {
  description: string;
  latestComment: ReportComment | null;
  onOpen: () => void;
}

export function ReportTableRowDescription({
  description,
  latestComment,
  onOpen,
}: ReportTableRowDescriptionProps) {
  return (
    <div className="w-full min-w-0 space-y-1">
      <p className="block w-full truncate overflow-hidden text-ellipsis whitespace-nowrap" title={description}>
        {description}
      </p>
      {latestComment && (
        <button
          type="button"
          className="block w-full min-w-0 truncate overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={onOpen}
          title={`Latest comment: ${latestComment.authorName}: ${latestComment.body}`}
        >
          Latest comment: {latestComment.authorName}: {latestComment.body}
        </button>
      )}
    </div>
  );
}
