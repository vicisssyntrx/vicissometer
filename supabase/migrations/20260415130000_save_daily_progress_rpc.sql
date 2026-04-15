create or replace function public.save_daily_progress(
  p_date date,
  p_total_count integer,
  p_completed_habits jsonb,
  p_completed_count integer,
  p_shield_used boolean,
  p_streak_after integer,
  p_growth_before double precision,
  p_growth_after double precision,
  p_coins integer,
  p_streak integer,
  p_shields integer,
  p_power_ups integer,
  p_current_growth double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_locked boolean := false;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Not authenticated');
  end if;

  insert into public.user_stats (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select locked
  into v_locked
  from public.daily_logs
  where user_id = v_user_id and date = p_date
  for update;

  if coalesce(v_locked, false) then
    return jsonb_build_object('success', false, 'message', 'Today is already saved');
  end if;

  insert into public.daily_logs (
    user_id,
    date,
    completed_habits,
    completed_count,
    total_count,
    shield_used,
    streak_after,
    growth_before,
    growth_after,
    locked
  )
  values (
    v_user_id,
    p_date,
    p_completed_habits,
    p_completed_count,
    p_total_count,
    p_shield_used,
    p_streak_after,
    p_growth_before,
    p_growth_after,
    true
  )
  on conflict (user_id, date) do update
  set completed_habits = excluded.completed_habits,
      completed_count = excluded.completed_count,
      total_count = excluded.total_count,
      shield_used = excluded.shield_used,
      streak_after = excluded.streak_after,
      growth_before = excluded.growth_before,
      growth_after = excluded.growth_after,
      locked = true;

  update public.user_stats
  set
    coins = p_coins,
    streak = p_streak,
    shields = p_shields,
    power_ups = p_power_ups,
    current_growth = p_current_growth
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'message', 'Saved');
end;
$$;

revoke all on function public.save_daily_progress(
  date,
  integer,
  jsonb,
  integer,
  boolean,
  integer,
  double precision,
  double precision,
  integer,
  integer,
  integer,
  integer,
  double precision
) from public;

grant execute on function public.save_daily_progress(
  date,
  integer,
  jsonb,
  integer,
  boolean,
  integer,
  double precision,
  double precision,
  integer,
  integer,
  integer,
  integer,
  double precision
) to authenticated;
