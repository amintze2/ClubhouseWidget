import type { ReportStatus } from './types';

export const formatReportTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatCommentTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getStatusBadgeClass = (status: ReportStatus) => {
  if (status === 'New') return 'border-red-200 bg-red-100 text-red-800';
  if (status === 'In Progress') return 'border-amber-200 bg-amber-100 text-amber-800';
  return 'border-green-200 bg-green-100 text-green-800';
};

export const buildInitials = (name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'CM';
};
