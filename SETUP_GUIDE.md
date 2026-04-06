# Vicissometer — Setup Guide

## ✅ What's Ready

### Database Schema (001_initial.sql)
- ✅ **Cleaned up**: Simple, focused schema
- ✅ **profiles table** with gamification columns:
  - `mudras` (🪙 coins earned)
  - `kramas` (🔥 streak days)
  - `kavachas` (🛡️ shields bought)
  - `urjas` (⚡ power-ups)
- ✅ **daily_progress table**: Tracks all habit completions
- ✅ **habits table**: 4 default habits
- ✅ **gamification_ledger table**: Audit trail

### Application Code
- ✅ **db.js**: All stat functions working
- ✅ **main.js**: Profile loads correctly
- ✅ **Components**: shop, dailyProgress, kramaCalendar all updated
- ✅ **Build**: ✓ 67 modules, zero errors

---

## 🚀 3-Step Setup

### Step 1: Run Migration

1. Go to **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Copy entire `supabase/migrations/001_initial.sql`
4. Paste and click **RUN**

**Result**: All tables created ✅

---

### Step 2: Delete Old User (if exists)

1. Go to **Authentication → Users**
2. Delete any existing `vicisssyntrx@gmail.com` user
3. Confirm deletion

---

### Step 3: Sign Up Fresh

1. Go to `http://localhost:3000/`
2. Click **"Sign Up"**
3. Use:
   - **Email**: `vicisssyntrx@gmail.com`
   - **Password**: `123456`

**Automatic Setup**:
- ✅ Profile created (mudras=0, kramas=0, kavachas=0, urjas=0)
- ✅ 4 default habits added
- ✅ **Clean slate** — no preset data

---

## ✨ You're Done!

The app is ready to use. Start logging your daily habits and watch your stats grow organically.
- ✅ Settings panel opens
- ✅ Import button visible in Settings

**Expected Result**: Full app functionality ✅

---

## 🔧 What Each Component Does

| Component | Function | Data Saved |
|-----------|----------|-----------|
| **dailyProgress.js** | Mark habits complete for a date | Updates `mudras`, `kramas`, `kavachas`, `urjas` |
| **shop.js** | Buy Kavachas with Mudras | Updates profile: `mudras ↓`, `kavachas ↑` |
| **kramaCalendar.js** | Use Urja to fill gaps | Updates `urjas ↓`, recalculates `kramas` |
| **header.js** | Displays all 4 stats | Reads from store (synced via realtime) |
| **gamificationCenter.js** | Shows shields & powerups | Reads `kavachas` and `urjas` from store |

---

## 📊 Database Tables

### profiles
- `mudras`: Earned through daily habit completion
- `kramas`: Streak of consecutive full days
- `kavachas`: Shields purchased from shop (protect streaks)
- `urjas`: Power-ups earned (fill gaps in streak)

### daily_progress
- `completed`: Habit marked complete
- `is_kavacha_used`: Shield used on this day?

### gamification_ledger
- Audit trail for all mudra/krama/kavacha/urja transactions
- Tracks: BACKFILL, SHOP_PURCHASE, COMPLETION, RECOVERY events

---

## ✨ Features Included

✅ **Gamification System**:
- Mudras (Coins) earned for daily habit completion
- Kramas (Streak) for consecutive full days
- Kavachas (Shields) purchased to protect streaks
- Urjas (PowerUps) to recover missed days

✅ **Data Persistence**:
- All stats saved to Supabase immediately
- Realtime sync across components
- Complete audit trail in ledger

✅ **Historic Data**:
- 73 days of backfill (Dec 24, 2024 → Mar 25, 2025)
- All habits marked complete
- Proper Krama count (73 days)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Tables not created** | Check SQL output for errors; verify Supabase SQL Editor syntax |
| **Can't login** | Ensure user was auto-confirmed; check email & password |
| **Stats not showing** | Run `SELECT backfill_historic_data('user-uuid')` after creating user |
| **Shop not working** | Check browser console (F12) for errors; verify stats are loading |
| **Page blank on login** | Check browser console for JavaScript errors; verify migration completed |

---

## 🎯 Success Checklist

- [ ] Migration SQL executed in Supabase
- [ ] Old auth user deleted (if existed)
- [ ] Signed up as new user (vicisssyntrx@gmail.com / 123456)
- [ ] Confirmed email (or auto-confirmed)
- [ ] Logged in successfully
- [ ] **Backfill happened automatically** ✨
- [ ] Dev server running (`npm run dev`)
- [ ] App loaded after login
- [ ] Header shows mudras (50), kramas (73), kavachas (0), urjas (0)
- [ ] Daily progress page shows 73 completed days
- [ ] Life outcomes panel displays correctly
- [ ] Charts render (week/month/year)
- [ ] Gamification center shows shields & powerups
- [ ] Shop allows buying kavachas
- [ ] Krama calendar displays 73-day streak
- [ ] Can use Urja to fill gaps
- [ ] Settings panel works
- [ ] Realtime updates working (use shop → see header update)

---

## 📋 What's Auto-Handled

| Step | What Happens | Auto? |
|------|--------------|-------|
| Sign up | Account created in `auth.users` | ✅ Supabase |
| First login | Profile created in `profiles` table | ✅ Trigger |
| First login | 4 default habits created | ✅ Trigger |
| First login | 73 days backfilled automatically | ✅ RPC call |
| First login | Stats set (mudras=50, kramas=73, etc) | ✅ RPC call |
| Subsequent login | No backfill (flag prevents duplicates) | ✅ Check `is_backfilled` |

---

## 📊 New Schema Feature: `is_backfilled` Flag

The `profiles` table now has `is_backfilled BOOLEAN` to prevent duplicate backfills:

```sql
-- First login: is_backfilled = FALSE
-- Backfill function runs automatically
-- After backfill: is_backfilled = TRUE
-- Future logins: Skips backfill (user already has 73 days)
```

This ensures data consistency and prevents accidental duplication.

---

## 📝 Next Steps

1. **Test all features** in the checklist above
2. **Deploy to Vercel** when ready:
   ```bash
   npm run build
   git add .
   git commit -m "Complete gamification overhaul"
   git push
   ```
3. **Monitor** Supabase logs for any errors
4. **Backup** important user data regularly

---

Generated: April 6, 2026
Database: Supabase (PostgreSQL)
App: Vicissometer v2 (Vite + Supabase)
