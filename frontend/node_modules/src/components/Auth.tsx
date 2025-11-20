import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ClipboardList } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AuthProps {
  onAuthSuccess: (user: { id: string; email: string; username: string; jobRole: string }) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpJobRole, setSignUpJobRole] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    console.log('Attempting sign in for email:', signInEmail);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) {
        console.error('Sign in error details:', error);
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials or create an account using the Sign Up tab.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else {
          setError(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user && data.session) {
        console.log('Sign in successful for user:', data.user.id);
        const username = data.user.user_metadata?.username || 'User';
        const jobRole = data.user.user_metadata?.job_role || 'Staff';
        
        onAuthSuccess({
          id: data.user.id,
          email: data.user.email || '',
          username,
          jobRole,
        });
      }
    } catch (err) {
      console.error('Sign in catch error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    const demoEmail = 'demo@clubhouse.com';
    const demoPassword = 'demo123456';

    console.log('Attempting demo account creation/login...');

    try {
      // First, try to sign in with demo account
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (!signInError && signInData.user && signInData.session) {
        console.log('Demo sign in successful');
        const username = signInData.user.user_metadata?.username || 'Demo User';
        const jobRole = signInData.user.user_metadata?.job_role || 'clubhouse_manager';
        
        onAuthSuccess({
          id: signInData.user.id,
          email: signInData.user.email || '',
          username,
          jobRole,
        });
        return;
      }

      // If sign in failed, create the demo account
      console.log('Demo account does not exist, creating...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bf148105/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: demoEmail,
            password: demoPassword,
            username: 'Demo User',
            jobRole: 'clubhouse_manager',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error('Demo account creation failed:', result);
        setError('Failed to create demo account. Please try signing up manually.');
        setIsLoading(false);
        return;
      }

      // Wait a moment for the account to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now sign in with demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        console.error('Demo sign in error after creation:', error);
        setError('Demo account created! Please click "Try Demo Account" again.');
        setIsLoading(false);
        return;
      }

      if (data.user && data.session) {
        console.log('Demo account created and signed in successfully');
        onAuthSuccess({
          id: data.user.id,
          email: data.user.email || '',
          username: 'Demo User',
          jobRole: 'clubhouse_manager',
        });
      }
    } catch (err) {
      console.error('Demo login error:', err);
      setError('Failed to access demo account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!signUpJobRole) {
      setError('Please select a job role');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bf148105/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: signUpEmail,
            password: signUpPassword,
            username: signUpUsername,
            jobRole: signUpJobRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error('Signup API error:', result);
        const errorMsg = result.error || 'Failed to create account';
        if (errorMsg.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(errorMsg);
        }
        setIsLoading(false);
        return;
      }

      console.log('Signup successful, attempting auto sign-in...');

      // Wait a brief moment for the user to be fully created in the database
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now sign in with the new credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signUpEmail,
        password: signUpPassword,
      });

      if (error) {
        console.error('Auto sign in error after signup:', error);
        // Clear form and show success message, asking user to sign in manually
        setSignUpEmail('');
        setSignUpUsername('');
        setSignUpPassword('');
        setSignUpJobRole('');
        setSuccessMessage('Account created successfully! Please switch to the Sign In tab and log in with your credentials.');
        setIsLoading(false);
        return;
      }

      if (data.user && data.session) {
        console.log('Auto sign-in successful');
        onAuthSuccess({
          id: data.user.id,
          email: data.user.email || '',
          username: signUpUsername,
          jobRole: signUpJobRole,
        });
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 mb-4">
            <ClipboardList className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl mb-2">Clubhouse Manager</h1>
          <p className="text-gray-600">Baseball Operations Management System</p>
        </div>

        <Tabs defaultValue="signin" className="w-full" onValueChange={() => { setError(''); setSuccessMessage(''); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>New here?</strong> Switch to the Sign Up tab to create an account first.
                  </p>
                </div>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  {successMessage && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                      {successMessage}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or</span>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading Demo...' : 'Try Demo Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Sign up to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="johndoe"
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-jobrole">Job Role</Label>
                    <Select value={signUpJobRole} onValueChange={setSignUpJobRole} disabled={isLoading}>
                      <SelectTrigger id="signup-jobrole">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">Player</SelectItem>
                        <SelectItem value="general_staff">General Staff</SelectItem>
                        <SelectItem value="general_manager">General Manager</SelectItem>
                        <SelectItem value="clubhouse_manager">Clubhouse Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  {successMessage && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                      {successMessage}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
