import { useDailyLogs } from "@/hooks/useDailyLogs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO, differenceInDays, addDays } from "date-fns";

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
  const data = logs.map((l, i) => {
    const dayNum = differenceInDays(parseISO(l.date), startDate);
    const idealGrowth = Math.pow(1.01, dayNum);
    return {
      date: format(parseISO(l.date), "MMM d"),
      actual: Number(l.growth_after.toFixed(4)),
      ideal: Number(idealGrowth.toFixed(4)),
      shielded: l.shield_used,
    };
  });

  return (
    <div className="glass rounded-2xl p-4 md:p-6">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Growth</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "hsl(0,0%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin", "auto"]} />
          <Tooltip
            contentStyle={{ background: "hsl(0,0%,8%)", border: "1px solid hsl(0,0%,16%)", borderRadius: 8, color: "#fff" }}
          />
          <Line type="monotone" dataKey="ideal" stroke="hsl(0,0%,30%)" strokeDasharray="4 4" dot={false} strokeWidth={1} />
          <Line type="monotone" dataKey="actual" stroke="hsl(0,72%,51%)" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
