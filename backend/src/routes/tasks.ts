import { Hono } from "hono";
import { supabase } from "../config/supabase";

export const tasksRoute = new Hono();

// GET /tasks?userId=1
tasksRoute.get("/", async (c) => {
  const userId = Number(c.req.query("userId"));
  const { data, error } = await supabase
    .from("task")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// POST /tasks
tasksRoute.post("/", async (c) => {
  const body = await c.req.json();
  const { userId, ...rest } = body;

  const { data, error } = await supabase
    .from("task")
    .insert({ user_id: userId, ...rest })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});
