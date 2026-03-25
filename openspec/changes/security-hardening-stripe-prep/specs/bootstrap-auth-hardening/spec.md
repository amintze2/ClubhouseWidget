## ADDED Requirements

### Requirement: Dev bypass removed from production bootstrap
The bootstrap serverless function SHALL NOT contain any code path that short-circuits Slugger API validation based on token content (e.g., `mock-` prefix checks). Any dev-only auth helpers SHALL be gated by a separate environment variable flag (`ENABLE_MOCK_AUTH=true`) that is never set in production.

#### Scenario: Mock token rejected in production
- **WHEN** a request is made to `/api/auth/bootstrap` with a token starting with `mock-`
- **THEN** the function forwards it to the Slugger API and returns 401 if rejected (no bypass)

#### Scenario: Mock token accepted in local dev only
- **WHEN** `ENABLE_MOCK_AUTH=true` is set AND the environment is not production
- **THEN** mock tokens may be accepted for local development

---

### Requirement: Bootstrap endpoint uses service role key
The bootstrap serverless function SHALL use `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) when interacting with Supabase. The service role key SHALL never be referenced in any client-side code or bundled into the frontend.

#### Scenario: New user upserted on first bootstrap
- **WHEN** a valid Slugger token is bootstrapped for a user not yet in the database
- **THEN** the serverless function successfully upserts the new user row using the service role key

#### Scenario: Service role key not present in client bundle
- **WHEN** the frontend JavaScript bundle is inspected
- **THEN** no `SUPABASE_SERVICE_ROLE_KEY` value is present

---

### Requirement: Bootstrap endpoint rate limited
The system SHALL rate limit requests to `/api/auth/bootstrap` to prevent brute-force and token enumeration. The limit SHALL be no more than 10 requests per IP per minute.

#### Scenario: Rate limit exceeded
- **WHEN** more than 10 requests are made from the same IP within 60 seconds
- **THEN** the endpoint returns HTTP 429 with a `Retry-After` header

#### Scenario: Normal usage not affected
- **WHEN** a single user bootstraps once per session
- **THEN** the request succeeds without rate limiting interference

---

### Requirement: Bootstrap error responses are generic
The bootstrap serverless function SHALL return the same generic error message for all auth failure modes (invalid token, Slugger API unreachable, user not found). Detailed errors SHALL be logged server-side only.

#### Scenario: Invalid token returns generic error
- **WHEN** Slugger rejects the token
- **THEN** the response is `{ "error": "Authentication failed" }` with HTTP 401

#### Scenario: Slugger API unreachable returns generic error
- **WHEN** the Slugger API is not reachable
- **THEN** the response is `{ "error": "Authentication failed" }` with HTTP 401 (not 502)
