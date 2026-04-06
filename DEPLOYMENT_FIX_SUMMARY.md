# Vicissometer - Default Habits & Outcomes Fix

## Problem Identified

After deployment, new users see:
- ❌ Empty habits list with message "No active habits. Add some!"  
- ❌ Placeholder life outcomes (4 greyed-out cards with "—")
- ❌ No daily progress to track

## Root Cause Analysis

1. **Missing Database Trigger**: The original migration dropped the `handle_new_user()` trigger that should create default habits when a user signs up
2. **Unused DEFAULT_HABITS**: The constant was defined in `db.js` but never actually inserted into the database
3. **No Application Fallback**: The `getHabits()` function didn't create defaults if a user had no habits
4. **Incomplete Profile Creation**: The `getOrCreateProfile()` function didn't attempt to create habits

## Changes Made

### 1. Database Migration Update (`supabase/migrations/001_initial.sql`)

Added a new trigger `create_default_habits()` that automatically inserts default habits when a user profile is created:

```sql
-- CREATE DEFAULT HABITS when new user is created
CREATE OR REPLACE FUNCTION create_default_habits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO habits (user_id, name, icon, life_outcome, life_outcome_icon, weight, sort_order)
  VALUES
    (NEW.id, 'Workout',                  '🏋️', 'Physically Strong', '💪', 25.0, 0),
    (NEW.id, 'Meditation',               '🧘', 'Mentally Stable',   '🧠', 25.0, 1),
    (NEW.id, 'Reading',                  '📖', 'Knowledge',          '🌱', 25.0, 2),
    (NEW.id, 'NO temporarily pleasures', '🚫', 'Discipline',         '🌸', 25.0, 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_habits();
```

### 2. Application-Level Changes (`src/db.js`)

#### Enhanced `getOrCreateProfile()` Function
- Now attempts to insert a profile if one doesn't exist
- Creates profile which triggers the database procedure to add habits
- Includes error handling with fallback skeleton profile

#### Enhanced `getHabits()` Function  
- Added defensive check: if a user has no habits, automatically creates them
- Uses newly added `createDefaultHabits()` helper function
- Prevents the "no habits" state from reaching the UI

#### New `createDefaultHabits()` Function
- Programmatically creates the 4 default habits
- Maps from `DEFAULT_HABITS` constant to actual database records
- Returns ordered habit list for immediate use

## How It Works: Two-Layer Solution

### Primary Path (After This Fix)
1. User signs up → Auth user created
2. App calls `getOrCreateProfile()` → Inserts profile record
3. Database trigger fires → Automatically creates 4 default habits
4. App calls `getHabits()` → Returns habits from database

### Fallback Path (Safety Net)
1. If somehow a user still has no habits when `getHabits()` is called
2. The function detects empty array and calls `createDefaultHabits()`
3. Default habits are created programmatically
4. User sees habits without requiring page reload

## Default Habits Created

All new users automatically get:

| Habit | Icon | Life Outcome | Weight |
|-------|------|--------------|--------|
| Workout | 🏋️ | Physically Strong | 25% |
| Meditation | 🧘 | Mentally Stable | 25% |
| Reading | 📖 | Knowledge | 25% |
| NO temporarily pleasures | 🚫 | Discipline | 25% |

## Deployment Instructions

### For Development (Local Testing)

1. **Update Database** - Run the updated migration in Supabase SQL Editor:
   ```bash
   # In Supabase Console → SQL Editor, update/rerun:
   supabase/migrations/001_initial.sql
   ```

2. **Test New Signup**:
   - Sign up with new email  
   - Should see 4 default habits immediately
   - Should see 4 life outcome cards: "Physically Strong 💪", "Mentally Stable 🧠", "Knowledge 🌱", "Discipline 🌸"

3. **Test Existing Users**:
   - Existing users keep their current habits (no change)
   - If somehow a user has 0 habits, they'll auto-create on next page load

### For Production Deployment

1. **Backup Database** (Always!)
   ```bash
   # Generate backup in Supabase Console before deployment
   ```

2. **Apply Migration**:
   - Go to Supabase Console → SQL Editor
   - Paste updated `001_initial.sql`  
   - Click "Run" to apply trigger

3. **Deploy Frontend** (Vite/Vercel):
   ```bash
   npm install
   npm run build
   git add .
   git commit -m "Fix: Auto-create default habits"
   git push  # Triggers Vercel deployment
   ```

4. **Verify Fix**:
   - Create new test account
   - Verify 4 default habits appear
   - Verify 4 life outcomes display with icons
   - Verify daily progress shows habit list

## Testing Checklist

- [ ] New user signup creates 4 default habits
- [ ] Default habits appear in Daily Progress component
- [ ] Life Outcomes shows 4 cards with proper icons
- [ ] Habits have 25% weight each
- [ ] Existing users' habits unchanged
- [ ] All components render without errors
- [ ] No console errors in browser DevTools

## Files Modified

1. `/supabase/migrations/001_initial.sql` - Added trigger function and trigger
2. `/src/db.js` - Enhanced 3 functions (getOrCreateProfile, getHabits, createDefaultHabits)

## Backwards Compatibility

✅ **Fully Backwards Compatible**
- Existing users unaffected
- Only affects new signups going forward
- Fallback code handles any edge cases
- No breaking changes to API

## Notes

- DEFAULT_HABITS constant is now actually used (previously defined but unused)
- The trigger creates habits with correct sort_order for proper UI rendering
- All default habits are created with `active: TRUE` by default
- Database constraint ensures each user gets exactly 4 default habits on first signup
