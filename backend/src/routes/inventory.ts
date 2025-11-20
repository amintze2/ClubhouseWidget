import { Hono } from "hono";
import { supabase } from "../config/supabase";

export const inventoryRoute = new Hono();

// GET /inventory?userId=1
inventoryRoute.get("/", async (c) => {
  const userId = Number(c.req.query("userId"));

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("user_id", userId)
    .order("inventory_item");

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// POST /inventory
inventoryRoute.post("/", async (c) => {
  const body = await c.req.json();
  const { userId, ...rest } = body;

  const { data, error } = await supabase
    .from("inventory")
    .insert({ user_id: userId, ...rest })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});
