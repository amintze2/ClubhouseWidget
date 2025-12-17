/**
 * Mock SLUGGER authentication for local development
 * Only use this when running standalone (not in iframe)
 * 
 * Usage: Import this file in App.tsx during development
 */

// Only use in development and when not in iframe
if (import.meta.env.DEV && typeof window !== 'undefined' && window.self === window.top) {
  // Mock the shell's PostMessage after a short delay
  setTimeout(() => {
    // Create a mock ID token payload
    const mockIdTokenPayload = {
      sub: 'test-user-123',
      email: 'test@example.com',
      email_verified: true,
      given_name: 'Test',
      family_name: 'User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_test',
      aud: 'test-client-id'
    };

    // Encode as JWT (simplified - just base64 encode the payload)
    const encodedPayload = btoa(JSON.stringify(mockIdTokenPayload));
    const mockIdToken = `header.${encodedPayload}.signature`;

    // Send mock SLUGGER_AUTH message
    window.postMessage({
      type: 'SLUGGER_AUTH',
      payload: {
        accessToken: 'mock-access-token',
        idToken: mockIdToken,
        expiresAt: Date.now() + 3600000, // 1 hour from now
        // Include user info for convenience
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'widget developer',
          teamId: 'team-123',
          isAdmin: false
        }
      }
    }, '*');

    console.log('🔧 Mock SLUGGER authentication sent (development only)');
  }, 100);
}

