import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { issuesApi } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

type TeamContext = 'home' | 'away';

const AWAY_TEAMS = [
  'Lancaster Stormers',
  'Long Island Ducks',
  'York Revolution',
  'Staten Island Ferry Hawks',
  'Hagerstown Flying Boxcars',
  'Gastonia Ghost Peppers',
  'High Point Rockers',
  'Lexington Legends',
  'Southern Maryland Blue Crabs',
  'Charleston Dirty Birds',
  'Team 11',
  'Team 12',
];

export function PlayerReporting() {
  const { user } = useAuth();
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null);
  const [awayTeam, setAwayTeam] = useState('');
  const [description, setDescription] = useState('');
  const [teamError, setTeamError] = useState('');
  const [awayTeamError, setAwayTeamError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage('');
    setTeamError('');
    setAwayTeamError('');
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

    if (teamContext === 'away' && !awayTeam) {
      setAwayTeamError('Please select the away team.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await issuesApi.createIssue({
        player_id: user?.id ?? null,
        player_team: user?.team_name ?? (user?.user_team != null ? String(user.user_team) : null),
        team_context: teamContext as TeamContext,
        away_team: teamContext === 'away' ? awayTeam : null,
        description: description.trim(),
      });

      setTeamContext(null);
      setAwayTeam('');
      setDescription('');
      setSubmitMessage('Submitted. Clubhouse managers will review.');
    } catch (err) {
      setSubmitMessage('Something went wrong. Please try again.');
      console.error('Failed to submit issue:', err);
    } finally {
      setIsSubmitting(false);
    }
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
                    setAwayTeam('');
                    setAwayTeamError('');
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
              {teamContext === 'away' && (
                <div className="mt-3">
                  <Select
                    value={awayTeam}
                    onValueChange={(value) => {
                      setAwayTeam(value);
                      setAwayTeamError('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select away team" />
                    </SelectTrigger>
                    <SelectContent>
                      {AWAY_TEAMS.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {awayTeamError && <p className="mt-2 text-sm text-destructive">{awayTeamError}</p>}
                </div>
              )}
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
