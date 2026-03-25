## ADDED Requirements

### Requirement: Comprehensive Content Security Policy headers
The app SHALL set a Content Security Policy header that covers `script-src`, `style-src`, `connect-src`, `img-src`, and `frame-ancestors` directives. The policy SHALL be consistent between the Vercel production config (`vercel.json`) and the Vite dev server config (`vite.config.ts`).

#### Scenario: Inline scripts blocked in production
- **WHEN** a browser loads the production app
- **THEN** the CSP `script-src 'self'` directive prevents execution of any inline or external scripts not served from the same origin

#### Scenario: Supabase API calls allowed
- **WHEN** the app makes a fetch request to the Supabase URL
- **THEN** `connect-src` includes the Supabase project URL and the request is not blocked

#### Scenario: Slugger API calls allowed
- **WHEN** the bootstrap serverless function or SDK communicates with `https://alpb-analytics.com`
- **THEN** `connect-src` includes the Slugger domain

#### Scenario: Unauthorized external script blocked
- **WHEN** an injected script tag references an external CDN domain
- **THEN** the browser blocks the script due to `script-src 'self'`

---

### Requirement: postMessage allowed origins exclude internal infrastructure
The `allowedOrigins` list in `slugger-widget-sdk.ts` SHALL NOT contain internal AWS infrastructure URLs (e.g., ALB hostnames). The list SHALL contain only public-facing domains. The `http://localhost` entry SHALL be excluded from production builds.

#### Scenario: Production build rejects internal ALB origin
- **WHEN** a postMessage arrives from the internal AWS ALB hostname in a production environment
- **THEN** the SDK rejects the message (origin not in allowed list)

#### Scenario: Localhost accepted in dev only
- **WHEN** running the Vite dev server with `import.meta.env.DEV === true`
- **THEN** `http://localhost:3000` is included in allowed origins

#### Scenario: Production build allowed origins are public only
- **WHEN** the production bundle is inspected
- **THEN** only `https://alpb-analytics.com` and `https://www.alpb-analytics.com` appear in the origins list

---

### Requirement: Mock auth excluded from production builds
`mock-slugger-auth.ts` SHALL NOT be imported or executed in production builds. Any import of this file SHALL be wrapped in `import.meta.env.DEV` or an equivalent Vite build-time guard.

#### Scenario: Mock auth not present in production bundle
- **WHEN** the production build is analyzed
- **THEN** `mock-slugger-auth.ts` code is not present in the output bundle

#### Scenario: Mock auth available in development
- **WHEN** `npm run dev` is running
- **THEN** the mock auth flow works as expected for local testing
