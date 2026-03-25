// BudgetView: role-aware shell for the Budget tab.
// - clubhouse_manager: sees inventory restock summary + DuesManager
// - player: sees MyDues
// - general_manager: placeholder (future scope)
import { DollarSign } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { DuesManager } from './DuesManager';
import { MyDues } from './MyDues';
import type { AppUser } from '../../types/index';
import type { User } from '../../services/api/users';

interface Props {
  user: AppUser;
  backendUser: User | null;
}

export function BudgetView({ user, backendUser }: Props) {
  if (user.jobRole === 'clubhouse_manager') {
    return (
      <div className="space-y-8 p-8">
        <div>
          <h2 className="text-2xl">Budget & Dues</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage clubhouse finances and collect dues from visiting teams
          </p>
        </div>
        <DuesManager cmTeamId={backendUser?.user_team ?? null} />
      </div>
    );
  }

  if (user.jobRole === 'player') {
    return (
      <div className="space-y-6 p-8">
        <div>
          <h2 className="text-2xl">My Dues</h2>
          <p className="text-sm text-gray-500 mt-1">
            View and pay outstanding clubhouse dues
          </p>
        </div>
        <MyDues />
      </div>
    );
  }

  // General manager — placeholder for future budget reporting
  return (
    <div className="p-8">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg mb-2">Budget Reporting Coming Soon</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            League-wide dues summaries and financial reporting will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
