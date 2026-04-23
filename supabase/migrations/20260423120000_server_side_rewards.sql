CREATE OR REPLACE FUNCTION public.save_daily_progress(
  p_date date,
  p_completed_habits jsonb,
  p_completed_count integer,
  p_total_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_stats user_stats;
  v_existing_log daily_logs;
  v_prev_streak integer := 0;
  v_new_streak integer := 0;
  v_new_coins integer;
  v_new_shields integer;
  v_new_power_ups integer;
  v_new_growth double precision;
  v_prev_growth double precision;
  v_growth_before double precision;
  v_shield_used boolean := false;
  v_was_perfect boolean := false;
  v_was_shield_used boolean := false;
  v_yesterday_streak integer := 0;
BEGIN
  -- Guard: must be authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Guard: total_count must be positive
  IF p_total_count <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No habits to save');
  END IF;

  -- Guard: completed_count cannot exceed total_count or be negative
  IF p_completed_count < 0 OR p_completed_count > p_total_count THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid completed count');
  END IF;

  -- Ensure user_stats row exists (safe upsert)
  INSERT INTO public.user_stats (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock the user_stats row for the duration of this transaction
  SELECT * INTO v_stats
  FROM public.user_stats
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Lock the existing daily_log for this date if it exists
  SELECT * INTO v_existing_log
  FROM public.daily_logs
  WHERE user_id = v_user_id AND date = p_date
  FOR UPDATE;

  -- Get streak from the most recent log BEFORE today (yesterday's streak)
  SELECT COALESCE(streak_after, 0) INTO v_yesterday_streak
  FROM public.daily_logs
  WHERE user_id = v_user_id AND date < p_date
  ORDER BY date DESC
  LIMIT 1;

  v_yesterday_streak := COALESCE(v_yesterday_streak, 0);

  -- Start with current stats as baseline
  v_new_coins    := v_stats.coins;
  v_new_shields  := v_stats.shields;
  v_new_power_ups := v_stats.power_ups;
  v_new_growth   := v_stats.current_growth;

  -- === ROLLBACK previous rewards if re-saving a locked day ===
  IF v_existing_log.id IS NOT NULL AND v_existing_log.locked THEN
    v_was_perfect    := v_existing_log.completed_count = v_existing_log.total_count
                        AND v_existing_log.total_count > 0;
    v_was_shield_used := v_existing_log.shield_used
                         AND v_existing_log.completed_count = 0;

    -- Reverse growth from the previous save
    IF v_existing_log.total_count > 0 AND v_existing_log.completed_count > 0 THEN
      DECLARE
        v_old_ratio double precision;
        v_old_multiplier double precision;
      BEGIN
        v_old_ratio := v_existing_log.completed_count::double precision
                       / v_existing_log.total_count::double precision;
        v_old_multiplier := 1.0 + (v_old_ratio * 0.01);
        -- Only reverse if growth is synced with what we stored
        IF ABS(v_new_growth - v_existing_log.growth_after) < 0.001 THEN
          v_new_growth := v_new_growth / v_old_multiplier;
        END IF;
      END;
    END IF;

    -- Reverse coins from perfect day
    IF v_was_perfect THEN
      v_new_coins := GREATEST(0, v_new_coins - 10);
      -- Reverse power-up if that save hit a 7-streak milestone
      IF (v_yesterday_streak + 1) > 0 AND (v_yesterday_streak + 1) % 7 = 0 THEN
        v_new_power_ups := GREATEST(0, v_new_power_ups - 1);
      END IF;
    END IF;

    -- Restore shield if it was consumed on the previous save
    IF v_was_shield_used THEN
      v_new_shields := v_new_shields + 1;
    END IF;

    -- Force unlock so we can re-save below
    UPDATE public.daily_logs
    SET locked = false
    WHERE user_id = v_user_id AND date = p_date;
  END IF;

  -- === COMPUTE growth for today ===
  v_growth_before := v_new_growth;
  IF p_completed_count > 0 THEN
    DECLARE
      v_ratio double precision;
    BEGIN
      v_ratio := p_completed_count::double precision / p_total_count::double precision;
      v_new_growth := v_growth_before * (1.0 + (v_ratio * 0.01));
    END;
  END IF;

  -- === COMPUTE streak for today ===
  v_new_streak := v_yesterday_streak;

  IF p_completed_count = p_total_count THEN
    -- Perfect day
    v_new_streak   := v_yesterday_streak + 1;
    v_new_coins    := v_new_coins + 10;
    -- Award power-up every 7th streak day
    IF v_new_streak > 0 AND v_new_streak % 7 = 0 THEN
      v_new_power_ups := v_new_power_ups + 1;
    END IF;

  ELSIF p_completed_count = 0 THEN
    -- Missed day — use a shield if available
    IF v_new_shields > 0 THEN
      v_new_shields := v_new_shields - 1;
      v_shield_used := true;
      -- Streak is preserved when shielded
    ELSE
      v_new_streak := 0;
    END IF;

  ELSE
    -- Partial day — streak resets
    v_new_streak := 0;
  END IF;

  -- === UPSERT the daily_log ===
  INSERT INTO public.daily_logs (
    user_id, date, completed_habits, completed_count, total_count,
    shield_used, streak_after, growth_before, growth_after, locked
  )
  VALUES (
    v_user_id, p_date, p_completed_habits, p_completed_count, p_total_count,
    v_shield_used, v_new_streak, v_growth_before, v_new_growth, true
  )
  ON CONFLICT (user_id, date) DO UPDATE
  SET
    completed_habits = EXCLUDED.completed_habits,
    completed_count  = EXCLUDED.completed_count,
    total_count      = EXCLUDED.total_count,
    shield_used      = EXCLUDED.shield_used,
    streak_after     = EXCLUDED.streak_after,
    growth_before    = EXCLUDED.growth_before,
    growth_after     = EXCLUDED.growth_after,
    locked           = true;

  -- === UPDATE user_stats with validated values ===
  UPDATE public.user_stats
  SET
    coins          = v_new_coins,
    streak         = v_new_streak,
    shields        = v_new_shields,
    power_ups      = v_new_power_ups,
    current_growth = v_new_growth
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Saved');
END;
$$;

-- Revoke from public, grant only to authenticated users
REVOKE ALL ON FUNCTION public.save_daily_progress(date, jsonb, integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.save_daily_progress(date, jsonb, integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.reset_daily_progress(
  p_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_log daily_logs;
  v_stats user_stats;
  v_new_growth double precision;
  v_new_coins integer;
  v_new_streak integer;
  v_new_power_ups integer;
  v_new_shields integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Lock both rows for the transaction
  SELECT * INTO v_log
  FROM public.daily_logs
  WHERE user_id = v_user_id AND date = p_date
  FOR UPDATE;

  SELECT * INTO v_stats
  FROM public.user_stats
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- If no log exists for today, nothing to reset
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'Nothing to reset');
  END IF;

  -- Start from current stats
  v_new_coins     := v_stats.coins;
  v_new_streak    := v_stats.streak;
  v_new_power_ups := v_stats.power_ups;
  v_new_shields   := v_stats.shields;
  v_new_growth    := v_stats.current_growth;

  -- Reverse growth if this log was locked and had completions
  IF v_log.locked AND v_log.total_count > 0 AND v_log.completed_count > 0 THEN
    DECLARE
      v_ratio double precision;
      v_multiplier double precision;
    BEGIN
      v_ratio := v_log.completed_count::double precision / v_log.total_count::double precision;
      v_multiplier := 1.0 + (v_ratio * 0.01);
      IF ABS(v_new_growth - v_log.growth_after) < 0.001 THEN
        v_new_growth := v_new_growth / v_multiplier;
      END IF;
    END;
  END IF;

  -- Reverse perfect-day rewards
  IF v_log.locked AND v_log.completed_count = v_log.total_count AND v_log.total_count > 0 THEN
    v_new_coins  := GREATEST(0, v_new_coins - 10);
    v_new_streak := GREATEST(0, v_new_streak - 1);
    -- Reverse power-up if this was a 7th-streak day
    IF (v_new_streak + 1) > 0 AND (v_new_streak + 1) % 7 = 0 THEN
      v_new_power_ups := GREATEST(0, v_new_power_ups - 1);
    END IF;
  END IF;

  -- Restore shield if it was consumed
  IF v_log.locked AND v_log.shield_used AND v_log.completed_count = 0 THEN
    v_new_shields := v_new_shields + 1;
  END IF;

  -- Delete the log and update stats atomically (same transaction)
  DELETE FROM public.daily_logs
  WHERE user_id = v_user_id AND date = p_date;

  UPDATE public.user_stats
  SET
    coins          = v_new_coins,
    streak         = v_new_streak,
    shields        = v_new_shields,
    power_ups      = v_new_power_ups,
    current_growth = v_new_growth
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Reset');
END;
$$;

REVOKE ALL ON FUNCTION public.reset_daily_progress(date) FROM public;
GRANT EXECUTE ON FUNCTION public.reset_daily_progress(date) TO authenticated;
