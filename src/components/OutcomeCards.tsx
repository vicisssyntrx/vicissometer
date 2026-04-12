import { useHabits } from "@/hooks/useHabits";
import { useDailyLogs } from "@/hooks/useDailyLogs";

export default function OutcomeCards() {
  const { data: habits } = useHabits();
  const { data: logs } = useDailyLogs();

  if (!habits?.length) return null;

  // Group by outcome
  const outcomes = new Map<string, { emoji: string; habits: typeof habits; completedCount: number; totalCount: number }>();
  for (const h of habits) {
    const key = h.outcome_name || "General";
    if (!outcomes.has(key)) {
      outcomes.set(key, { emoji: h.outcome_emoji || "🎯", habits: [], completedCount: 0, totalCount: 0 });
    }
    outcomes.get(key)!.habits.push(h);
  }

  // Count completions from logs
  if (logs) {
    for (const log of logs) {
      const completedSet = new Set(log.completed_habits);
      for (const [, outcome] of outcomes) {
        for (const h of outcome.habits) {
          outcome.totalCount++;
          if (completedSet.has(h.id)) outcome.completedCount++;
        }
      }
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground px-1">Becoming</h3>
      <div className="grid gap-2">
        {Array.from(outcomes.entries()).map(([name, o]) => {
          const ratio = o.totalCount > 0 ? Math.round((o.completedCount / o.totalCount) * 100) : 0;
          return (
            <div key={name} className="glass rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{o.emoji}</span>
                <div>
                  <p className="font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{o.habits.length} habit{o.habits.length > 1 ? "s" : ""}</p>
                </div>
                <span className="ml-auto text-lg font-bold text-primary">{ratio}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${ratio}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                You are becoming a {name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
