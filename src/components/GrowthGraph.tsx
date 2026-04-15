import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, differenceInDays, isValid } from "date-fns";

export default function GrowthGraph() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();

  if (!logs?.length) {
    return (
      <div className="glass rounded-2xl p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Growth</h3>
        <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">
          Save your first day to see growth
        </div>
      </div>
    );
  }

  const firstValidLog = logs.find((log) => isValid(parseISO(log.date)));
  const statsStart = stats?.start_date ? parseISO(stats.start_date) : null;
  const programStart =
    statsStart && isValid(statsStart)
      ? statsStart
      : firstValidLog
        ? parseISO(firstValidLog.date)
        : new Date();

  const data = logs
    .map((l) => {
      const parsedDate = parseISO(l.date);
      if (!isValid(parsedDate)) return null;
      const dayNum = differenceInDays(parsedDate, programStart);
      const idealGrowth = Math.pow(1.01, Math.max(0, dayNum));
      return {
        date: format(parsedDate, "MMM d"),
        actual: Number(l.growth_after.toFixed(4)),
        ideal: Number(idealGrowth.toFixed(4)),
      };
    })
    .filter((item): item is { date: string; actual: number; ideal: number } => !!item);

  if (!data.length) {
    return (
      <div className="glass rounded-2xl p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Growth</h3>
        <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">
          Invalid growth dates detected in history
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-2 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Growth</h3>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-primary inline-block" /> Actual</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-muted-foreground inline-block" /> Ideal</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "hsl(0,0%,55%)", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 9 }} axisLine={false} tickLine={false} domain={["dataMin", "auto"]} width={40} />
          <Tooltip contentStyle={{ background: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8, color: "#fff", fontSize: 11 }} />
          <Line type="monotone" dataKey="ideal" stroke="hsl(0,0%,35%)" strokeDasharray="4 4" dot={false} strokeWidth={1} name="Ideal (1%/day)" />
          <Line type="monotone" dataKey="actual" stroke="hsl(0,72%,51%)" dot={false} strokeWidth={2} name="Your Growth" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
