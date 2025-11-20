import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Utensils, Plus, Search, Edit, Trash2, AlertCircle, Calendar, Home, Plane } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { GameSeries } from './GameSchedule';

export interface PlayerDietaryInfo {
  id: string;
  name: string;
  number: string;
  restrictions: string[];
  allergies: string[];
  preferences?: string;
  notes?: string;
}

export interface GameMealPlan {
  gameId: string;
  preGameSnack: string;
  postGameMeal: string;
}

interface MealPlanningProps {
  players: PlayerDietaryInfo[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerDietaryInfo[]>>;
  gameSeries: GameSeries[];
  userTeam?: string;
  gameMealPlans: GameMealPlan[];
  setGameMealPlans: React.Dispatch<React.SetStateAction<GameMealPlan[]>>;
}

export function MealPlanning({ players, setPlayers, gameSeries, userTeam, gameMealPlans, setGameMealPlans }: MealPlanningProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerDietaryInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: '',
    restrictions: '',
    allergies: '',
    preferences: '',
    notes: '',
  });

  // Meal planning dialog state
  const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ seriesId: string; gameId: string; date: Date; homeTeam: string; visitingTeam: string } | null>(null);
  const [mealPlanForm, setMealPlanForm] = useState({
    preGameSnack: '',
    postGameMeal: '',
  });

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim() || !newPlayer.number.trim()) {
      return;
    }

    const player: PlayerDietaryInfo = {
      id: Date.now().toString(),
      name: newPlayer.name.trim(),
      number: newPlayer.number.trim(),
      restrictions: newPlayer.restrictions
        .split(',')
        .map(r => r.trim())
        .filter(r => r),
      allergies: newPlayer.allergies
        .split(',')
        .map(a => a.trim())
        .filter(a => a),
      preferences: newPlayer.preferences.trim() || undefined,
      notes: newPlayer.notes.trim() || undefined,
    };

    if (isEditMode && editingPlayer) {
      setPlayers(players.map(p => p.id === editingPlayer.id ? { ...player, id: editingPlayer.id } : p));
    } else {
      setPlayers([...players, player]);
    }

    resetForm();
  };

  const resetForm = () => {
    setNewPlayer({
      name: '',
      number: '',
      restrictions: '',
      allergies: '',
      preferences: '',
      notes: '',
    });
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingPlayer(null);
  };

  const handleEditPlayer = (player: PlayerDietaryInfo) => {
    setEditingPlayer(player);
    setNewPlayer({
      name: player.name,
      number: player.number,
      restrictions: player.restrictions.join(', '),
      allergies: player.allergies.join(', '),
      preferences: player.preferences || '',
      notes: player.notes || '',
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.number.includes(searchQuery)
  );

  // Group players with dietary needs
  const playersWithRestrictions = filteredPlayers.filter(
    p => p.restrictions.length > 0 || p.allergies.length > 0
  );

  // Find next upcoming series
  const getNextUpcomingSeries = () => {
    if (!userTeam) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter series where the user's team is playing
    const teamSeries = gameSeries.filter(
      series => series.homeTeam === userTeam || series.visitingTeam === userTeam
    );

    // Find series with upcoming games
    const upcomingSeries = teamSeries
      .map(series => {
        const upcomingGames = series.games.filter(game => {
          const gameDate = new Date(game.date);
          gameDate.setHours(0, 0, 0, 0);
          return gameDate >= today;
        });
        return { ...series, games: upcomingGames };
      })
      .filter(series => series.games.length > 0)
      .sort((a, b) => {
        const aFirstGame = new Date(a.games[0].date);
        const bFirstGame = new Date(b.games[0].date);
        return aFirstGame.getTime() - bFirstGame.getTime();
      });

    return upcomingSeries[0] || null;
  };

  const nextSeries = getNextUpcomingSeries();

  // Handle meal planning
  const handleOpenMealDialog = (seriesId: string, gameId: string, date: Date, homeTeam: string, visitingTeam: string) => {
    const existingPlan = gameMealPlans.find(plan => plan.gameId === gameId);
    setSelectedGame({ seriesId, gameId, date, homeTeam, visitingTeam });
    setMealPlanForm({
      preGameSnack: existingPlan?.preGameSnack || '',
      postGameMeal: existingPlan?.postGameMeal || '',
    });
    setIsMealDialogOpen(true);
  };

  const handleSaveMealPlan = () => {
    if (!selectedGame) return;

    const existingIndex = gameMealPlans.findIndex(plan => plan.gameId === selectedGame.gameId);
    
    if (existingIndex >= 0) {
      // Update existing plan
      const updated = [...gameMealPlans];
      updated[existingIndex] = {
        gameId: selectedGame.gameId,
        preGameSnack: mealPlanForm.preGameSnack,
        postGameMeal: mealPlanForm.postGameMeal,
      };
      setGameMealPlans(updated);
    } else {
      // Add new plan
      setGameMealPlans([
        ...gameMealPlans,
        {
          gameId: selectedGame.gameId,
          preGameSnack: mealPlanForm.preGameSnack,
          postGameMeal: mealPlanForm.postGameMeal,
        },
      ]);
    }

    setIsMealDialogOpen(false);
    setSelectedGame(null);
  };

  const getMealPlanForGame = (gameId: string) => {
    return gameMealPlans.find(plan => plan.gameId === gameId);
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Meal Planning & Dietary Restrictions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track player dietary restrictions, allergies, and preferences
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Player' : 'Add Player'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update player dietary information' : 'Add a player\'s dietary information'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="player-name">Player Name</Label>
                  <Input
                    id="player-name"
                    placeholder="e.g., John Smith"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="player-number">Jersey #</Label>
                  <Input
                    id="player-number"
                    placeholder="e.g., 24"
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="restrictions">Dietary Restrictions</Label>
                <Input
                  id="restrictions"
                  placeholder="e.g., Vegetarian, Vegan, Gluten-free (comma separated)"
                  value={newPlayer.restrictions}
                  onChange={(e) => setNewPlayer({ ...newPlayer, restrictions: e.target.value })}
                />
                <p className="text-xs text-gray-500">Separate multiple items with commas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  placeholder="e.g., Peanuts, Shellfish, Dairy (comma separated)"
                  value={newPlayer.allergies}
                  onChange={(e) => setNewPlayer({ ...newPlayer, allergies: e.target.value })}
                />
                <p className="text-xs text-gray-500">Separate multiple items with commas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferences">Preferences (Optional)</Label>
                <Input
                  id="preferences"
                  placeholder="e.g., Prefers chicken, dislikes spicy food"
                  value={newPlayer.preferences}
                  onChange={(e) => setNewPlayer({ ...newPlayer, preferences: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional dietary information or special instructions"
                  value={newPlayer.notes}
                  onChange={(e) => setNewPlayer({ ...newPlayer, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleAddPlayer}>
                {isEditMode ? 'Update Player' : 'Add Player'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by player name or number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Upcoming Series Meal Planning */}
      {nextSeries && (
        <div>
          <h3 className="text-lg mb-4">Next Upcoming Series - Meal Planning</h3>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {nextSeries.homeTeam === userTeam ? (
                        <>
                          <Home className="h-4 w-4 text-green-600" />
                          <span>{nextSeries.homeTeam} vs {nextSeries.visitingTeam}</span>
                        </>
                      ) : (
                        <>
                          <Plane className="h-4 w-4 text-orange-600" />
                          <span>{nextSeries.visitingTeam} @ {nextSeries.homeTeam}</span>
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {nextSeries.games.length} game{nextSeries.games.length > 1 ? 's' : ''} • {new Date(nextSeries.games[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(nextSeries.games[nextSeries.games.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {nextSeries.games.map((game, idx) => {
                  const mealPlan = getMealPlanForGame(game.id);
                  const isPlanned = mealPlan && (mealPlan.preGameSnack || mealPlan.postGameMeal);
                  const gameDate = new Date(game.date);
                  
                  return (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 bg-white border-2 border-green-100 rounded-lg hover:border-green-300 transition-all cursor-pointer hover:shadow-md"
                      onClick={() => handleOpenMealDialog(nextSeries.id, game.id, game.date, nextSeries.homeTeam, nextSeries.visitingTeam)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            {nextSeries.homeTeam === userTeam ? (
                              <Badge variant="outline" className="bg-green-100 border-green-300 text-green-900">
                                Home
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-900">
                                Away
                              </Badge>
                            )}
                          </div>
                          {isPlanned ? (
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                              {mealPlan.preGameSnack && (
                                <div className="flex items-start gap-1">
                                  <span className="font-medium">Pre-game:</span>
                                  <span className="truncate">{mealPlan.preGameSnack}</span>
                                </div>
                              )}
                              {mealPlan.postGameMeal && (
                                <div className="flex items-start gap-1">
                                  <span className="font-medium">Post-game:</span>
                                  <span className="truncate">{mealPlan.postGameMeal}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Click to plan meals</p>
                          )}
                        </div>
                      </div>
                      <div>
                        {isPlanned ? (
                          <Badge className="bg-green-600">Planned</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Not Planned</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Meal Planning Dialog */}
      <Dialog open={isMealDialogOpen} onOpenChange={setIsMealDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Plan Meals for Game</DialogTitle>
            {selectedGame && (
              <DialogDescription>
                {new Date(selectedGame.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                <br />
                {selectedGame.homeTeam === userTeam ? (
                  <span className="text-green-600">🏠 Home vs {selectedGame.visitingTeam}</span>
                ) : (
                  <span className="text-orange-600">✈️ Away @ {selectedGame.homeTeam}</span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pre-game-snack">Pre-Game Snack</Label>
              <Textarea
                id="pre-game-snack"
                placeholder="e.g., Fruit platter, energy bars, sandwiches..."
                value={mealPlanForm.preGameSnack}
                onChange={(e) => setMealPlanForm({ ...mealPlanForm, preGameSnack: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-gray-500">Light snacks served before the game</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-game-meal">Post-Game Meal</Label>
              <Textarea
                id="post-game-meal"
                placeholder="e.g., Chicken, rice, vegetables, pasta..."
                value={mealPlanForm.postGameMeal}
                onChange={(e) => setMealPlanForm({ ...mealPlanForm, postGameMeal: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-gray-500">Full meal served after the game</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMealDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMealPlan}>
              Save Meal Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Card */}
      {players.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Dietary Summary</CardTitle>
                <CardDescription>
                  {playersWithRestrictions.length} of {players.length} players have dietary requirements
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Players with Dietary Restrictions */}
      {playersWithRestrictions.length > 0 && (
        <div>
          <h3 className="text-lg mb-4">Players with Dietary Needs</h3>
          <div className="grid gap-4">
            {playersWithRestrictions.map((player) => (
              <Card key={player.id} className="border-2 border-orange-100 bg-orange-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-orange-600 text-white flex items-center justify-center">
                          #{player.number}
                        </div>
                        <div>
                          <h4 className="font-semibold">{player.name}</h4>
                          <p className="text-sm text-gray-600">Jersey #{player.number}</p>
                        </div>
                      </div>

                      {player.restrictions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions:</p>
                          <div className="flex flex-wrap gap-2">
                            {player.restrictions.map((restriction, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-100 border-blue-300 text-blue-900">
                                {restriction}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {player.allergies.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Allergies:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {player.allergies.map((allergy, idx) => (
                              <Badge key={idx} variant="outline" className="bg-red-100 border-red-300 text-red-900">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {player.preferences && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-700">Preferences:</p>
                          <p className="text-sm text-gray-600">{player.preferences}</p>
                        </div>
                      )}

                      {player.notes && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-700">Notes:</p>
                          <p className="text-sm text-gray-600">{player.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPlayer(player)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePlayer(player.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Players Section */}
      {filteredPlayers.filter(p => p.restrictions.length === 0 && p.allergies.length === 0).length > 0 && (
        <div>
          <h3 className="text-lg mb-4">Players with No Dietary Restrictions</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {filteredPlayers
                  .filter(p => p.restrictions.length === 0 && p.allergies.length === 0)
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-600 text-white flex items-center justify-center">
                          #{player.number}
                        </div>
                        <div>
                          <h4 className="font-medium">{player.name}</h4>
                          <p className="text-sm text-gray-600">Jersey #{player.number}</p>
                          {player.preferences && (
                            <p className="text-sm text-gray-500 mt-1">
                              Preferences: {player.preferences}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPlayer(player)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePlayer(player.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {players.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Utensils className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg mb-2">No Players Added</h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-4">
              Start by adding players and their dietary information to help with meal planning.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {players.length > 0 && filteredPlayers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg mb-2">No players found</h3>
            <p className="text-sm text-gray-500">Try a different search term</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
