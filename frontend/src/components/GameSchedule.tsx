// Game schedule management for the user's team.
// - Displays series of games grouped by opponent and date.
// - Allows adding new series (creates multiple game records) and deleting existing ones.
// - Provides data for other views (checklist, calendar, meal planning).
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, Home, Plane } from 'lucide-react';
import { formatTime12Hour } from '../utils/timeFormat';
import type { GameSeries, FrontendGame } from '../types/index';
import { GameSeriesDialog } from './schedule/GameSeriesDialog';
import { GameCalendar } from './schedule/GameCalendar';

// Re-export for backward-compat with existing importers.
export type { GameSeries };
export type { FrontendGame as Game };

interface GameScheduleProps {
  gameSeries: GameSeries[];
  onAddGameSeries: (series: Omit<GameSeries, 'id'>) => void;
  onDeleteGameSeries: (seriesId: string) => void;
  userTeam?: string;
}

export function GameSchedule({ gameSeries, onAddGameSeries, onDeleteGameSeries, userTeam }: GameScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredGameSeries = userTeam
    ? gameSeries.filter(s => s.homeTeam === userTeam || s.visitingTeam === userTeam)
    : gameSeries;

  const getGamesForDate = (date: Date | undefined) => {
    if (!date) return [];
    return filteredGameSeries
      .flatMap(series => series.games.map(game => ({ game, series })))
      .filter(({ game }) => game.date.toDateString() === date.toDateString())
      .sort((a, b) => {
        if (!a.game.time && !b.game.time) return 0;
        if (!a.game.time) return 1;
        if (!b.game.time) return -1;
        return a.game.time.localeCompare(b.game.time);
      });
  };

  const selectedDateGames = getGamesForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <GameCalendar
          gameSeries={gameSeries}
          userTeam={userTeam}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Games for Selected Date */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedDate
                    ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Select a date'}
                </CardTitle>
                <CardDescription>
                  {selectedDateGames.length} {selectedDateGames.length === 1 ? 'game' : 'games'} scheduled
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Series
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {selectedDateGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-500">
                  <CalendarIcon className="h-12 w-12 mb-4 text-gray-300" />
                  <p>No games scheduled for this day</p>
                  <p className="text-sm mt-2">Click "Add Series" to create one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateGames.map(({ game, series }) => {
                    const isHome = userTeam ? series.homeTeam === userTeam : false;
                    const borderColor = userTeam
                      ? (isHome ? 'border-l-green-600' : 'border-l-orange-600')
                      : 'border-l-blue-600';
                    return (
                      <Card key={game.id} className={`shadow-sm border-l-4 ${borderColor}`}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary">Game {game.gameNumber}</Badge>
                                  {game.time && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime12Hour(game.time)}
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Home className={`h-4 w-4 ${isHome ? 'text-green-600' : 'text-blue-600'}`} />
                                    <span className="font-medium">{series.homeTeam}</span>
                                    <span className="text-xs text-gray-500">vs</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Plane className={`h-4 w-4 ${!isHome && userTeam ? 'text-orange-600' : 'text-gray-400'}`} />
                                    <span className="font-medium">{series.visitingTeam}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteGameSeries(series.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* All Upcoming Games */}
      <Card>
        <CardHeader>
          <CardTitle>All Upcoming Games</CardTitle>
          <CardDescription>
            {userTeam ? `All games for ${userTeam}` : 'Overview of all scheduled games'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {filteredGameSeries
                .flatMap(series => series.games.map(game => ({ game, series })))
                .filter(({ game }) => game.date >= new Date(new Date().setHours(0, 0, 0, 0)))
                .sort((a, b) => {
                  const dateCompare = a.game.date.getTime() - b.game.date.getTime();
                  if (dateCompare !== 0) return dateCompare;
                  if (!a.game.time && !b.game.time) return 0;
                  if (!a.game.time) return 1;
                  if (!b.game.time) return -1;
                  return a.game.time.localeCompare(b.game.time);
                })
                .map(({ game, series }) => {
                  const isHome = userTeam ? series.homeTeam === userTeam : false;
                  const borderColor = userTeam
                    ? (isHome ? 'border-l-green-600' : 'border-l-orange-600')
                    : 'border-l-blue-600';
                  return (
                    <div
                      key={game.id}
                      className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-l-4 ${borderColor}`}
                      onClick={() => setSelectedDate(game.date)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-gray-500">
                            {game.date.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-2xl font-bold">{game.date.getDate()}</div>
                          <div className="text-xs text-gray-500">
                            {game.date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">Game {game.gameNumber}</Badge>
                            {game.time && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime12Hour(game.time)}
                              </Badge>
                            )}
                            {userTeam && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                {series.homeTeam === userTeam ? (
                                  <><Home className="h-3 w-3" />Home</>
                                ) : (
                                  <><Plane className="h-3 w-3" />Away</>
                                )}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{series.homeTeam}</span>
                            <span className="text-xs text-gray-500">vs</span>
                            <span className="font-medium">{series.visitingTeam}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteGameSeries(series.id); }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <GameSeriesDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddGameSeries={onAddGameSeries}
        userTeam={userTeam}
      />
    </div>
  );
}
