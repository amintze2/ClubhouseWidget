-- Add repeating task columns to task table

-- Add is_repeating column (boolean, default false)
ALTER TABLE public.task 
ADD COLUMN IF NOT EXISTS is_repeating boolean NOT NULL DEFAULT false;

-- Add repeating_day column (optional, can be 0 for off day or 1-6 for days of series)
ALTER TABLE public.task 
ADD COLUMN IF NOT EXISTS repeating_day integer;

-- Add check constraint to ensure repeating_day is between 0 and 6
ALTER TABLE public.task 
ADD CONSTRAINT check_repeating_day_range 
CHECK (repeating_day IS NULL OR (repeating_day >= 0 AND repeating_day <= 6));

-- Create index for better query performance on repeating tasks
CREATE INDEX IF NOT EXISTS idx_task_is_repeating ON public.task(is_repeating);
CREATE INDEX IF NOT EXISTS idx_task_repeating_day ON public.task(repeating_day);

