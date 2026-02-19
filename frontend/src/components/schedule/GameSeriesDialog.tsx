// Add game series dialog — manages all form state and handlers internally.
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { TimeSelect } from '../TimeSelect';
import { Home, Plane } from 'lucide-react';
import type { GameSeries, FrontendGame } from '../../types/index';

const TEAMS = [
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
];

type GameInput = { date: string; time?: string };

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGameSeries: (series: Omit<GameSeries, 'id'>) => void;
  userTeam: string | undefined;
}

export function GameSeriesDialog({ isOpen, onOpenChange, onAddGameSeries, userTeam }: Props) {
  const opponentTeams = userTeam ? TEAMS.filter(t => t !== userTeam) : TEAMS;
  const getInitialOpponent = () => (userTeam ? (opponentTeams[0] || TEAMS[0]) : TEAMS[1]);

  const [seriesLength, setSeriesLength] = useState<3 | 6>(3);
  const [isHomeGame, setIsHomeGame] = useState(true);
  const [newSeries, setNewSeries] = useState({
    homeTeam: userTeam ? (isHomeGame ? userTeam : getInitialOpponent()) : TEAMS[0],
    visitingTeam: userTeam ? (isHomeGame ? getInitialOpponent() : userTeam) : TEAMS[1],
    games: Array.from({ length: 3 }, () => ({
      date: new Date().toISOString().split('T')[0],
      time: '',
    })) as GameInput[],
  });

  useEffect(() => {
    if (userTeam) {
      setNewSeries(prev => ({
        ...prev,
        homeTeam: isHomeGame ? userTeam : (prev.visitingTeam !== userTeam ? prev.visitingTeam : getInitialOpponent()),
        visitingTeam: isHomeGame ? (prev.homeTeam !== userTeam ? prev.homeTeam : getInitialOpponent()) : userTeam,
      }));
    }
  }, [isHomeGame, userTeam]);

  const handleSeriesLengthToggle = (is6Games: boolean) => {
    const newLength = is6Games ? 6 : 3;
    setSeriesLength(newLength);
    const currentGames = newSeries.games;
    if (newLength > currentGames.length) {
      const additionalGames = Array.from({ length: newLength - currentGames.length }, (_, idx) => {
        const lastGame = currentGames[currentGames.length - 1];
        const [year, month, day] = lastGame.date.split('-').map(Number);
        const nextDate = new Date(year, month - 1, day);
        nextDate.setDate(nextDate.getDate() + idx + 1);
        return { date: nextDate.toISOString().split('T')[0], time: '' };
      });
      setNewSeries({ ...newSeries, games: [...currentGames, ...additionalGames] });
    } else {
      setNewSeries({ ...newSeries, games: currentGames.slice(0, newLength) });
    }
  };

  const handleStartDateChange = (startDateStr: string) => {
    const [year, month, day] = startDateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    const updatedGames = newSeries.games.map((game, index) => {
      const gameDate = new Date(startDate);
      gameDate.setDate(startDate.getDate() + index);
      return { ...game, date: gameDate.toISOString().split('T')[0] };
    });
    setNewSeries({ ...newSeries, games: updatedGames });
  };

  const updateGameInput = (index: number, field: 'date' | 'time', value: string) => {
    const updatedGames = [...newSeries.games];
    updatedGames[index] = { ...updatedGames[index], [field]: value };
    setNewSeries({ ...newSeries, games: updatedGames });
  };

  const handleSubmit = () => {
    if (!newSeries.homeTeam || !newSeries.visitingTeam) return;
    const games: FrontendGame[] = newSeries.games.map((gameInput, index) => {
      const [year, month, day] = gameInput.date.split('-').map(Number);
      return { id: `${Date.now()}-${index}`, date: new Date(year, month - 1, day), time: gameInput.time, gameNumber: index + 1 };
    });
    onAddGameSeries({ homeTeam: newSeries.homeTeam, visitingTeam: newSeries.visitingTeam, games });
    setNewSeries({
      homeTeam: userTeam ? (isHomeGame ? userTeam : getInitialOpponent()) : TEAMS[0],
      visitingTeam: userTeam ? (isHomeGame ? getInitialOpponent() : userTeam) : TEAMS[1],
      games: Array.from({ length: seriesLength }, () => ({ date: new Date().toISOString().split('T')[0], time: '' })),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule a New Game Series</DialogTitle>
          <DialogDescription>Add a series of games to the schedule</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {userTeam && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="home-away-toggle" className="cursor-pointer">Game Location</Label>
                <div className="flex items-center gap-2">
                  <span className={isHomeGame ? 'font-medium flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                    <Home className="h-3 w-3" />Home
                  </span>
                  <Switch
                    id="home-away-toggle"
                    checked={!isHomeGame}
                    onCheckedChange={(checked) => setIsHomeGame(!checked)}
                  />
                  <span className={!isHomeGame ? 'font-medium flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                    <Plane className="h-3 w-3" />Away
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {isHomeGame ? `${userTeam} will host this series` : `${userTeam} will visit for this series`}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="opponent-team">{userTeam ? 'Opponent Team' : 'Home Team'}</Label>
            <select
              id="opponent-team"
              className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
              value={isHomeGame ? newSeries.visitingTeam : newSeries.homeTeam}
              onChange={(e) => {
                if (userTeam) {
                  if (isHomeGame) setNewSeries({ ...newSeries, visitingTeam: e.target.value });
                  else setNewSeries({ ...newSeries, homeTeam: e.target.value });
                } else {
                  setNewSeries({ ...newSeries, homeTeam: e.target.value });
                }
              }}
            >
              {(userTeam ? opponentTeams : TEAMS).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          {!userTeam && (
            <div>
              <Label htmlFor="visiting-team">Visiting Team</Label>
              <select
                id="visiting-team"
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                value={newSeries.visitingTeam}
                onChange={(e) => setNewSeries({ ...newSeries, visitingTeam: e.target.value })}
              >
                {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
              </select>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="series-toggle" className="cursor-pointer">Series Length</Label>
              <div className="flex items-center gap-2">
                <span className={seriesLength === 3 ? 'font-medium' : 'text-gray-500'}>3 Games</span>
                <Switch id="series-toggle" checked={seriesLength === 6} onCheckedChange={handleSeriesLengthToggle} />
                <span className={seriesLength === 6 ? 'font-medium' : 'text-gray-500'}>6 Games</span>
              </div>
            </div>
            <div>
              <Label htmlFor="series-start-date">Series Start Date</Label>
              <Input
                id="series-start-date"
                type="date"
                value={newSeries.games[0]?.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Games will be scheduled on consecutive days starting from this date
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Game Details</Label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {newSeries.games.map((game, index) => (
                <div key={index} className="p-3 border rounded-lg bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Game {index + 1}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`game-${index}-date`} className="text-xs">Date</Label>
                      <Input
                        id={`game-${index}-date`}
                        type="date"
                        value={game.date}
                        onChange={(e) => updateGameInput(index, 'date', e.target.value)}
                      />
                    </div>
                    <TimeSelect
                      id={`game-${index}-time`}
                      label="Time"
                      value={game.time}
                      onChange={(time) => updateGameInput(index, 'time', time)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Game Series</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
