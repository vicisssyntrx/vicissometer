import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";

export default function JourneyInsights() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return "1";
    return Number(value.toFixed(4)).toString();
  };

  const totalDays = logs?.length || 0;
  const missedDays = logs?.filter((l) => l.completed_count === 0 && !l.shield_used).length || 0;
  const completedDays = logs?.filter((l) => l.completed_count === l.total_count && l.total_count > 0).length || 0;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const items = [
    { label: "Current Growth", value: formatGrowth(stats?.current_growth) },
    { label: "Days Tracked", value: totalDays },
    { label: "Missed Days", value: missedDays },
    { label: "Completion Rate", value: `${completionRate}%` },
  ];

  return (
    <div className="glass rounded-2xl p-3 md:p-5">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Journey Insights</h3>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-sm md:text-lg font-bold text-foreground">{item.value}</p>
            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
