import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-bf148105/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-bf148105/signup", async (c) => {
  try {
    const { email, password, username, jobRole } = await c.req.json();

    console.log('Signup request received for email:', email);

    if (!email || !password || !username || !jobRole) {
      console.log('Missing required fields');
      return c.json({ error: "Email, password, username, and job role are required" }, 400);
    }

    if (password.length < 6) {
      console.log('Password too short');
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Creating user with admin API...');

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        username,
        job_role: jobRole,
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Supabase auth.admin.createUser error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('User created successfully:', data.user.id);

    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        username,
        jobRole,
      }
    });
  } catch (error) {
    console.log('Signup catch error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

Deno.serve(app.fetch);