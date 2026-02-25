import type { Issue } from '../../services/api';

export type TeamContextFilter = 'all' | 'home' | 'away';
export type ReportStatusFilter = 'all' | 'New' | 'In Progress' | 'Resolved';
export type ReportStatus = 'New' | 'In Progress' | 'Resolved';

export interface DisplayIssue extends Issue {
  status: ReportStatus;
}

export type Report = DisplayIssue;

export type ReportComment = {
  id: string;
  reportId: string;
  authorRole: 'clubhouse_manager' | 'general_manager';
  authorName: string;
  authorInitials: string;
  createdAt: string;
  body: string;
};
