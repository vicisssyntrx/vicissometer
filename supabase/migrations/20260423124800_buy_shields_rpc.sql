CREATE OR REPLACE FUNCTION public.buy_shields(
  p_count integer,
  p_cost integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_stats user_stats;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Lock the row to prevent concurrent purchase requests
  SELECT * INTO v_stats
  FROM public.user_stats
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Server-side validation of funds
  IF v_stats.coins < p_cost THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not enough coins');
  END IF;

  -- Atomically deduct coins and add shields
  UPDATE public.user_stats
  SET 
    coins = coins - p_cost,
    shields = shields + p_count
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Purchase successful');
END;
$$;

REVOKE ALL ON FUNCTION public.buy_shields(integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.buy_shields(integer, integer) TO authenticated;
