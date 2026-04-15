import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { format, eachDayOfInterval, parseISO, getDay, addYears, isValid, subDays } from "date-fns";

export default function Heatmap() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();

  const now = new Date();
  const parsedStart = stats?.start_date ? parseISO(stats.start_date) : null;
  const fallbackStart = subDays(now, 180);
  const safeStart = parsedStart && isValid(parsedStart) ? parsedStart : fallbackStart;
  const projectedEnd = addYears(safeStart, 1);
  const safeEnd = projectedEnd > now ? now : projectedEnd;
  const clampedStart = safeStart > safeEnd ? subDays(safeEnd, 30) : safeStart;

  const days = eachDayOfInterval({ start: clampedStart, end: safeEnd });

  const logMap = new Map<string, { completed: number; total: number; shielded: boolean }>();
  if (logs) {
    for (const l of logs) {
      logMap.set(l.date, { completed: l.completed_count, total: l.total_count, shielded: l.shield_used });
    }
  }

  const getColor = (dateStr: string) => {
    const entry = logMap.get(dateStr);
    if (!entry) return "bg-secondary/50";
    if (entry.shielded) return "bg-primary/40 ring-1 ring-primary/60";
    if (entry.completed === entry.total) return "bg-primary";
    if (entry.completed > 0) return "bg-primary/50";
    return "bg-muted";
  };

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
    <div className="glass rounded-2xl p-2 md:p-5">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Heatmap</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-[2px] min-w-[680px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                return (
                  <div key={dateStr} className={`w-2.5 h-2.5 rounded-[2px] ${getColor(dateStr)} transition-colors`} title={format(day, "MMM d")} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-[2px] bg-secondary/50" /> None</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-[2px] bg-primary/50" /> Partial</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-[2px] bg-primary" /> Full</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-[2px] bg-primary/40 ring-1 ring-primary/60" /> Shielded</span>
      </div>
    </div>
  );
}
