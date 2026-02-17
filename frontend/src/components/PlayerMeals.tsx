import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

const mockUpcomingMeals = [
  { id: 'm1', date: 'Feb 10, 2026', meal: 'Lunch', menu: 'Grilled chicken bowls + fruit' },
  { id: 'm2', date: 'Feb 10, 2026', meal: 'Post-Workout Snack', menu: 'Protein shake + banana' },
  { id: 'm3', date: 'Feb 11, 2026', meal: 'Pre-Game Meal', menu: 'Pasta, turkey meatballs, vegetables' },
  { id: 'm4', date: 'Feb 12, 2026', meal: 'Breakfast', menu: 'Egg scramble, oatmeal, berries' },
];

export function PlayerMeals() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-2xl">Meal Schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upcoming clubhouse meals.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meals</CardTitle>
          <CardDescription>Planned meals and snacks for upcoming days.</CardDescription>
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
    </div>
  );
}
