import { useMemo, useState } from 'react';
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

type TeamContextFilter = 'all' | 'home' | 'away';
type ReportStatusFilter = 'all' | 'New' | 'In Progress' | 'Resolved';
type ReportStatus = 'New' | 'In Progress' | 'Resolved';

interface PlayerReport {
  id: string;
  submittedAt: string;
  playerName: string;
  teamContext: 'home' | 'away';
  description: string;
  status: ReportStatus;
}

const initialReports: PlayerReport[] = [
  {
    id: 'r1',
    submittedAt: '2026-02-10T08:15:00Z',
    playerName: 'Test Player',
    teamContext: 'home',
    description: 'Clubhouse shower in locker row B has no hot water after practice.',
    status: 'New',
  },
  {
    id: 'r2',
    submittedAt: '2026-02-10T12:40:00Z',
    playerName: 'John Smith',
    teamContext: 'away',
    description: 'Only two clean towels were left in my locker before team stretch.',
    status: 'In Progress',
  },
  {
    id: 'r3',
    submittedAt: '2026-02-11T15:05:00Z',
    playerName: 'Marcus Lee',
    teamContext: 'home',
    description: 'Pre-game meal did not include the gluten-free option listed in preferences.',
    status: 'New',
  },
  {
    id: 'r4',
    submittedAt: '2026-02-11T17:20:00Z',
    playerName: 'David Chen',
    teamContext: 'away',
    description: 'Bus snack cooler was missing hydration packets during travel.',
    status: 'Resolved',
  },
  {
    id: 'r5',
    submittedAt: '2026-02-12T07:55:00Z',
    playerName: 'Alex Rivera',
    teamContext: 'home',
    description: 'Training room ice machine ran out before morning recovery block.',
    status: 'In Progress',
  },
  {
    id: 'r6',
    submittedAt: '2026-02-12T10:30:00Z',
    playerName: 'Chris Johnson',
    teamContext: 'away',
    description: 'Requested dairy-free breakfast option was not available today.',
    status: 'New',
  },
  {
    id: 'r7',
    submittedAt: '2026-02-12T13:10:00Z',
    playerName: 'Samuel Wright',
    teamContext: 'home',
    description: 'Batting gloves drying rack is broken and not rotating air.',
    status: 'Resolved',
  },
  {
    id: 'r8',
    submittedAt: '2026-02-12T16:45:00Z',
    playerName: 'Ethan Brooks',
    teamContext: 'away',
    description: 'Need clearer labeling for nut-free post-game snacks in the clubhouse.',
    status: 'New',
  },
];

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStatusBadgeClass = (status: ReportStatus) => {
  if (status === 'New') {
    return 'border-red-200 bg-red-100 text-red-800';
  }
  if (status === 'In Progress') {
    return 'border-amber-200 bg-amber-100 text-amber-800';
  }
  return 'border-green-200 bg-green-100 text-green-800';
};

export function ManagerPlayerReports() {
  const [reports, setReports] = useState<PlayerReport[]>(initialReports);
  const [teamFilter, setTeamFilter] = useState<TeamContextFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? null;

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesTeam = teamFilter === 'all' ? true : report.teamContext === teamFilter;
      const matchesStatus = statusFilter === 'all' ? true : report.status === statusFilter;
      return matchesTeam && matchesStatus;
    });
  }, [reports, teamFilter, statusFilter]);

  const handleStatusUpdate = (reportId: string, nextStatus: ReportStatus) => {
    // TODO: send report status updates to Postgres via AWS API.
    setReports((prev) =>
      prev.map((report) => (report.id === reportId ? { ...report, status: nextStatus } : report)),
    );
    setStatusUpdateMessage(`Status updated to ${nextStatus}.`);
    setSelectedReportId(null);
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team-filter">Team Context</Label>
              <Select value={teamFilter} onValueChange={(value) => setTeamFilter(value as TeamContextFilter)}>
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
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReportStatusFilter)}>
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Team Context</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{formatTimestamp(report.submittedAt)}</TableCell>
                  <TableCell>{report.playerName}</TableCell>
                  <TableCell className="capitalize">{report.teamContext}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadgeClass(report.status)}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.description}</TableCell>
                  <TableCell>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedReportId(report.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={selectedReport !== null} onOpenChange={(open) => !open && setSelectedReportId(null)}>
        <DialogContent>
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedReport.playerName}</DialogTitle>
                <DialogDescription>
                  Submitted {formatTimestamp(selectedReport.submittedAt)} | {selectedReport.teamContext} context
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">{selectedReport.status}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusUpdate(selectedReport.id, 'In Progress')}
                >
                  Mark In Progress
                </Button>
                <Button type="button" onClick={() => handleStatusUpdate(selectedReport.id, 'Resolved')}>
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
