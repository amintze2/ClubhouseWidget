// Authentication + user-data context for the frontend app.
// - Decides between SLUGGER-based auth (iframe) and standalone login (local).
// - Looks up the current user in Supabase by slugger_user_id.
// - Loads joined user data (tasks, inventory, team) and exposes it to the app.
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, userApi, UserWithData, setSluggerSDK } from '../services/api';
import { useSluggerAuth } from '../hooks/useSluggerAuth';
import { SluggerUser, SluggerAuth } from '../services/slugger-widget-sdk';

interface AuthContextType {
  user: User | null;
  userData: UserWithData | null;
  loading: boolean;
  login: (sluggerUserId: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Check if running in iframe (SLUGGER shell)
const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserWithData | null>(null);
  const [loading, setLoading] = useState(true);

  // SLUGGER authentication (when in iframe)
  const { auth: sluggerAuth, user: sluggerUser, loading: sluggerLoading, error: sluggerError, sdk } = useSluggerAuth('clubhouse-management');

  // Set SDK in API service when available
  useEffect(() => {
    if (sdk) {
      setSluggerSDK(sdk);
    }
  }, [sdk]);

  // Load user from SLUGGER when authenticated
  useEffect(() => {
    if (isInIframe && sluggerUser && sluggerAuth && sdk && !sluggerLoading) {
      loadUserFromSlugger(sluggerUser, sluggerAuth);
    } else if (!isInIframe) {
      // Not in iframe - use manual login
      loadUserFromStorage();
    } else if (isInIframe && sluggerError) {
      // Auth error in iframe - must check before the "still loading" branch
      setLoading(false);
    } else if (isInIframe && !sluggerLoading && !sluggerUser) {
      // In iframe but no auth yet - still loading
      setLoading(true);
    }
  }, [sluggerUser, sluggerAuth, sluggerLoading, sluggerError, sdk]);

  const loadUserFromSlugger = async (sluggerUser: SluggerUser, auth: SluggerAuth) => {
    try {
      setLoading(true);
      // The bootstrap endpoint already upserted and returned the DB user record.
      // Use it directly to skip a redundant Supabase lookup when available.
      const sessionData = auth.sessionData;
      if (sessionData?.id) {
        const fullUserData = await userApi.getUserWithData(sessionData.id);
        setUser(sessionData as unknown as User);
        setUserData(fullUserData);
      } else {
        // Fallback: two-step lookup (standalone / old flow)
        const backendUser = await userApi.getUserBySluggerId(sluggerUser.id);
        const fullUserData = await userApi.getUserWithData(backendUser.id);
        setUser(backendUser);
        setUserData(fullUserData);
      }
    } catch (error) {
      console.error('Failed to load user from SLUGGER:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserFromStorage = async () => {
    try {
      const savedUserId = localStorage.getItem('currentUserId');
      const savedSluggerId = localStorage.getItem('currentSluggerId');
      
      if (savedUserId && savedSluggerId) {
        const userId = parseInt(savedUserId);
        const userData = await userApi.getUserWithData(userId);
        setUser(userData);
        setUserData(userData);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('currentSluggerId');
    } finally {
      setLoading(false);
    }
  };

  // Load user from localStorage on mount (only if not in iframe)
  useEffect(() => {
    if (!isInIframe) {
      loadUserFromStorage();
    }
  }, []);

  const login = async (sluggerUserId: string) => {
    if (isInIframe) {
      throw new Error('Manual login not available when running in SLUGGER shell');
    }
    
    try {
      setLoading(true);
      const loggedInUser = await userApi.getUserBySluggerId(sluggerUserId);
      const fullUserData = await userApi.getUserWithData(loggedInUser.id);
      
      setUser(loggedInUser);
      setUserData(fullUserData);
      
      // Save to localStorage
      localStorage.setItem('currentUserId', loggedInUser.id.toString());
      localStorage.setItem('currentSluggerId', sluggerUserId);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setUserData(null);
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentSluggerId');
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      const fullUserData = await userApi.getUserWithData(user.id);
      setUserData(fullUserData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  // Combine loading states
  const combinedLoading = isInIframe ? (sluggerLoading || loading) : loading;

  return (
    <AuthContext.Provider value={{ user, userData, loading: combinedLoading, login, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
