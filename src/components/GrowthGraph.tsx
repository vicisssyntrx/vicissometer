import { useDailyLogs } from "@/hooks/useDailyLogs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, differenceInDays } from "date-fns";

export default function GrowthGraph() {
  const { data: logs } = useDailyLogs();

  if (!logs?.length) {
    return (
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Growth</h3>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Save your first day to see growth
        </div>
      </div>
    );
  }

  const startDate = parseISO(logs[0].date);
  const data = logs.map((l) => {
    const dayNum = differenceInDays(parseISO(l.date), startDate);
    // Ideal = perfect 1% compound every day from start
    const idealGrowth = Math.pow(1.01, dayNum);
    return {
      date: format(parseISO(l.date), "MMM d"),
      actual: Number(l.growth_after.toFixed(4)),
      ideal: Number(idealGrowth.toFixed(4)),
    };
  });

  return (
    <div className="glass rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Growth</h3>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Actual</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-muted-foreground inline-block border-dashed" /> Ideal</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "hsl(0,0%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin", "auto"]} />
          <Tooltip
            contentStyle={{ background: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8, color: "#fff", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="ideal" stroke="hsl(0,0%,35%)" strokeDasharray="4 4" dot={false} strokeWidth={1} name="Ideal (1%/day)" />
          <Line type="monotone" dataKey="actual" stroke="hsl(0,72%,51%)" dot={false} strokeWidth={2} name="Your Growth" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
