import { useHabits } from "@/hooks/useHabits";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useMemo } from "react";

export default function OutcomeCards() {
  const { data: habits } = useHabits();
  const { data: logs } = useDailyLogs();
  const safeHabits = useMemo(() => habits ?? [], [habits]);

  const outcomes = useMemo(() => {
    const grouped = new Map<
      string,
      { emoji: string; habits: typeof safeHabits; habitPercents: number[] }
    >();
    for (const h of safeHabits) {
      const key = h.outcome_name || "General";
      if (!grouped.has(key)) grouped.set(key, { emoji: h.outcome_emoji || "🎯", habits: [], habitPercents: [] });
      grouped.get(key)!.habits.push(h);
    }

    if (!grouped.size) return grouped;

    // Build completed-days count per habit.
    // 100% = 365 completed days (one full year of identity-building).
    // Habits added mid-program are capped at their accumulated completions / 365.
    const completedDaysByHabit = new Map<string, number>();
    if (logs) {
      for (const log of logs) {
        const completedSet = new Set(log.completed_habits);
        for (const h of safeHabits) {
          if (!completedSet.has(h.id)) continue;
          // Only count days on or after the habit was created
          if (log.date < h.created_at.slice(0, 10)) continue;
          completedDaysByHabit.set(h.id, (completedDaysByHabit.get(h.id) ?? 0) + 1);
        }
      }
    }

    for (const [, outcome] of grouped) {
      for (const h of outcome.habits) {
        const completedDays = completedDaysByHabit.get(h.id) ?? 0;
        // 365 is the fixed denominator — identity is built over a full year
        const pct = Math.min(100, Math.round((completedDays / 365) * 100));
        outcome.habitPercents.push(pct);
      }
    }
    return grouped;
  }, [safeHabits, logs]);

  if (!safeHabits.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground px-1">Outcomes</h3>
      <div className="grid grid-cols-2 gap-2">
        {Array.from(outcomes.entries()).map(([name, o]) => {
          const ratio =
            o.habitPercents.length > 0
              ? Math.round(o.habitPercents.reduce((a, b) => a + b, 0) / o.habitPercents.length)
              : 0;
          return (
            <div key={name} className="glass flex flex-col justify-center rounded-xl p-3 md:p-4 h-full min-h-[72px]">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xl leading-none shrink-0">{o.emoji}</span>
                <p className="font-semibold text-foreground text-sm sm:text-base truncate flex-1 ml-1">{name}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-primary shrink-0 leading-none min-w-[32px] ml-1.5">{ratio}%</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${ratio}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
