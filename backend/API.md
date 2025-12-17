# API Documentation

## Base URL
```
http://localhost:3001
```

## Endpoints

### Health Check
- **GET** `/health` - Check server and database status

---

## Users API

### Get All Users
- **GET** `/api/users`
- **Response**: Array of all users

### Get User by ID
- **GET** `/api/users/:id`
- **Response**: Single user object

### Get User by Slugger User ID
- **GET** `/api/users/slugger/:sluggerUserId`
- **Response**: Single user object

### Get Users by Team
- **GET** `/api/users/team/:teamName`
- **Response**: Array of users belonging to the specified team

### Get User with All Associated Data
- **GET** `/api/users/:id/complete`
- **Response**: User object with `inventory` and `tasks` arrays

### Create User
- **POST** `/api/users`
- **Body**:
```json
{
  "user_role": "string",
  "user_team": "string",
  "slugger_user_id": "string (unique)",
  "user_name": "string"
}
```

### Update User
- **PUT** `/api/users/:id`
- **Body**: Partial user object (any fields to update)

### Delete User
- **DELETE** `/api/users/:id`
- **Note**: This will cascade delete all associated inventory and tasks

---

## Inventory API

### Get All Inventory Items
- **GET** `/api/inventory`
- **Response**: Array of all inventory items

### Get Inventory for a User
- **GET** `/api/inventory/user/:userId`
- **Response**: Array of inventory items for the specified user

### Get Inventory Item by ID
- **GET** `/api/inventory/:id`
- **Response**: Single inventory item

### Create Inventory Item
- **POST** `/api/inventory/user/:userId`
- **Body**:
```json
{
  "inventory_type": "number",
  "inventory_item": "string",
  "current_stock": "number",
  "required_stock": "number",
  "unit": "string",
  "purchase_link": "string",
  "note": "string"
}
```

### Update Inventory Item
- **PUT** `/api/inventory/:id`
- **Body**: Partial inventory object (user_id cannot be changed)

### Delete Inventory Item
- **DELETE** `/api/inventory/:id`

---

## Tasks API

### Get All Tasks
- **GET** `/api/tasks`
- **Response**: Array of all tasks

### Get Tasks for a User
- **GET** `/api/tasks/user/:userId`
- **Response**: Array of tasks for the specified user

### Get Tasks by Completion Status
- **GET** `/api/tasks/user/:userId/status/:complete`
- **Params**: `complete` should be `true` or `false` (as string)
- **Response**: Array of tasks filtered by completion status

### Get Task by ID
- **GET** `/api/tasks/:id`
- **Response**: Single task object

### Create Task
- **POST** `/api/tasks/user/:userId`
- **Body**:
```json
{
  "task_name": "string",
  "task_complete": "boolean",
  "task_category": "number",
  "task_description": "string",
  "task_type": "number"
}
```

### Update Task
- **PUT** `/api/tasks/:id`
- **Body**: Partial task object (user_id cannot be changed)

### Toggle Task Completion
- **PATCH** `/api/tasks/:id/toggle`
- **Response**: Updated task with toggled completion status

### Delete Task
- **DELETE** `/api/tasks/:id`

---

## Example Usage

### Create a User with Inventory and Tasks

1. **Create User**:
```bash
POST /api/users
{
  "user_name": "John Doe",
  "user_role": "Manager",
  "user_team": "Engineering",
  "slugger_user_id": "user_123"
}
```

2. **Add Inventory Item**:
```bash
POST /api/inventory/user/1
{
  "inventory_item": "Laptop",
  "current_stock": 5,
  "required_stock": 10,
  "unit": "pieces",
  "inventory_type": 1
}
```

3. **Add Task**:
```bash
POST /api/tasks/user/1
{
  "task_name": "Review code",
  "task_description": "Review pull request #123",
  "task_complete": false,
  "task_category": 1,
  "task_type": 1
}
```

4. **Get Complete User Data**:
```bash
GET /api/users/1/complete
```
Returns user with all associated inventory and tasks.

---

## Error Responses

All endpoints return errors in the following format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `404` - Not Found
- `500` - Server Error

