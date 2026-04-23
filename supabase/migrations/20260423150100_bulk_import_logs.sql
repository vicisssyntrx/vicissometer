CREATE OR REPLACE FUNCTION public.bulk_import_daily_logs(
  p_logs jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_log record;
BEGIN
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

  -- Unnest the JSON array and bulk upsert
  FOR v_log IN SELECT * FROM jsonb_array_elements(p_logs)
  LOOP
    INSERT INTO public.daily_logs (
      user_id, date, total_count, completed_count, shield_used, locked
    ) VALUES (
      v_user_id, 
      (v_log.value->>'date')::date,
      (v_log.value->>'total_count')::integer,
      (v_log.value->>'completed_count')::integer,
      COALESCE((v_log.value->>'shield_used')::boolean, false),
      true
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      total_count = EXCLUDED.total_count,
      completed_count = EXCLUDED.completed_count,
      shield_used = EXCLUDED.shield_used,
      locked = true;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;
