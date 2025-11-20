// backend/src/routes/session.ts
import { Hono } from "hono";
import { supabase } from "../config/supabase";

export const sessionRoute = new Hono();

sessionRoute.post("/bootstrap", async (c) => {
  const { sluggerUserId, name, role, team } = await c.req.json();

  if (!sluggerUserId) {
    return c.json({ error: "sluggerUserId is required" }, 400);
  }

  // Upsert user so it's safe for first time & subsequent loads
  const { data, error } = await supabase
    .from("user")
    .upsert(
      {
        slugger_user_id: sluggerUserId,
        user_name: name,
        user_role: role,
        user_team: team,
      },
      { onConflict: "slugger_user_id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return c.json({ error: error.message }, 500);
  }

  // Return your internal user id to frontend
  return c.json({
    userId: data.id,
    sluggerUserId,
    name: data.user_name,
    role: data.user_role,
    team: data.user_team,
  });
});
