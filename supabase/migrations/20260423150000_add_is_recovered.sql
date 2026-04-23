-- 1. Add the boolean column
ALTER TABLE public.daily_logs 
ADD COLUMN is_recovered BOOLEAN DEFAULT false NOT NULL;

-- 2. Migrate existing data (turn -1 into a proper flag and reset count to 0)
UPDATE public.daily_logs 
SET is_recovered = true, completed_count = 0 
WHERE completed_count < 0;

-- 3. Lock down the column so garbage data can never enter again
ALTER TABLE public.daily_logs 
ADD CONSTRAINT completed_count_is_positive CHECK (completed_count >= 0);
