// React hook wrapper around SluggerWidgetSDK.
// - Creates a singleton SDK instance for the widget.
// - Tracks auth state (tokens + decoded user) in React state.
// - Used by AuthContext to integrate SLUGGER auth into the app.
import { useEffect, useState } from 'react';
import { SluggerWidgetSDK, SluggerAuth } from '../services/slugger-widget-sdk';

let sdkInstance: SluggerWidgetSDK | null = null;

export function useSluggerAuth(widgetId: string) {
  const [auth, setAuth] = useState<SluggerAuth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sdkInstance) {
      sdkInstance = new SluggerWidgetSDK({
        widgetId,
        onAuthReady: (auth) => {
          setAuth(auth);
          setLoading(false);
        },
        onAuthError: (err) => {
          setError(err);
          setLoading(false);
        },
      });
    }

    return () => {
      // Don't destroy on unmount - keep singleton
    };
  }, [widgetId]);

  return { 
    auth, 
    loading, 
    error, 
    sdk: sdkInstance,
    user: auth?.user ?? null,
    isAuthenticated: auth !== null
  };
}