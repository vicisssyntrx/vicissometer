import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";

export default function JourneyInsights() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();

  const totalDays = logs?.length || 0;
  const missedDays = logs?.filter((l) => l.completed_count === 0 && !l.shield_used).length || 0;
  const completedDays = logs?.filter((l) => l.completed_count === l.total_count && l.total_count > 0).length || 0;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const items = [
    { label: "Current Growth", value: stats?.current_growth?.toFixed(4) || "1.0000" },
    { label: "Days Tracked", value: totalDays },
    { label: "Missed Days", value: missedDays },
    { label: "Completion Rate", value: `${completionRate}%` },
  ];

  return (
    <div className="glass rounded-2xl p-4 md:p-6">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Journey Insights</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-lg md:text-xl font-bold text-foreground">{item.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
