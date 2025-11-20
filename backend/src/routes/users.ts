import { Hono } from "hono";
import { supabase } from "../config/supabase";

export const usersRoute = new Hono();

// GET /users/:id
usersRoute.get("/:id", async (c) => {
  const userId = Number(c.req.param("id"));

  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});
