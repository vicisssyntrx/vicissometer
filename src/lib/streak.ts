import type { DailyLog } from "@/hooks/useDailyLogs";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function computeCurrentStreak(logs: DailyLog[] | undefined) {
  if (!logs?.length) return 0;

  const byDate = new Map(logs.map((log) => [log.date, log]));
  const sortedDates = [...byDate.keys()].sort();
  let cursor = sortedDates.at(-1);
  if (!cursor) return 0;

  let streak = 0;
  while (cursor) {
    const log = byDate.get(cursor);
    if (!log) break;

    const isCompleted = log.total_count > 0 && log.completed_count === log.total_count;
    const isRecovered = log.completed_count < 0;
    const keepsStreak = isCompleted || log.shield_used || isRecovered;
    if (!keepsStreak) break;

    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
