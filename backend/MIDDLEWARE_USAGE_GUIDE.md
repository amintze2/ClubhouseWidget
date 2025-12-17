# Middleware Usage Guide

This guide shows you how to apply the SLUGGER JWT authentication middleware to your routes.

## Basic Pattern

### 1. Import the Middleware

```typescript
import { verifySluggerToken } from '../middleware/auth';
```

### 2. Apply to Routes

Add `verifySluggerToken` as a middleware parameter before your route handler:

```typescript
// Before (no authentication)
router.get('/some-route', async (req: Request, res: Response) => {
  // ...
});

// After (with authentication)
router.get('/some-route', verifySluggerToken, async (req: Request, res: Response) => {
  // req.user is now available!
  const sluggerUserId = req.user?.sub;
  // ...
});
```

## Accessing User Information

After applying the middleware, you can access the authenticated user via `req.user`:

```typescript
router.get('/protected-route', verifySluggerToken, async (req: Request, res: Response) => {
  // Get SLUGGER user ID (Cognito user ID)
  const sluggerUserId = req.user?.sub;
  
  // Get email
  const email = req.user?.email;
  
  // Get other user info
  const givenName = req.user?.given_name;
  const familyName = req.user?.family_name;
  
  // Find your database user by slugger_user_id
  const { data: user } = await supabase
    .from('user')
    .select('*')
    .eq('slugger_user_id', sluggerUserId)
    .single();
});
```

## Common Patterns

### Pattern 1: Get Current User's Data

Create routes that use `/me` to get the current authenticated user's data:

```typescript
// Get current user
router.get('/me', verifySluggerToken, async (req: Request, res: Response) => {
  const sluggerUserId = req.user?.sub;
  
  const { data: user } = await supabase
    .from('user')
    .select('*')
    .eq('slugger_user_id', sluggerUserId)
    .single();
    
  res.json(user);
});

// Get current user's tasks
router.get('/me/tasks', verifySluggerToken, async (req: Request, res: Response) => {
  const sluggerUserId = req.user?.sub;
  
  // Find database user
  const { data: user } = await supabase
    .from('user')
    .select('id')
    .eq('slugger_user_id', sluggerUserId)
    .single();
    
  // Get user's tasks
  const { data: tasks } = await supabase
    .from('task')
    .select('*')
    .eq('user_id', user.id);
    
  res.json(tasks);
});
```

### Pattern 2: Protect Write Operations

Protect POST, PUT, DELETE routes:

```typescript
// Create task (protected)
router.post('/tasks', verifySluggerToken, async (req: Request, res: Response) => {
  const sluggerUserId = req.user?.sub;
  
  // Find database user
  const { data: user } = await supabase
    .from('user')
    .select('id')
    .eq('slugger_user_id', sluggerUserId)
    .single();
    
  // Create task for this user
  const { data: task } = await supabase
    .from('task')
    .insert([{ ...req.body, user_id: user.id }])
    .select()
    .single();
    
  res.status(201).json(task);
});
```

### Pattern 3: Verify Ownership

When updating/deleting resources, verify they belong to the authenticated user:

```typescript
// Update task (with ownership verification)
router.put('/tasks/:id', verifySluggerToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const sluggerUserId = req.user?.sub;
  
  // Find database user
  const { data: user } = await supabase
    .from('user')
    .select('id')
    .eq('slugger_user_id', sluggerUserId)
    .single();
    
  // Verify task belongs to this user
  const { data: task } = await supabase
    .from('task')
    .select('user_id')
    .eq('id', id)
    .single();
    
  if (task && task.user_id !== user.id) {
    return res.status(403).json({ error: 'Forbidden: Cannot update other user\'s tasks' });
  }
  
  // Update task
  const { data: updatedTask } = await supabase
    .from('task')
    .update(req.body)
    .eq('id', id)
    .select()
    .single();
    
  res.json(updatedTask);
});
```

### Pattern 4: Optional Authentication

Use `verifySluggerTokenOrManual` for routes that support both SLUGGER tokens and manual authentication:

```typescript
import { verifySluggerTokenOrManual } from '../middleware/auth';

router.get('/flexible-route', verifySluggerTokenOrManual, async (req: Request, res: Response) => {
  // If Bearer token provided, req.user will be set
  // Otherwise, you can check for manual auth (e.g., slugger_user_id in query)
  const sluggerUserId = req.user?.sub || req.query.slugger_user_id;
  // ...
});
```

## Examples in Your Codebase

### Users Route (`backend/src/routes/users.ts`)

- ✅ `GET /api/users/me` - Get current user (protected)
- ✅ `GET /api/users/me/complete` - Get current user with all data (protected)
- ✅ `GET /api/users/:id/complete` - Get user by ID (protected)

### Tasks Route (`backend/src/routes/tasks.ts`)

- ✅ `GET /api/tasks/me` - Get current user's tasks (protected)
- ✅ `POST /api/tasks/me` - Create task for current user (protected)
- ✅ `PUT /api/tasks/:id` - Update task (protected, with ownership check)
- ✅ `DELETE /api/tasks/:id` - Delete task (protected, with ownership check)

## Important Notes

1. **Development Mode**: The middleware currently decodes tokens without verification (for development). Once you get Cognito config from SLUGGER team, uncomment the full JWT verification code in `auth.ts`.

2. **User Mapping**: Always map `req.user.sub` (SLUGGER user ID) to your database's `slugger_user_id` field.

3. **Error Handling**: The middleware returns 401 if:
   - No token provided
   - Invalid token format
   - Token verification fails (when full verification is enabled)

4. **Request Headers**: The frontend must send the token in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```

## Next Steps

1. Apply middleware to other routes that need protection (inventory, teams, games)
2. Get Cognito configuration from SLUGGER team
3. Uncomment full JWT verification in `auth.ts`
4. Test with real SLUGGER tokens in staging environment

