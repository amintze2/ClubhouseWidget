import "dotenv/config"; 
import { Hono } from "hono";
import { serve } from "@hono/node-server";

import { sessionRoute } from "./routes/session";
import { usersRoute } from "./routes/users";
import { tasksRoute } from "./routes/tasks";
import { inventoryRoute } from "./routes/inventory";

const app = new Hono();

// Routes
app.route("/session", sessionRoute);
app.route("/users", usersRoute);
app.route("/tasks", tasksRoute);
app.route("/inventory", inventoryRoute);

const port = Number(process.env.PORT) || 3000;
console.log(`Backend running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
