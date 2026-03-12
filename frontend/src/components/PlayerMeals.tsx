import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerMeals } from '../hooks/usePlayerMeals';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

const formatGameDate = (date: string | null) => {
  if (!date) return '-';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;
  return parsedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export function PlayerMeals() {
  const { user } = useAuth();
  const { mealSchedule, loading, error } = usePlayerMeals(user?.user_team);

  const titleText = useMemo(() => {
    return user?.team_name ? `${user.team_name} Meal Schedule` : 'Meal Schedule';
  }, [user?.team_name]);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-2xl">{titleText}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Meal plans for games where your team is playing and meals are already planned.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Meal Schedule</CardTitle>
          <CardDescription>Pre-game snacks and post-game meals from clubhouse planning.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading meal schedule...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Home/Away</TableHead>
                  <TableHead>Pre-Game Snack</TableHead>
                  <TableHead>Post-Game Meal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealSchedule.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No meals have been planned yet for your team.
                    </TableCell>
                  </TableRow>
                ) : (
                  mealSchedule.map((meal) => (
                    <TableRow key={meal.gameId}>
                      <TableCell>{formatGameDate(meal.date)}</TableCell>
                      <TableCell>{meal.opponentName}</TableCell>
                      <TableCell>
                        <Badge variant={meal.isHome ? 'default' : 'outline'}>
                          {meal.isHome ? 'Home' : 'Away'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px] whitespace-pre-wrap break-words">
                        {meal.preGameSnack || '-'}
                      </TableCell>
                      <TableCell className="max-w-[280px] whitespace-pre-wrap break-words">
                        {meal.postGameMeal || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
