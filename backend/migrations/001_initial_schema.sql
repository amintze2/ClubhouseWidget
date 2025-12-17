-- Initial database schema for Clubhouse Task Manager App
-- This migration creates the user, inventory, and task tables

-- Create user table first (referenced by other tables)
-- Note: "user" is a reserved keyword in PostgreSQL, so we quote it
CREATE TABLE IF NOT EXISTS public."user" (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_role text,
  user_team text,
  slugger_user_id text UNIQUE,
  user_name text,
  CONSTRAINT user_pkey PRIMARY KEY (id)
);

-- Create inventory table (references user)
CREATE TABLE IF NOT EXISTS public.inventory (
  user_id bigint NOT NULL,
  inventory_type bigint,
  inventory_item text,
  current_stock bigint,
  required_stock bigint,
  unit text,
  purchase_link text,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT inventory_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

-- Create task table (references user)
CREATE TABLE IF NOT EXISTS public.task (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id bigint,
  task_name text,
  task_complete boolean,
  task_category bigint,
  task_description text,
  task_type bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT task_pkey PRIMARY KEY (id),
  CONSTRAINT task_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_task_user_id ON public.task(user_id);
CREATE INDEX IF NOT EXISTS idx_user_slugger_user_id ON public."user"(slugger_user_id);

