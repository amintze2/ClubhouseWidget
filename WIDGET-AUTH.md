# Slugger Widget Authentication Integration Guide

---

## Overview

Your widget is embedded inside a Slugger platform page as an `<iframe>`. When a logged-in Slugger user opens a page containing your widget, Slugger will automatically send a **short-lived identity token** to your iframe via the browser's `postMessage` API.

Your widget uses this token to call Slugger's `/api/users/me` endpoint and receive the current user's identity (ID, email, role, team, etc.), allowing you to identify the user within your own system.

```
Slugger (parent page)
  └─ postMessage "SLUGGER_AUTH" → your iframe (child page)
       └─ your frontend → your backend  POST /api/bootstrap
            └─ GET https://alpb-analytics.com/api/users/me
                 Authorization: Bearer <bootstrapToken>
                 └─ returns { id, email, role, teamId, … }
                      └─ UPSERT to your DB → return user to frontend
```

**Core security principle: the token never appears in any URL — it is passed once, in memory, via `postMessage`.**

---

## Three things you need to implement

| Step | Where | What |
|------|-------|------|
| Step 1 | Your frontend | Listen for the `SLUGGER_AUTH` message from Slugger and extract `bootstrapToken` |
| Step 2 | Your backend | Use `bootstrapToken` to call Slugger's `/api/users/me` and upsert the user |
| Step 3 | Your server config | Set `Content-Security-Policy: frame-ancestors` to allow Slugger to embed your widget |

---

## Step 1: Frontend — receive the token

Add a `message` event listener to your widget's main page or component.

### 1a. Tell Slugger "I'm ready" after the page loads

**You must send this first — otherwise Slugger doesn't know when to send you a token.**

```js
// React example
useEffect(() => {
  const SLUGGER_ORIGINS = [
    "https://alpb-analytics.com",
    "https://www.alpb-analytics.com",
    "http://localhost:3000", // development only
  ];

  // Send to each possible Slugger origin (do NOT use '*')
  SLUGGER_ORIGINS.forEach((origin) => {
    window.parent.postMessage(
      { type: "SLUGGER_WIDGET_READY", widgetId: "your-widget-id" },
      origin
    );
  });
}, []);
```

### 1b. Listen for the token from Slugger

```js
useEffect(() => {
  const SLUGGER_ORIGINS = [
    "https://alpb-analytics.com",
    "https://www.alpb-analytics.com",
    "http://localhost:3000", // development only
  ];

  function onMessage(event) {
    // ✅ Security check 1: always validate the origin
    if (!SLUGGER_ORIGINS.includes(event.origin)) return;

    // ✅ Security check 2: validate message format
    const { type, payload } = event.data || {};
    if (type !== "SLUGGER_AUTH" || !payload?.bootstrapToken) return;

    // ✅ Send bootstrapToken to your own backend immediately
    fetch("/api/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bootstrapToken: payload.bootstrapToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        // data.user = { id, email, firstName, lastName, role, teamId }
        setCurrentUser(data.user);
      })
      .catch(console.error);
  }

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}, []);
```

### SLUGGER_AUTH payload shape

```json
{
  "type": "SLUGGER_AUTH",
  "payload": {
    "bootstrapToken": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": "42",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "league",
      "teamId": "5",
      "isAdmin": false
    },
    "expiresAt": 1234567890000
  }
}
```

> **`bootstrapToken` is valid for 5 minutes.** Send it to your backend immediately upon receipt — do not store it in the frontend.

---

## Step 2: Backend — exchange the token for user info

Your backend receives the `bootstrapToken`, calls Slugger's `/api/users/me` to verify it, and saves the user into your own database.

### Endpoint spec

