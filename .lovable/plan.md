
# Vicissometer — Phase 1: Auth, Dashboard Shell, Habit System & Saving

## Overview
Build the core foundation: authentication, the main dashboard layout, habit creation/tracking, the Save Progress flow, and the stats bar. Dark theme with red-only accent, glassmorphism panels, subtle particle background, mobile-first.

## Design System
- **Background**: Pure black with very subtle animated particle field
- **Accent**: Red only (no other colors)
- **Cards**: Glassmorphism — semi-transparent, blurred backdrop, thin border
- **Typography**: Clean sans-serif (Inter), large numeric stats, compact labels
- **Shape**: Rounded cards, soft shadows, spacious layout

## Database (Supabase)
Create these tables with RLS policies (all user data scoped to authenticated user):
- **profiles** — id, user_id (FK auth.users), display_name, avatar_url, created_at
- **habits** — id, user_id, name, emoji, outcome_name, outcome_emoji, reminder_time, sort_order, created_at
- **daily_logs** — id, user_id, date, completed_habits (jsonb array of habit IDs toggled), completed_count, total_count, shield_used, streak_after, growth_before, growth_after, locked, created_at
- **user_stats** — id, user_id, coins, streak, shields, power_ups, current_growth, updated_at
- Auto-create profile + user_stats row on signup via DB trigger

## Auth
- Email + password sign-in/sign-up screen (dark themed, red accents)
- Auto-create profile on signup
- Session persistence
- Profile avatar (initial-based) in top-right navbar
- Protected routes — redirect to auth if not signed in

## Dashboard Layout
### Desktop (≥768px)
- **Top navbar**: "Vicissometer" left, notification bell + avatar right
- **Stats row** below navbar: Coins 🪙, Streak 🔥, Shields 🛡️, Power-ups ⚡ (clickable, functionality in later phases)
- **Left column**: Habit creation card + habit list + Save Progress button
- **Right column**: Placeholder slots for graph, heatmap, journey insights (Phase 2)
- **Bottom**: Outcome cards

### Mobile (<768px)
- **Top bar**: Compact stat icons left, bell + avatar right
- **Stacked vertical**: Habit card → habit list → Save Progress → outcome cards → placeholders

## Habit Creation
- Minimal form: habit name, emoji picker, outcome name, outcome emoji, optional reminder time
- Creates row in `habits` table
- Appears instantly in habit list

## Habit List & Toggles
- Each habit = card with emoji, name, outcome label, toggle switch
- Toggles are LOCAL only — not saved to DB until Save Progress
- Visual state: toggled on = red accent, toggled off = grey/muted

## Save Progress Button
- Prominent red button, always visible
- On press:
  1. Calculate growth: `daily_increment = (completed / total) * 0.01`, `new_growth = prev * (1 + daily_increment)`
  2. Update streak (all done = +1, zero done + shield = use shield + preserve, zero done + no shield = reset to 0)
  3. Award 10 coins if all habits completed
  4. Create `daily_logs` entry with locked=true
  5. Update `user_stats`
  6. Red pulse animation + confirmation message
- Day becomes locked — toggles disabled for that date

## Stats Bar
- Four glass cards showing: Coins, Streak, Shields, Power-ups
- Live updates after Save Progress
- Each card clickable (shield shop / power-up overlay hooked up in Phase 3)

## Outcome Cards
- Group habits by outcome
- Show: outcome emoji, outcome name, linked habits, completion ratio for current period
- Identity-reinforcing labels ("You are becoming a Thinker")

## What's deferred to Phase 2+
- Growth graph & heatmap (Phase 2)
- Journey insights (Phase 2)
- Shield shop & power-up recovery overlays (Phase 3)
- Settings, CSV import, notifications panel (Phase 4)
- Google sign-in (Phase 4)
