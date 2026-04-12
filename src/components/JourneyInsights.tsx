import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";

export default function JourneyInsights() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();

  const totalDays = logs?.length || 0;
  const completedDays = logs?.filter((l) => l.completed_count === l.total_count && l.total_count > 0).length || 0;
  const partialDays = logs?.filter((l) => l.completed_count > 0 && l.completed_count < l.total_count).length || 0;
  const missedDays = logs?.filter((l) => l.completed_count === 0 && !l.shield_used).length || 0;
  const shieldedDays = logs?.filter((l) => l.shield_used).length || 0;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const items = [
    { label: "Days Tracked", value: totalDays },
    { label: "Perfect Days", value: completedDays },
    { label: "Partial Days", value: partialDays },
    { label: "Missed Days", value: missedDays },
    { label: "Shielded Days", value: shieldedDays },
    { label: "Completion Rate", value: `${completionRate}%` },
    { label: "Current Growth", value: stats?.current_growth?.toFixed(4) || "1.0000" },
    { label: "Shields Left", value: stats?.shields || 0 },
    { label: "Power-ups Left", value: stats?.power_ups || 0 },
  ];

  return (
    <div className="glass rounded-2xl p-4 md:p-6">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Journey Insights</h3>
      <div className="grid grid-cols-3 gap-3">
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
