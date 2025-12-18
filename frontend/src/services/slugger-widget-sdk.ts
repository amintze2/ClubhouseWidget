// Lightweight SDK for integrating a widget with the SLUGGER shell via postMessage.
// - Sends a \"SLUGGER_WIDGET_READY\" event when the widget loads.
// - Listens for \"SLUGGER_AUTH\" messages containing JWT tokens and user info.
// - Exposes helper methods to access auth state and make authenticated fetches.
export interface SluggerUser {
    id: string;          // Cognito sub or database user ID
    email: string;
    emailVerified?: boolean;
    firstName?: string;
    lastName?: string;
    /** User role: 'admin' | 'widget developer' | 'league' | 'master' */
    role?: string;
    /** Team ID if user belongs to a team */
    teamId?: string;
    /** Role within the team */
    teamRole?: string;
    /** Whether user has site admin privileges */
    isAdmin?: boolean;
  }
  
  export interface SluggerAuth {
    accessToken: string;
    idToken: string;
    expiresAt: number;
    user: SluggerUser;
  }
  
  export interface SluggerWidgetSDKOptions {
    /** Unique identifier for your widget */
    widgetId: string;
    
    /** Called when authentication is ready */
    onAuthReady?: (auth: SluggerAuth) => void;
    
    /** Called when authentication fails or is revoked */
    onAuthError?: (error: string) => void;
    
    /** Called when tokens are refreshed */
    onTokenRefresh?: (auth: SluggerAuth) => void;
    
    /** Allowed origins for the shell (defaults to SLUGGER domains) */
    allowedOrigins?: string[];
    
    /** Base URL for API calls (defaults to shell origin) */
    apiBaseUrl?: string;
  }
  
  export class SluggerWidgetSDK {
    private auth: SluggerAuth | null = null;
    private options: Required<SluggerWidgetSDKOptions>;
    private shellOrigin: string | null = null;
    private readyPromise: Promise<SluggerAuth>;
    private readyResolve!: (auth: SluggerAuth) => void;
    private readyReject!: (error: Error) => void;
  
    constructor(options: SluggerWidgetSDKOptions) {
      this.options = {
        allowedOrigins: [
          'http://localhost:3000',
          'http://slugger-alb-1518464736.us-east-2.elb.amazonaws.com',
          'https://alpb-analytics.com',
          'https://www.alpb-analytics.com'
        ],
        apiBaseUrl: '',
        onAuthReady: () => {},
        onAuthError: () => {},
        onTokenRefresh: () => {},
        ...options
      };
  
      // Create a promise that resolves when auth is ready
      this.readyPromise = new Promise((resolve, reject) => {
        this.readyResolve = resolve;
        this.readyReject = reject;
      });
  
      this.init();
    }
  
    private init(): void {
      // Listen for messages from shell
      window.addEventListener('message', this.handleMessage.bind(this));
  
      // Signal that widget is ready
      this.sendReady();
  
      // Set timeout for auth
      setTimeout(() => {
        if (!this.auth) {
          const error = 'Authentication timeout - no tokens received from shell';
          this.options.onAuthError(error);
          this.readyReject(new Error(error));
        }
      }, 10000); // 10 second timeout
    }
  
    private handleMessage(event: MessageEvent): void {
      // Validate origin
      if (!this.options.allowedOrigins.includes(event.origin)) {
        return;
      }
  
      if (event.data?.type === 'SLUGGER_AUTH') {
        this.shellOrigin = event.origin;
        this.processAuth(event.data.payload);
      }
    }
  
    private processAuth(payload: {
      accessToken: string;
      idToken: string;
      expiresAt: number;
    }): void {
      try {
        const user = this.decodeIdToken(payload.idToken);
        
        this.auth = {
          accessToken: payload.accessToken,
          idToken: payload.idToken,
          expiresAt: payload.expiresAt,
          user
        };
  
        // Set API base URL from shell origin if not specified
        if (!this.options.apiBaseUrl && this.shellOrigin) {
          this.options.apiBaseUrl = this.shellOrigin;
        }
  
        // Notify listeners
        if (this.readyResolve) {
          this.readyResolve(this.auth);
        }
        this.options.onAuthReady(this.auth);
  
        // Schedule token refresh
        this.scheduleTokenRefresh();
  
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process auth';
        this.options.onAuthError(message);
        this.readyReject(new Error(message));
      }
    }
  
    private decodeIdToken(idToken: string): SluggerUser {
      try {
        const payload = idToken.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        
        return {
          id: decoded.sub,
          email: decoded.email,
          emailVerified: decoded.email_verified ?? false,
          firstName: decoded.given_name,
          lastName: decoded.family_name
        };
      } catch {
        throw new Error('Failed to decode ID token');
      }
    }
  
    private scheduleTokenRefresh(): void {
      if (!this.auth) return;
  
      // Refresh 5 minutes before expiry
      const refreshTime = this.auth.expiresAt - Date.now() - (5 * 60 * 1000);
      
      if (refreshTime > 0) {
        setTimeout(() => {
          this.requestTokenRefresh();
        }, refreshTime);
      }
    }
  
    private sendReady(): void {
      window.parent.postMessage({
        type: 'SLUGGER_WIDGET_READY',
        widgetId: this.options.widgetId
      }, '*');
    }
  
    /**
     * Request fresh tokens from the shell
     */
    public requestTokenRefresh(): void {
      window.parent.postMessage({
        type: 'SLUGGER_TOKEN_REFRESH'
      }, this.shellOrigin || '*');
    }
  
    /**
     * Wait for authentication to be ready
     */
    public async waitForAuth(): Promise<SluggerAuth> {
      return this.readyPromise;
    }
  
    /**
     * Check if authenticated
     */
    public isAuthenticated(): boolean {
      return this.auth !== null && Date.now() < this.auth.expiresAt;
    }
  
    /**
     * Get current auth state
     */
    public getAuth(): SluggerAuth | null {
      return this.auth;
    }
  
    /**
     * Get current user
     */
    public getUser(): SluggerUser | null {
      return this.auth?.user ?? null;
    }
  
    /**
     * Get access token for API calls
     */
    public getAccessToken(): string | null {
      if (!this.auth || Date.now() >= this.auth.expiresAt) {
        return null;
      }
      return this.auth.accessToken;
    }
  
    /**
     * Make an authenticated fetch request
     */
    public async fetch(
      path: string,
      options: RequestInit = {}
    ): Promise<Response> {
      const token = this.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated or token expired');
      }
  
      const url = path.startsWith('http') 
        ? path 
        : `${this.options.apiBaseUrl}${path}`;
  
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  
    /**
     * Cleanup - call when widget unmounts
     */
    public destroy(): void {
      window.removeEventListener('message', this.handleMessage.bind(this));
    }
  }
  
  // Default export for convenience
  export default SluggerWidgetSDK;