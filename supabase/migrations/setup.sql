-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✅',
  outcome_name TEXT,
  outcome_emoji TEXT,
  reminder_time TIME,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- 3. Daily logs table
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_habits JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  shield_used BOOLEAN NOT NULL DEFAULT false,
  streak_after INTEGER NOT NULL DEFAULT 0,
  growth_before DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  growth_after DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- 4. User stats table
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  shields INTEGER NOT NULL DEFAULT 0,
  power_ups INTEGER NOT NULL DEFAULT 0,
  current_growth DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  start_date date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Auto-create profile and user_stats on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Save progress RPC function
CREATE OR REPLACE FUNCTION public.save_daily_progress(
  p_date DATE,
  p_total_count INTEGER,
  p_completed_habits JSONB,
  p_completed_count INTEGER,
  p_shield_used BOOLEAN,
  p_streak_after INTEGER,
  p_growth_before DOUBLE PRECISION,
  p_growth_after DOUBLE PRECISION,
  p_coins INTEGER,
  p_streak INTEGER,
  p_shields INTEGER,
  p_power_ups INTEGER,
  p_current_growth DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_locked BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  INSERT INTO public.user_stats (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT locked
  INTO v_existing_locked
  FROM public.daily_logs
  WHERE user_id = v_user_id AND date = p_date
  FOR UPDATE;

  -- If the day is already locked, allow updating the log contents without re-awarding rewards.
  IF COALESCE(v_existing_locked, false) THEN
    UPDATE public.daily_logs
    SET completed_habits = p_completed_habits,
        completed_count = p_completed_count,
        total_count = p_total_count,
        shield_used = p_shield_used
    WHERE user_id = v_user_id AND date = p_date;

    RETURN jsonb_build_object('success', true, 'message', 'Updated');
  END IF;

  INSERT INTO public.daily_logs (
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
  VALUES (
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
  ON CONFLICT (user_id, date) DO UPDATE
  SET completed_habits = excluded.completed_habits,
      completed_count = excluded.completed_count,
      total_count = excluded.total_count,
      shield_used = excluded.shield_used,
      streak_after = excluded.streak_after,
      growth_before = excluded.growth_before,
      growth_after = excluded.growth_after,
      locked = true;

  UPDATE public.user_stats
  SET
    coins = p_coins,
    streak = p_streak,
    shields = p_shields,
    power_ups = p_power_ups,
    current_growth = p_current_growth
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Saved');
END;
$$;

REVOKE ALL ON FUNCTION public.save_daily_progress(
  DATE,
  INTEGER,
  JSONB,
  INTEGER,
  BOOLEAN,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER,
  INTEGER,
  INTEGER,
  INTEGER,
  DOUBLE PRECISION
) FROM public;

GRANT EXECUTE ON FUNCTION public.save_daily_progress(
  DATE,
  INTEGER,
  JSONB,
  INTEGER,
  BOOLEAN,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER,
  INTEGER,
  INTEGER,
  INTEGER,
  DOUBLE PRECISION
) TO authenticated;
