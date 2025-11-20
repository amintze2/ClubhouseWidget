import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users, UserCog, Briefcase, ChevronRight } from 'lucide-react';

interface MockLoginProps {
  onRoleSelect: (role: 'player' | 'clubhouse_manager' | 'general_manager', team?: string) => void;
}

export function MockLogin({ onRoleSelect }: MockLoginProps) {
  const [step, setStep] = useState<'team' | 'role'>('team');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'player' | 'clubhouse_manager' | 'general_manager' | null>(null);

  const atlanticLeagueTeams = [
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

  const roles = [
    {
      id: 'player' as const,
      title: 'Player',
      description: 'Access your personal schedule and clubhouse information',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      id: 'clubhouse_manager' as const,
      title: 'Clubhouse Manager',
      description: 'Manage daily operations, checklists, and team coordination',
      icon: UserCog,
      color: 'bg-green-500',
    },
    {
      id: 'general_manager' as const,
      title: 'General Manager',
      description: 'Oversee all operations and team management',
      icon: Briefcase,
      color: 'bg-purple-500',
    },
  ];

  const handleContinueToRole = () => {
    if (selectedTeam) {
      setStep('role');
    }
  };

  const handleContinueToDashboard = () => {
    if (selectedRole && selectedTeam) {
      onRoleSelect(selectedRole, selectedTeam);
    }
  };

  const handleBack = () => {
    setStep('team');
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <UserCog className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl mb-2">Clubhouse Management System</h1>
          <p className="text-gray-600">
            {step === 'team' ? 'Select your team to continue' : 'Select your role to continue'}
          </p>
        </div>

        {/* Step 1: Team Selection */}
        {step === 'team' && (
          <>
            <Card className="mb-8 max-w-md mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      1
                    </div>
                    <CardTitle>Select Your Team</CardTitle>
                  </div>
                </div>
                <CardDescription>Choose your Atlantic League team</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {atlanticLeagueTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                size="lg"
                onClick={handleContinueToRole}
                disabled={!selectedTeam}
                className="px-8"
              >
                Continue to Role Selection
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Role Selection */}
        {step === 'role' && (
          <>
            <div className="bg-white rounded-lg p-4 mb-6 max-w-md mx-auto border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Selected Team</p>
                  <p className="font-medium">{selectedTeam}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleBack}>
                  Change Team
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;

                return (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-blue-600 shadow-lg' : ''
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 ${role.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle>{role.title}</CardTitle>
                      <CardDescription className="text-center">
                        {role.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant={isSelected ? 'default' : 'outline'}
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRole(role.id);
                        }}
                      >
                        {isSelected ? 'Selected' : 'Select Role'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center space-y-3">
              <Button
                size="lg"
                onClick={handleContinueToDashboard}
                disabled={!selectedRole}
                className="px-8"
              >
                Continue to Dashboard
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <div>
                <Button variant="ghost" onClick={handleBack}>
                  Back to Team Selection
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
