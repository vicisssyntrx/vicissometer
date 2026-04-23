-- Enforce a hard cap of 50 habits per user via a BEFORE INSERT trigger.
-- This protects the database from runaway inserts from scripts or bugs.

CREATE OR REPLACE FUNCTION public.check_habit_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.habits
  WHERE user_id = NEW.user_id;

  IF v_count >= 50 THEN
    RAISE EXCEPTION 'Habit limit reached: a user may have at most 50 habits.';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists so this migration is idempotent
DROP TRIGGER IF EXISTS enforce_habit_limit ON public.habits;

CREATE TRIGGER enforce_habit_limit
  BEFORE INSERT ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.check_habit_limit();
