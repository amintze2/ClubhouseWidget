import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Utensils, Calendar, Home, Plane } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { GameSeries } from './GameSchedule';
import { mealsApi, Meal } from '../services/api';

export interface PlayerDietaryInfo {
  id: string;
  name: string;
  number: string;
  restrictions: string[];
  allergies: string[];
  preferences?: string;
  notes?: string;
}

interface MealPlanningProps {
  players: PlayerDietaryInfo[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerDietaryInfo[]>>;
  gameSeries: GameSeries[];
  userTeam?: string;
  gameMealPlans: { gameId: string; preGameSnack: string; postGameMeal: string }[];
  setGameMealPlans: React.Dispatch<React.SetStateAction<{ gameId: string; preGameSnack: string; postGameMeal: string }[]>>;
}

export function MealPlanning({ players, setPlayers, gameSeries, userTeam, gameMealPlans, setGameMealPlans }: MealPlanningProps) {
  const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ seriesId: string; gameId: string; date: Date; homeTeam: string; visitingTeam: string } | null>(null);
  const [mealPlanForm, setMealPlanForm] = useState({
    preGameSnack: '',
    postGameMeal: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  // Get all home games for user's team (only home games for meal planning)
  const getTeamGames = () => {
    if (!userTeam) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter series where the user's team is the home team
    const homeSeries = gameSeries.filter(
      series => series.homeTeam === userTeam
    );

    // Get all games from these home series, sorted by date
    const homeGames = homeSeries
      .flatMap(series => 
        series.games.map(game => ({
          ...game,
          seriesId: series.id,
          homeTeam: series.homeTeam,
          visitingTeam: series.visitingTeam,
        }))
      )
      .sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        return aDate.getTime() - bDate.getTime();
      });

    return homeGames;
  };

  const teamGames = getTeamGames();

  // Load meals from database
  useEffect(() => {
    const loadMeals = async () => {
      const games = getTeamGames();
      if (games.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const gameIds = games.map(game => parseInt(game.id));
        const meals = await mealsApi.getMealsByGameIds(gameIds);
        
        // Convert meals to gameMealPlans format
        const mealPlans = meals.map(meal => ({
          gameId: meal.game_id.toString(),
          preGameSnack: meal.pre_game_snack || '',
          postGameMeal: meal.post_game_meal || '',
        }));
        
        setGameMealPlans(mealPlans);
      } catch (error) {
        console.error('Failed to load meals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSeries, userTeam]);

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

  const handleSaveMealPlan = async () => {
    if (!selectedGame) return;

    try {
      setIsSaving(true);
      const gameId = parseInt(selectedGame.gameId);
      
      // Save to database
      await mealsApi.upsertMeal(gameId, {
        pre_game_snack: mealPlanForm.preGameSnack || null,
        post_game_meal: mealPlanForm.postGameMeal || null,
      });

      // Update local state
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
    } catch (error) {
      console.error('Failed to save meal plan:', error);
      alert('Failed to save meal plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getMealPlanForGame = (gameId: string) => {
    return gameMealPlans.find(plan => plan.gameId === gameId);
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Meal Planning</h2>
        <p className="text-sm text-gray-500 mt-1">
          Plan meals for home games
        </p>
      </div>

      {/* All Games Meal Planning */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading meals...</p>
          </CardContent>
        </Card>
      ) : teamGames.length > 0 ? (
        <div>
          <h3 className="text-lg mb-4">Meal Planning for {userTeam}</h3>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Home Games</CardTitle>
                  <CardDescription>
                    {teamGames.length} home game{teamGames.length > 1 ? 's' : ''} scheduled
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {teamGames.map((game, idx) => {
                  const mealPlan = getMealPlanForGame(game.id);
                  const isPlanned = mealPlan && (mealPlan.preGameSnack || mealPlan.postGameMeal);
                  const gameDate = new Date(game.date);
                  
                  return (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 bg-white border-2 border-green-100 rounded-lg hover:border-green-300 transition-all cursor-pointer hover:shadow-md"
                      onClick={() => handleOpenMealDialog(game.seriesId, game.id, game.date, game.homeTeam, game.visitingTeam)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <Badge variant="outline" className="bg-green-100 border-green-300 text-green-900">
                              <Home className="h-3 w-3 mr-1" />
                              Home
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {game.homeTeam} vs {game.visitingTeam}
                            </span>
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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg mb-2">No Home Games Scheduled</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              No home games are scheduled for {userTeam || 'your team'}. Add home games in the Game Schedule tab to plan meals.
            </p>
          </CardContent>
        </Card>
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
                <span className="text-green-600">🏠 Home vs {selectedGame.visitingTeam}</span>
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
            <Button variant="outline" onClick={() => setIsMealDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveMealPlan} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Meal Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
