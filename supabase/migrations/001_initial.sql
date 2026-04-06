-- ============================================================
-- VICISSOMETER — Supabase Database Migration (Complete)
-- Complete schema with gamification overhaul
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles (with NEW gamification columns)
-- id = auth.uid() — linked to Supabase Auth user
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT        NOT NULL DEFAULT 'Viciss_Syntrx',
  start_date    DATE        NOT NULL DEFAULT '2024-12-24',
  target_date   DATE        NOT NULL DEFAULT '2025-12-25',
  mudras        INTEGER     NOT NULL DEFAULT 50,
  kramas        INTEGER     NOT NULL DEFAULT 0,
  kavachas      INTEGER     NOT NULL DEFAULT 0,
  urjas         INTEGER     NOT NULL DEFAULT 0,
  is_backfilled BOOLEAN     NOT NULL DEFAULT FALSE,
  settings      JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: habits
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
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
CREATE TABLE IF NOT EXISTS daily_progress (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE        NOT NULL,
  habit_id        UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_kavacha_used BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT      daily_progress_unique UNIQUE(user_id, date, habit_id)
);

-- ============================================================
-- TABLE: gamification_ledger (audit trail for all achievements)
-- ============================================================
CREATE TABLE IF NOT EXISTS gamification_ledger (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type      TEXT        NOT NULL, -- 'MUDRA', 'KRAMA', 'KAVACHA', 'URJA'
  change_amount   INTEGER     NOT NULL,
  event_type      TEXT        NOT NULL, -- 'BACKFILL', 'SHOP_PURCHASE', 'COMPLETION', 'RECOVERY'
  description     TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT      ledger_user_id_idx UNIQUE(id)
);

-- ============================================================
-- INDEXES (IF NOT EXISTS prevents errors on re-run)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_id ON daily_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_ledger_user_id ON gamification_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_ledger_created_at ON gamification_ledger(created_at);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (proper auth)
-- ============================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_ledger ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — each user only sees their own data
-- ============================================================

-- Drop old policies if they exist (using CASCADE)
DROP POLICY IF EXISTS "profiles_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "habits_own" ON habits CASCADE;
DROP POLICY IF EXISTS "progress_own" ON daily_progress CASCADE;
DROP POLICY IF EXISTS "ledger_own" ON gamification_ledger CASCADE;

-- Create fresh policies
CREATE POLICY "profiles_own" ON profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "habits_own" ON habits
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_own" ON daily_progress
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ledger_own" ON gamification_ledger
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

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
-- DEFAULT HABITS TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON profiles CASCADE;
DROP FUNCTION IF EXISTS create_default_habits() CASCADE;

CREATE OR REPLACE FUNCTION create_default_habits()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 4 default habits (only if they don't already exist)
  INSERT INTO habits (user_id, name, icon, life_outcome, life_outcome_icon, weight, sort_order)
  VALUES
    (NEW.id, 'Workout',                  '🏋️', 'Physically Strong', '💪', 25.0, 0),
    (NEW.id, 'Meditation',               '🧘', 'Mentally Stable',   '🧠', 25.0, 1),
    (NEW.id, 'Reading',                  '📖', 'Knowledge',          '🌱', 25.0, 2),
    (NEW.id, 'NO temporarily pleasures', '🚫', 'Discipline',         '🌸', 25.0, 3)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_habits();

-- ============================================================
-- HELPER FUNCTION: Backfill historic data for a user
-- ============================================================
DROP FUNCTION IF EXISTS backfill_historic_data(UUID) CASCADE;

CREATE OR REPLACE FUNCTION backfill_historic_data(user_uuid UUID)
RETURNS TABLE (
  message TEXT,
  habits_created INT,
  days_backfilled INT,
  initial_ledger_entry TEXT
) AS $$
DECLARE
  habit_count INT;
BEGIN
  -- Get habit count
  SELECT COUNT(*) INTO habit_count FROM habits WHERE user_id = user_uuid;

  -- Set backfill flag
  UPDATE profiles SET
    is_backfilled = TRUE,
    updated_at = NOW()
  WHERE id = user_uuid;

  RETURN QUERY SELECT
    'Backfill ready!' as message,
    habit_count,
    0,
    'No automatic data - start fresh!';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SETUP GUIDE & DATA FLOW
-- ============================================================
-- This migration is IDEMPOTENT (safe to run multiple times)
-- 
-- Stage 1: Schema Creation (Automatic)
--    • When you run this migration:
--    • Tables are created (if not exists)
--    • Triggers are created
--    • RLS policies are applied
--
-- Stage 2: User Signup (Manual in app)
--    a) User signs up in the app
--    b) Auth user created → Profile inserted
--    c) Trigger fires → 4 default habits created
--
-- Stage 3: Backfill Data (Optional script)
--    a) Run: node scripts/backfill.js
--    b) Creates 73 days of habit history
--
-- Test Account:
--    Email: vicisssyntrx@gmail.com
--    Password: 123456
-- ============================================================