```
GET https://alpb-analytics.com/api/users/me
Authorization: Bearer <bootstrapToken>
```

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "league",
    "teamId": 5,
    "teamRole": "manager",
    "isAdmin": false
  }
}
```

**User roles:**

| role | Description |
|------|-------------|
| `admin` | Slugger platform administrator |
| `league` | League staff member |
| `widget developer` | Widget developer |
| `user` | Standard user |

**Error responses:**

| HTTP Status | message | How to handle |
|-------------|---------|---------------|
| `401` | `Bootstrap token expired` | Token is older than 5 min — frontend should send `SLUGGER_TOKEN_REFRESH` |
| `401` | `Invalid bootstrap token` | Token is invalid — reject the request |
| `404` | `User not found` | User does not exist in Slugger's database |

### Backend implementation example (Node.js / Express)

```js
app.post("/api/bootstrap", async (req, res) => {
  const { bootstrapToken } = req.body;

  if (!bootstrapToken) {
    return res.status(400).json({ error: "bootstrapToken is required" });
  }

  // 1. Call Slugger /me to verify the user's identity
  const sluggerRes = await fetch("https://alpb-analytics.com/api/users/me", {
    headers: { Authorization: `Bearer ${bootstrapToken}` },
  });

  if (!sluggerRes.ok) {
    const err = await sluggerRes.json();
    return res.status(401).json({ error: err.message || "Invalid token" });
  }

  const { data: sluggerUser } = await sluggerRes.json();
  // sluggerUser = { id, email, firstName, lastName, role, teamId, isAdmin }

  // 2. Upsert into your own database (use sluggerId as the unique key)
  const user = await db.users.upsert({
    where:  { sluggerId: sluggerUser.id },
    update: {
      email:  sluggerUser.email,
      role:   sluggerUser.role,
      teamId: sluggerUser.teamId,
    },
    create: {
      sluggerId: sluggerUser.id,
      email:     sluggerUser.email,
      firstName: sluggerUser.firstName,
      lastName:  sluggerUser.lastName,
      role:      sluggerUser.role,
      teamId:    sluggerUser.teamId,
    },
  });

  // 3. Create your own session (depends on your auth setup)
  req.session.userId = user.id;

  return res.json({ user });
});
```

### Token refresh

If your widget runs for longer than 5 minutes, request a new token from the parent page:

```js
window.parent.postMessage(
  { type: "SLUGGER_TOKEN_REFRESH", widgetId: "your-widget-id" },
  sluggerOrigin // save this from the original event.origin you received
);
// Slugger will respond with a fresh SLUGGER_AUTH message
```

---

## Step 3: Server config — allow Slugger to embed your widget

Your site must explicitly allow Slugger's domains to embed it via iframe, otherwise browsers will block it with a `Refused to display` error.

### Next.js

```js
// next.config.mjs
async headers() {
  return [{
    source: "/(.*)",
    headers: [{
      key: "Content-Security-Policy",
      value: "frame-ancestors 'self' https://alpb-analytics.com https://www.alpb-analytics.com",
    }],
  }];
}
```

### nginx

```nginx
add_header Content-Security-Policy "frame-ancestors 'self' https://alpb-analytics.com https://www.alpb-analytics.com";
```

### Express.js

```js
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://alpb-analytics.com https://www.alpb-analytics.com"
  );
  next();
});
```

> **Do not set `X-Frame-Options: DENY`** — this will prevent your widget from being embedded in Slugger.

---

## postMessage Protocol Reference

| Direction | type | Sender | When | Description |
|-----------|------|--------|------|-------------|
| child → parent | `SLUGGER_WIDGET_READY` | Your widget | Immediately on mount | "I am ready to receive tokens" |
| parent → child | `SLUGGER_AUTH` | Slugger | After receiving READY | Delivers `bootstrapToken` and basic user info |
| child → parent | `SLUGGER_TOKEN_REFRESH` | Your widget | When token is near expiry | "Please refresh and resend the token" |

---

## Local Development Testing

1. Start your widget's local server (e.g. `http://localhost:4000`)
2. Ask the Slugger platform team to whitelist your widget's domain in the backend config
3. Log in to Slugger: `http://localhost:3000/sign-in`
4. Open the integration test page: `http://localhost:3000/widget-test`
   - Change the Widget URL field to your local address (e.g. `http://localhost:4000`)
   - Watch the auth status and Event Log inside the iframe
5. You can also open DevTools → Console and filter by `[WidgetFrame]` for detailed logs
