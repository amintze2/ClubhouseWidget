import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, Trash2 } from 'lucide-react';
import { getCategoryBadgeColor, getCategoryLabel } from '../../utils/categoryHelpers';
import { formatTime12Hour } from '../../utils/timeFormat';
import type { Task } from '../../types/index';

interface TaskItemProps {
  checkboxId: string;
  isChecked: boolean;
  onToggle: () => void;
  title: string;
  category: Task['category'];
  description?: string;
  time?: string;
  isRecurring?: boolean;
  onDelete?: () => void;
  containerClassName?: string;
}

export function TaskItem({
  checkboxId, isChecked, onToggle,
  title, category, description,
  time, isRecurring, onDelete,
  containerClassName,
}: TaskItemProps) {
  const defaultBg = isRecurring ? 'bg-blue-50 border-blue-200 hover:bg-blue-50' : 'hover:bg-gray-50';
  const outerClass = containerClassName ?? defaultBg;

  return (
    <div className={`flex items-start space-x-3 p-3 rounded-lg transition-colors border ${outerClass}`}>
      <Checkbox
        id={checkboxId}
        checked={isChecked}
        onCheckedChange={onToggle}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={checkboxId}
          className={`block cursor-pointer ${isChecked ? 'line-through text-gray-400' : ''}`}
        >
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span>{title}</span>
            {isRecurring && (
              <Badge variant="secondary" className="bg-blue-200 text-blue-800">Recurring</Badge>
            )}
            <Badge className={getCategoryBadgeColor(category)}>{getCategoryLabel(category)}</Badge>
            {time && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime12Hour(time)}
              </Badge>
            )}
            {isChecked && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>
            )}
          </div>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </label>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
