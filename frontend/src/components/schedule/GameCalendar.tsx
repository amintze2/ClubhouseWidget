// Calendar card with home/away game day modifiers for the game schedule.
import { Calendar } from '../ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { GameSeries } from '../../types/index';

interface Props {
  gameSeries: GameSeries[];
  userTeam?: string;
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export function GameCalendar({ gameSeries, userTeam, selectedDate, onSelectDate }: Props) {
  const filteredSeries = userTeam
    ? gameSeries.filter(s => s.homeTeam === userTeam || s.visitingTeam === userTeam)
    : gameSeries;

  const getDaysWithHomeGames = () => {
    if (!userTeam) return [];
    return filteredSeries
      .filter(s => s.homeTeam === userTeam)
      .flatMap(s => s.games.map(g => g.date));
  };

  const getDaysWithAwayGames = () => {
    if (!userTeam) return [];
    return filteredSeries
      .filter(s => s.visitingTeam === userTeam)
      .flatMap(s => s.games.map(g => g.date));
  };

  const getDaysWithGames = () =>
    filteredSeries.flatMap(s => s.games.map(g => g.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Schedule Calendar</CardTitle>
        <CardDescription>
          {userTeam ? `Games for ${userTeam}` : 'View and manage game series'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          className="rounded-md border"
          modifiers={{
            hasHomeGame: getDaysWithHomeGames(),
            hasAwayGame: getDaysWithAwayGames(),
            hasGame: userTeam ? [] : getDaysWithGames(),
          }}
          modifiersStyles={{
            hasHomeGame: { fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#15803d' },
            hasAwayGame: { fontWeight: 'bold', backgroundColor: '#fed7aa', color: '#c2410c' },
            hasGame:     { fontWeight: 'bold', backgroundColor: '#dbeafe', color: '#1e40af' },
          }}
        />
      </CardContent>
    </Card>
  );
}
