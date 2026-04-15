import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import {
  format,
  parseISO,
  differenceInDays,
  isValid,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";

export default function GrowthGraph() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const [range, setRange] = useState<"week" | "month" | "all">("all");

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

  const firstValidLog = useMemo(() => logs.find((log) => isValid(parseISO(log.date))), [logs]);
  const statsStart = useMemo(() => (stats?.start_date ? parseISO(stats.start_date) : null), [stats?.start_date]);
  const programStart = useMemo(() => {
    return statsStart && isValid(statsStart)
      ? statsStart
      : firstValidLog
        ? parseISO(firstValidLog.date)
        : new Date();
  }, [statsStart, firstValidLog]);

  const latestValidDate = useMemo(() => {
    const dates = logs
      .map((l) => parseISO(l.date))
      .filter((d) => isValid(d))
      .sort((a, b) => a.getTime() - b.getTime());
    return dates.at(-1) ?? new Date();
  }, [logs]);

  const { filteredLogs, labelFormat } = useMemo(() => {
    const weekStart = startOfWeek(latestValidDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(latestValidDate, { weekStartsOn: 1 });
    const monthStart = startOfMonth(latestValidDate);
    const monthEnd = endOfMonth(latestValidDate);

    const interval =
      range === "week"
        ? { start: weekStart, end: weekEnd }
        : range === "month"
          ? { start: monthStart, end: monthEnd }
          : null;

    const kept = interval
      ? logs.filter((l) => {
          const d = parseISO(l.date);
          return isValid(d) && isWithinInterval(d, interval);
        })
      : logs;

    return {
      filteredLogs: kept,
      labelFormat: range === "week" ? "EEE" : "MMM d",
    };
  }, [logs, latestValidDate, range]);

  const data = filteredLogs
    .map((l) => {
      const parsedDate = parseISO(l.date);
      if (!isValid(parsedDate)) return null;
      const dayNum = differenceInDays(parsedDate, programStart);
      const idealGrowth = Math.pow(1.01, Math.max(0, dayNum));
      return {
        date: format(parsedDate, labelFormat),
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
      <div className="glass rounded-2xl p-3 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Growth</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRange("week")}
            className={`rounded-lg px-2 py-1 text-xs transition-colors ${range === "week" ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setRange("month")}
            className={`rounded-lg px-2 py-1 text-xs transition-colors ${range === "month" ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setRange("all")}
            className={`rounded-lg px-2 py-1 text-xs transition-colors ${range === "all" ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-primary inline-block" /> Actual</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-muted-foreground inline-block" /> Ideal</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin", "auto"]} width={44} />
          <Tooltip contentStyle={{ background: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
          <Line type="monotone" dataKey="ideal" stroke="hsl(0,0%,35%)" strokeDasharray="4 4" dot={false} strokeWidth={1} name="Ideal (1%/day)" />
          <Line type="monotone" dataKey="actual" stroke="hsl(0,72%,51%)" dot={false} strokeWidth={2} name="Your Growth" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
