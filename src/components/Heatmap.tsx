import { useDailyLogs } from "@/hooks/useDailyLogs";
import { format, eachDayOfInterval, startOfYear, endOfYear, parseISO, getDay } from "date-fns";

export default function Heatmap() {
  const { data: logs } = useDailyLogs();

  const year = new Date().getFullYear();
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));
  const days = eachDayOfInterval({ start, end });

  const logMap = new Map<string, { completed: number; total: number; shielded: boolean }>();
  if (logs) {
    for (const l of logs) {
      logMap.set(l.date, { completed: l.completed_count, total: l.total_count, shielded: l.shield_used });
    }
  }

  const getColor = (dateStr: string) => {
    const entry = logMap.get(dateStr);
    if (!entry) return "bg-secondary";
    if (entry.shielded) return "bg-primary/40 ring-1 ring-primary/60";
    if (entry.completed === entry.total) return "bg-primary";
    if (entry.completed > 0) return "bg-primary/50";
    return "bg-muted";
  };

  // Group by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  for (const day of days) {
    if (getDay(day) === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length) weeks.push(currentWeek);

  return (
    <div className="glass rounded-2xl p-4 md:p-6">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Consistency</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-[2px] min-w-[680px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                return (
                  <div
                    key={dateStr}
                    className={`w-3 h-3 rounded-[2px] ${getColor(dateStr)} transition-colors`}
                    title={`${format(day, "MMM d")}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-[2px] bg-secondary" /> None</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-[2px] bg-primary/50" /> Partial</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-[2px] bg-primary" /> Full</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-[2px] bg-primary/40 ring-1 ring-primary/60" /> Shielded</span>
      </div>
    </div>
  );
}
