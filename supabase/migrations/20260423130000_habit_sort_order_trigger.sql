-- Create the function that calculates the next sort_order
CREATE OR REPLACE FUNCTION public.set_habit_sort_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only auto-assign if the client didn't explicitly provide one
  IF NEW.sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), -1) + 1 INTO NEW.sort_order
    FROM public.habits
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger to the habits table
DROP TRIGGER IF EXISTS trigger_set_habit_sort_order ON public.habits;
CREATE TRIGGER trigger_set_habit_sort_order
BEFORE INSERT ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.set_habit_sort_order();
