import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { todayYmdLocal } from "@/lib/date";

export default function JourneyInsights() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  
  const denseLogs = getDenseLogs(logs, stats?.start_date);

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return "1x";
    return Number(value.toFixed(4)).toString() + "x";
  };

  const totalDays = denseLogs.length || 0;
  const today = todayYmdLocal();
  const missedDays = denseLogs.filter((l) => l.completed_count === 0 && !l.shield_used && l.date !== today).length || 0;
  const completedDays = denseLogs.filter((l) => (l.completed_count === l.total_count && l.total_count > 0) || l.completed_count === -1).length || 0;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const items = [
    { label: "Current Growth", value: formatGrowth(stats?.current_growth), colorClass: "text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" },
    { label: "Completed Days", value: <><span className="text-[#4ade80]">{completedDays}</span><span className="text-foreground text-[10px] md:text-sm ml-1 font-medium">/ {totalDays}</span></>, colorClass: "" },
    { label: "Missed Days", value: missedDays, colorClass: "text-[#f87171]" },
    { label: "Completion Rate", value: `${completionRate}%`, colorClass: "text-foreground" },
  ];

  return (
    <div className="glass rounded-2xl p-3 md:p-5">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Journey Insights</h3>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className={`text-sm md:text-lg font-bold ${item.colorClass}`}>{item.value}</p>
            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
