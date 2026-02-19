// Lightweight SDK for integrating a widget with the SLUGGER shell via postMessage.
// Bootstrap token flow (new):
//   1. Sends "SLUGGER_WIDGET_READY" when the widget loads.
//   2. Listens for "SLUGGER_AUTH" containing a short-lived bootstrap token.
//   3. Validates event.origin, then immediately forwards the token to our backend
//      (/api/auth/bootstrap) — it is NEVER stored in localStorage/sessionStorage.
//   4. Our backend validates with Slugger's API, upserts the user, and returns
//      session data which is held in memory only.

export interface SluggerUser {
  id: string;          // slugger_user_id (Cognito sub)
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  teamId?: string;
  teamRole?: string;
  isAdmin?: boolean;
}

export interface SluggerAuth {
  user: SluggerUser;
  /** Raw DB user record returned from /api/auth/bootstrap — held in memory only */
  sessionData: Record<string, any>;
}

export interface SluggerWidgetSDKOptions {
  /** Unique identifier for your widget */
  widgetId: string;

  /** Called when authentication is ready */
  onAuthReady?: (auth: SluggerAuth) => void;

  /** Called when authentication fails */
  onAuthError?: (error: string) => void;

  /** Allowed origins for the shell (defaults to SLUGGER domains) */
  allowedOrigins?: string[];

  /** Base URL for backend API calls (default '' = same-origin Vercel function) */
  backendBaseUrl?: string;
}

export class SluggerWidgetSDK {
  private auth: SluggerAuth | null = null;
  private options: Required<SluggerWidgetSDKOptions>;
  private shellOrigin: string | null = null;
  private readyPromise: Promise<SluggerAuth>;
  private readyResolve!: (auth: SluggerAuth) => void;
  private readyReject!: (error: Error) => void;
  private messageHandler: (event: MessageEvent) => void;

  constructor(options: SluggerWidgetSDKOptions) {
    this.options = {
      allowedOrigins: [
        'http://localhost:3000',
        'http://slugger-alb-1518464736.us-east-2.elb.amazonaws.com',
        'https://alpb-analytics.com',
        'https://www.alpb-analytics.com',
      ],
      backendBaseUrl: '',
      onAuthReady: () => {},
      onAuthError: () => {},
      ...options,
    };

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    // Bind once so removeEventListener works correctly in destroy()
    this.messageHandler = this.handleMessage.bind(this);

    this.init();
  }

  private init(): void {
    window.addEventListener('message', this.messageHandler);
    this.sendReady();

    // 10-second timeout if no auth received
    setTimeout(() => {
      if (!this.auth) {
        const error = 'Authentication timeout - no token received from shell';
        this.options.onAuthError(error);
        this.readyReject(new Error(error));
      }
    }, 10000);
  }

  private handleMessage(event: MessageEvent): void {
    if (!this.options.allowedOrigins.includes(event.origin)) {
      return;
    }

    if (event.data?.type === 'SLUGGER_AUTH') {
      this.shellOrigin = event.origin;
      // Don't await — fire-and-forget with internal error handling
      this.processAuth(event.data.payload).catch((err) => {
        const message = err instanceof Error ? err.message : 'Auth processing failed';
        this.options.onAuthError(message);
        this.readyReject(new Error(message));
      });
    }
  }

  private async processAuth(payload: Record<string, any>): Promise<void> {
    // Accept 'bootstrapToken' (new Slugger protocol) or fall back to 'accessToken'
    // (for backward-compat while WIDGET-AUTH.md is pending). Narrow once confirmed.
    const bootstrapToken: string | undefined =
      payload?.bootstrapToken ?? payload?.accessToken;

    if (!bootstrapToken) {
      throw new Error('No bootstrap token found in SLUGGER_AUTH payload');
    }

    // Forward the bootstrap token to our backend immediately — never store it.
    const endpoint = `${this.options.backendBaseUrl}/api/auth/bootstrap`;
    let result: { sluggerUserId: string; user: Record<string, any> };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: bootstrapToken }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Bootstrap endpoint returned ${response.status}`);
      }

      result = await response.json();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to reach bootstrap endpoint'
      );
    }

    const { sluggerUserId, user: sessionData } = result;

    this.auth = {
      user: {
        id: sluggerUserId,
        email: sessionData.email,
        firstName: sessionData.given_name ?? sessionData.user_name?.split(' ')[0],
        lastName: sessionData.family_name ?? sessionData.user_name?.split(' ').slice(1).join(' '),
      },
      sessionData,
    };

    this.readyResolve(this.auth);
    this.options.onAuthReady(this.auth);
  }

  private sendReady(): void {
    window.parent.postMessage(
      { type: 'SLUGGER_WIDGET_READY', widgetId: this.options.widgetId },
      '*'
    );
  }

  /** Wait for authentication to be ready */
  public async waitForAuth(): Promise<SluggerAuth> {
    return this.readyPromise;
  }

  /** Check if authenticated (session data present in memory) */
  public isAuthenticated(): boolean {
    return this.auth !== null;
  }

  /** Get current auth state */
  public getAuth(): SluggerAuth | null {
    return this.auth;
  }

  /** Get current user */
  public getUser(): SluggerUser | null {
    return this.auth?.user ?? null;
  }

  /** Cleanup — call when widget unmounts */
  public destroy(): void {
    window.removeEventListener('message', this.messageHandler);
  }
}

export default SluggerWidgetSDK;
