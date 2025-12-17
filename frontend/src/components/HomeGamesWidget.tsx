import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarIcon, Clock, Home } from 'lucide-react';
import { GameSeries } from './GameSchedule';
import { formatTime12Hour } from '../utils/timeFormat';

interface HomeGamesWidgetProps {
  gameSeries: GameSeries[];
  teamName: string;
}

export function HomeGamesWidget({ gameSeries, teamName }: HomeGamesWidgetProps) {
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter games for this team's home games
  const homeGames = gameSeries
    .filter(series => series.homeTeam === teamName)
    .flatMap(series => 
      series.games.map(game => ({
        ...game,
        visitingTeam: series.visitingTeam,
        homeTeam: series.homeTeam,
      }))
    )
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

  // Find today's game
  const todayGame = homeGames.find(game => {
    const gameDate = new Date(game.date);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate.getTime() === today.getTime();
  });

  // Find next upcoming game (after today)
  const nextGame = homeGames.find(game => {
    const gameDate = new Date(game.date);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate.getTime() > today.getTime();
  });

  const formatGameDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <CardTitle>Home Game Schedule</CardTitle>
            <CardDescription>Games at {teamName} stadium</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {todayGame ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <Badge className="bg-blue-600 mb-2">Game Today</Badge>
                <h4 className="mb-1">{teamName} vs {todayGame.visitingTeam}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formatGameDate(todayGame.date)}</span>
                  </div>
                  {todayGame.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime12Hour(todayGame.time)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : nextGame ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <Badge variant="outline" className="mb-2">Next Home Game</Badge>
                <h4 className="mb-1">{teamName} vs {nextGame.visitingTeam}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formatGameDate(nextGame.date)}</span>
                  </div>
                  {nextGame.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime12Hour(nextGame.time)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">No scheduled home games</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
