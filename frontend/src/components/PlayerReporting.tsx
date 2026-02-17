import { FormEvent, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

type TeamContext = 'home' | 'away';

export function PlayerReporting() {
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null);
  const [description, setDescription] = useState('');
  const [teamError, setTeamError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage('');
    setTeamError('');
    setDescriptionError('');

    let hasError = false;

    if (!teamContext) {
      setTeamError('Please select Home team or Away team.');
      hasError = true;
    }

    if (!description.trim()) {
      setDescriptionError('Description is required.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      teamContext: teamContext as TeamContext,
      description: description.trim(),
      submittedAt: new Date().toISOString(),
    };

    // TODO: send issue to Postgres via AWS API; clubhouse managers will view submissions in a manager dashboard.
    console.log('Player issue payload:', payload);

    await new Promise((resolve) => setTimeout(resolve, 800));

    setTeamContext(null);
    setDescription('');
    setIsSubmitting(false);
    setSubmitMessage('Submitted. Clubhouse managers will review.');
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-2xl">Issue Reporting</h2>
        <p className="mt-1 text-sm text-muted-foreground">Submit concerns directly to clubhouse managers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report an Issue</CardTitle>
          <CardDescription>Share what happened so staff can follow up quickly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Team context</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={teamContext === 'home' ? 'default' : 'outline'}
                  onClick={() => {
                    setTeamContext('home');
                    setTeamError('');
                  }}
                >
                  Home team
                </Button>
                <Button
                  type="button"
                  variant={teamContext === 'away' ? 'default' : 'outline'}
                  onClick={() => {
                    setTeamContext('away');
                    setTeamError('');
                  }}
                >
                  Away team
                </Button>
              </div>
              {teamError && <p className="text-sm text-destructive">{teamError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-description">Description</Label>
              <Textarea
                id="issue-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setDescriptionError('');
                }}
                placeholder="Describe the issue"
                rows={5}
              />
              {descriptionError && <p className="text-sm text-destructive">{descriptionError}</p>}
            </div>

            <div className="space-y-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
              {submitMessage && <p className="text-sm text-muted-foreground">{submitMessage}</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
