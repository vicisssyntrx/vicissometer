-- ============================================================
-- VICISSOMETER — Supabase Database Migration
-- Run this once in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- One row per device/user (identified by localStorage UUID)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY,
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
-- Each user's list of trackable habits
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
-- One row per user + date + habit combination
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_progress (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  habit_id    UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT  daily_progress_unique UNIQUE(user_id, date, habit_id)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_id ON daily_progress(user_id);

-- ============================================================
-- DISABLE ROW LEVEL SECURITY (single-user no-auth app)
-- ============================================================
ALTER TABLE profiles      DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits        DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- GRANT anonymous access (for anon/publishable key)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON TABLE profiles       TO anon;
GRANT ALL PRIVILEGES ON TABLE habits         TO anon;
GRANT ALL PRIVILEGES ON TABLE daily_progress  TO anon;

-- ============================================================
-- FUNCTION: auto-update updated_at on profiles
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REALTIME: enable for daily_progress so UI updates live
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE daily_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
