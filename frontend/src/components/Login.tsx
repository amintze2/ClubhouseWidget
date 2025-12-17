import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserCog, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Check if running in iframe (SLUGGER shell)
const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

export function Login() {
  const [sluggerUserId, setSluggerUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Don't show login when in iframe (SLUGGER handles auth)
  if (isInIframe) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(sluggerUserId);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your slugger_user_id.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <UserCog className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl mb-2">Clubhouse Management System</h1>
          <p className="text-gray-600">Enter your Slugger User ID to continue</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your slugger_user_id to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slugger-user-id">Slugger User ID</Label>
                <Input
                  id="slugger-user-id"
                  name="sluggerUserId"
                  type="text"
                  required
                  value={sluggerUserId}
                  onChange={(e) => setSluggerUserId(e.target.value)}
                  placeholder="Enter your slugger_user_id"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !sluggerUserId}
                className="w-full"
                size="lg"
              >
                {loading ? 'Logging in...' : 'Continue to Dashboard'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

