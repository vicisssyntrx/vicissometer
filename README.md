# Vicissometer

A gamified daily habit tracker designed to build consistency through streak mechanics, power-ups, shields, and interactive data visualization. Built on the "1% better every day" compound growth principle.

## Features

- ✅ Daily habit tracking with completion streaks
- 🔥 Streak shields to protect your momentum
- ⚡ Power-ups to recover missed days
- 🪙 Coin rewards and gamified progression
- 📈 Growth graph showing compounding 1%/day improvement
- 📊 Journey Insights: completion rate, missed days, growth multiplier
- 📱 Mobile-first, PWA-ready with offline support
- 🔒 Fully server-authoritative reward calculations (no client-side tampering)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| UI | Shadcn UI, Radix primitives, Tailwind CSS |
| State | TanStack React Query v5 |
| Backend | Supabase (Postgres, Auth, Storage, RPCs) |
| CSV Import | PapaParse |
| Charts | Recharts |

## Local Setup

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your Supabase keys:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Apply database migrations:
   ```bash
   npx supabase db push
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Security Architecture

All sensitive game-state mutations are enforced server-side via Postgres RPCs:
- `save_daily_progress` — computes coins, streaks, and growth server-side
- `reset_daily_progress` — atomically deletes logs and reverts stats
- `buy_shields` — uses `FOR UPDATE` row locking to prevent double-spend
- `bulk_import_daily_logs` — single-request CSV import via JSON array
- Row Level Security (RLS) is enforced on all tables

---

Made with ❤️ by [Viciss Syntrx](https://linktr.ee/vicisssyntrx)
