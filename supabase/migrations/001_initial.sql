-- ============================================================
-- VICISSOMETER — Supabase Database Migration v2
-- Run this once in your Supabase SQL Editor
-- (Drop existing tables first if you ran v1)
-- ============================================================

-- Drop old tables if they exist (clean slate for auth migration)
DROP TABLE IF EXISTS daily_progress CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop old triggers from a previous project if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- id = auth.uid() — linked to Supabase Auth user
-- ============================================================
CREATE TABLE profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT        NOT NULL DEFAULT 'Viciss_Syntrx',
  start_date    DATE        NOT NULL DEFAULT '2024-12-24',
  target_date   DATE        NOT NULL DEFAULT '2025-12-25',
  coins         INTEGER     NOT NULL DEFAULT 0,
  streak        INTEGER     NOT NULL DEFAULT 0,
  settings      JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: habits
-- ============================================================
CREATE TABLE habits (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  icon              TEXT        NOT NULL DEFAULT '⭐',
  life_outcome      TEXT        NOT NULL DEFAULT 'Growth',
  life_outcome_icon TEXT        NOT NULL DEFAULT '🎯',
  weight            FLOAT       NOT NULL DEFAULT 25.0,
  active            BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: daily_progress
-- ============================================================
CREATE TABLE daily_progress (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  habit_id    UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT  daily_progress_unique UNIQUE(user_id, date, habit_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_daily_progress_user_date ON daily_progress(user_id, date);
CREATE INDEX idx_daily_progress_user_id ON daily_progress(user_id);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (proper auth)
-- ============================================================
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — each user only sees their own data
-- ============================================================

-- Profiles
CREATE POLICY "profiles_own" ON profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Habits
CREATE POLICY "habits_own" ON habits
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Daily Progress
CREATE POLICY "progress_own" ON daily_progress
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE daily_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
