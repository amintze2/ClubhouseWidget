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
    window.postMessage(
      {
        type: 'SLUGGER_AUTH',
        payload: {
          // The SDK checks payload.bootstrapToken first (new protocol).
          // This value is recognized by the /api/auth/bootstrap dev bypass.
          bootstrapToken: 'mock-bootstrap-token-test-user-123',
        },
      },
      '*'
    );

    console.log('🔧 Mock SLUGGER bootstrap token sent (development only)');
  }, 100);
}
