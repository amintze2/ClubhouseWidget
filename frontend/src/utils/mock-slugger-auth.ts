/**
 * Mock SLUGGER authentication for local development.
 * Sends a mock bootstrap token via postMessage, which the SDK forwards to
 * /api/auth/bootstrap. The serverless function's dev bypass handles tokens
 * starting with 'mock-' without calling the real Slugger API.
 *
 * Only active in development when NOT running inside an iframe.
 */

if (import.meta.env.DEV && typeof window !== 'undefined' && window.self === window.top) {
  setTimeout(() => {
    // Pass ?mockUser=<slugger_user_id> in the URL to log in as a specific DB user.
    // Defaults to 'test-user-123' if not specified.
    const mockUserId = new URLSearchParams(window.location.search).get('mockUser') || 'test-user-123';
    const bootstrapToken = `mock-${mockUserId}`;

    window.postMessage(
      {
        type: 'SLUGGER_AUTH',
        payload: { bootstrapToken },
      },
      '*'
    );

    console.log(`[mock-auth] Logging in as slugger_user_id: ${mockUserId}`);
  }, 100);
}
