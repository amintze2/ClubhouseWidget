import { FormEvent, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Textarea } from './ui/textarea';

type IssueType = 'Facility' | 'Dietary Restrictions' | 'Other';

type FormErrors = {
  title?: string;
  description?: string;
};

const mockUpcomingTasks = [
  { id: 't1', date: 'Feb 10, 2026', time: '8:30 AM', title: 'Morning Stretch & Mobility' },
  { id: 't2', date: 'Feb 10, 2026', time: '12:15 PM', title: 'Team Meeting (Clubhouse)' },
  { id: 't3', date: 'Feb 11, 2026', time: '3:00 PM', title: 'Pre-Game Arrival Window' },
  { id: 't4', date: 'Feb 12, 2026', time: '9:00 AM', title: 'Recovery Session' },
];

const mockUpcomingMeals = [
  { id: 'm1', date: 'Feb 10, 2026', meal: 'Lunch', menu: 'Grilled chicken bowls + fruit' },
  { id: 'm2', date: 'Feb 10, 2026', meal: 'Post-Workout Snack', menu: 'Protein shake + banana' },
  { id: 'm3', date: 'Feb 11, 2026', meal: 'Pre-Game Meal', menu: 'Pasta, turkey meatballs, vegetables' },
  { id: 'm4', date: 'Feb 12, 2026', meal: 'Breakfast', menu: 'Egg scramble, oatmeal, berries' },
];

export function PlayerInfo() {
  const [issueType, setIssueType] = useState<IssueType>('Facility');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isDietaryIssue = issueType === 'Dietary Restrictions';

  const handleSyncGoogleCalendar = () => {
    // TODO: Implement Google Calendar sync (OAuth + calendar event creation).
    console.log('Google Calendar sync clicked');
  };

  const handleIssueTypeChange = (value: string) => {
    const selectedType = value as IssueType;
    setIssueType(selectedType);
    setSubmitSuccess(false);
    setErrors({});

    if (selectedType === 'Dietary Restrictions') {
      setTitle('Dietary Restriction');
      return;
    }

    if (title === 'Dietary Restriction') {
      setTitle('');
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!isDietaryIssue && !title.trim()) {
      nextErrors.title = 'Title is required for Facility and Other issues.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmitIssue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      issueType,
      title: isDietaryIssue ? 'Dietary Restriction' : title.trim(),
      description: description.trim(),
      submittedAt: new Date().toISOString(),
    };

    // TODO: send issue to Postgres via AWS API; clubhouse managers will view submissions in a manager dashboard.
    console.log('Player issue submission payload:', payload);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (isDietaryIssue) {
      setTitle('Dietary Restriction');
    } else {
      setTitle('');
    }
    setDescription('');
    setErrors({});
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  return (
    <div className="space-y-6 p-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Task Calendar</CardTitle>
              <CardDescription>Upcoming clubhouse tasks and events (read-only).</CardDescription>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleSyncGoogleCalendar}>
              Sync to Google Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUpcomingTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.date}</TableCell>
                  <TableCell>{task.time}</TableCell>
                  <TableCell>{task.title}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meal Planning</CardTitle>
          <CardDescription>Upcoming clubhouse meals (read-only).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Meal</TableHead>
                <TableHead>Menu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUpcomingMeals.map((meal) => (
                <TableRow key={meal.id}>
                  <TableCell>{meal.date}</TableCell>
                  <TableCell>{meal.meal}</TableCell>
                  <TableCell>{meal.menu}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issue Reporting</CardTitle>
          <CardDescription>Submit concerns directly to clubhouse managers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitIssue}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issue-type">Issue Type</Label>
                <Select value={issueType} onValueChange={handleIssueTypeChange}>
                  <SelectTrigger id="issue-type">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facility">Facility</SelectItem>
                    <SelectItem value="Dietary Restrictions">Dietary Restrictions</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose the category that best matches your issue.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-title">Title</Label>
                <Input
                  id="issue-title"
                  value={isDietaryIssue ? 'Dietary Restriction' : title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setSubmitSuccess(false);
                    if (errors.title) {
                      setErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  placeholder="Brief summary"
                  disabled={isDietaryIssue}
                  required={!isDietaryIssue}
                />
                {isDietaryIssue && (
                  <p className="text-sm text-muted-foreground">
                    Title is set automatically for dietary submissions.
                  </p>
                )}
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-description">
                  {isDietaryIssue ? 'Allergy or Restriction Details' : 'Description'}
                </Label>
                <Textarea
                  id="issue-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setSubmitSuccess(false);
                    if (errors.description) {
                      setErrors((prev) => ({ ...prev, description: undefined }));
                    }
                  }}
                  placeholder={
                    isDietaryIssue
                      ? 'List foods to avoid, severity, and timing (for example pre-game, post-game, or daily).'
                      : 'Provide details for clubhouse managers.'
                  }
                  rows={4}
                  required
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Issue'}
              </Button>

              {submitSuccess && (
                <Alert>
                  <AlertTitle>Submitted</AlertTitle>
                  <AlertDescription>
                    Your issue was submitted successfully.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
