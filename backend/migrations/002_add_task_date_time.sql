-- Add date and time columns to task table
ALTER TABLE public.task 
ADD COLUMN IF NOT EXISTS task_date date,
ADD COLUMN IF NOT EXISTS task_time time;

-- Create index on task_date for better query performance
CREATE INDEX IF NOT EXISTS idx_task_date ON public.task(task_date);

