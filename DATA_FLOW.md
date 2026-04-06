# Vicissometer Data Flow & Initialization

## Overview

The database setup happens in **2 stages**: Schema + Triggers, then optional backfill.

---

## Stage 1: Schema & Auto-Triggers (in Migration)

**File:** `supabase/migrations/001_initial.sql`

This migration creates:
- ✅ 4 tables (profiles, habits, daily_progress, gamification_ledger)
- ✅ 5 indexes for performance
- ✅ RLS policies for security
- ✅ 2 triggers:
  - `on_auth_user_created` → Automatically creates 4 default habits
  - `profiles_updated_at` → Auto-updates the timestamp

### When Stage 1 Runs

```
1. User clicks "Sign Up" on login page
2. Supabase Auth creates auth.users record with user_id
3. App calls getOrCreateProfile() → inserts row into profiles table
4. Trigger "on_auth_user_created" fires automatically
5. Trigger inserts 4 default habits (Workout, Meditation, Reading, NO pleasures)
6. User sees dashboard with 4 empty habits ready to track
```

**Result After Stage 1:**
- ✅ profiles: 1 row (mudras=50, kramas=0, kavachas=0, urjas=0)
- ✅ habits: 4 rows (the 4 default habits)
- ❌ daily_progress: 0 rows (no history yet)
- ❌ gamification_ledger: 0 rows

---

## Stage 2: Backfill Historic Data (Optional Script)

**File:** `scripts/backfill.js`

This script populates historic daily_progress for testing/demo purposes.

### When to Run Stage 2

Only run if you want to:
- ✅ Demo a user with history
- ✅ Test analytics/insights features
- ✅ Test the Krama calendar with past dates
- ❌ NOT needed for fresh users (they start with clean slate)

### How to Run Stage 2

```bash
# 1. Make sure you've completed Stage 1 (signed up a user)
# 2. Run the backfill script
node scripts/backfill.js

# 3. Watch the console output
# Should show: "User ID: [uuid]", "Habit Count: 4", "Inserted progress rows..."
```

### What Backfill.js Does

```javascript
// 1. Find the user by username "Viciss_Syntrx"
const uid = profile.id

// 2. Get all active habits for that user
const habits = [Workout, Meditation, Reading, NO pleasures]

// 3. Generate 73 days of history:
dates.push('2024-12-24' to '2025-02-21') // 60 days
dates.push('2025-03-01' to '2025-03-10') // 10 days
dates.push('2025-03-15', '2025-03-16', '2025-03-25') // 3 scattered days

// 4. For each date × habit combination:
INSERT INTO daily_progress (user_id, date, habit_id, completed=true)

// 5. Update profile stats:
UPDATE profiles SET mudras=50, kramas=73

// 6. Log the backfill to ledger:
INSERT INTO gamification_ledger (
  user_id, 
  asset_type='KRAMA', 
  change_amount=73, 
  event_type='BACKFILL',
  description='Historic 73-day journey sync (Dec-Mar)'
)
```

**Result After Stage 2:**
- ✅ profiles: mudras=50, kramas=73
- ✅ habits: 4 rows (unchanged)
- ✅ daily_progress: 292 rows (4 habits × 73 days)
- ✅ gamification_ledger: 1 row (BACKFILL event)

---

## Complete Setup Example

### New User from Scratch

```bash
# 1. Run migration in Supabase SQL Editor
# Copy/paste the entire 001_initial.sql

# 2. Sign up new user in app
# Go to http://localhost:3000
# Click "Sign Up"
# Email: newuser@example.com
# Password: anything

# 3. (Optional) Backfill historic data
node scripts/backfill.js

# DONE! User has habits + optional history
```

### Production/Deployment

```bash
# 1. Apply migration in Supabase Console → SQL Editor
# 2. Users sign up normally (no backfill needed)
# 3. Each user starts with clean 4 habits
# 4. They track daily going forward
```

---

## Data Consistency Notes

### NO Hardcoded User Data
- Auth users are created by Supabase Auth signup flow
- Profile IDs must match auth.users.id (foreign key)
- Migration cannot pre-insert profiles (risky, auth-dependent)

### Trigger Guarantees
- When a new profile is created → default habits are guaranteed to exist
- If profile exists in DB → habits already exist
- No race conditions (trigger fires AFTER INSERT)

### Backfill is Idempotent
- Can safely run backfill.js multiple times
- Uses `upsert` so duplicates are just overwritten
- Safe to re-run without data corruption

---

## Table sizes after full setup:

| Table | Rows | Notes |
|-------|------|-------|
| profiles | 1 | One per user |
| habits | 4 | Four per user (created by trigger) |
| daily_progress | 292 | Only if backfill runs |
| gamification_ledger | 1 | One BACKFILL entry |

---

## Troubleshooting

### "User not found" when running backfill

```
Error: User not found. Run the app once to create a profile.
```

**Solution:** You must sign up a user first (Stage 1) before backfill can run.

### Habits not appearing after signup

Check: 
1. Did the migration run successfully? (no SQL errors)
2. Did you sign up after running migration? (auth user created)
3. Is the trigger enabled? (check Supabase console → Database Triggers)

### Backfill creates 0 habits

The backfill script depends on existing habits. Make sure:
1. User signed up first (Stage 1 trigger created 4 habits)
2. Habits are marked `active = true`
3. No other setup required

