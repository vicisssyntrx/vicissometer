import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface Props { onClose: () => void; }

export default function StreakWindow({ onClose }: Props) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const { user } = useAuth();
  const qc = useQueryClient();

  const completedDays = logs?.filter((l) => l.completed_count === l.total_count && l.total_count > 0) || [];
  const partialDays = logs?.filter((l) => l.completed_count > 0 && l.completed_count < l.total_count) || [];
  const shieldedDays = logs?.filter((l) => l.shield_used) || [];
  const missedDays = logs?.filter((l) => l.completed_count === 0 && !l.shield_used) || [];

  const recover = async (log: typeof missedDays[0]) => {
    if (!user || !stats || stats.power_ups < 1) {
      toast.error("No power-ups available!");
      return;
    }
    const recoveryGrowth = log.growth_before * 1.01;
    const { error: logErr } = await supabase.from("daily_logs").update({
      growth_after: recoveryGrowth,
      completed_count: -1,
    }).eq("id", log.id);
    if (logErr) { toast.error(logErr.message); return; }
    const { error: statErr } = await supabase.from("user_stats").update({
      power_ups: stats.power_ups - 1,
      current_growth: Math.max(stats.current_growth, recoveryGrowth),
    }).eq("user_id", user.id);
    if (statErr) { toast.error(statErr.message); return; }
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success("⚡ Gap recovered!");
  };

  const items = [
    { label: "Current Streak", value: stats?.streak || 0, icon: "🔥" },
    { label: "Completed Days", value: completedDays.length, icon: "✅" },
    { label: "Partial Days", value: partialDays.length, icon: "🟡" },
    { label: "Shielded Gaps", value: shieldedDays.length, icon: "🛡️" },
    { label: "Unshielded Gaps", value: missedDays.length, icon: "❌" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">🔥 Streak Overview</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {items.map((item) => (
            <div key={item.label} className="glass rounded-xl p-3 text-center">
              <span className="text-lg">{item.icon}</span>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>

        {stats && stats.power_ups > 0 && missedDays.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">⚡ Use Power-Ups ({stats.power_ups} remaining)</h3>
            </div>
            <div className="space-y-2">
              {missedDays.slice(0, 10).map((g) => (
                <div key={g.id} className="glass rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{format(parseISO(g.date), "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">Missed — no growth</p>
                  </div>
                  <Button size="sm" onClick={() => recover(g)} disabled={stats.power_ups < 1} className="bg-primary text-primary-foreground">
                    <Zap className="h-3 w-3 mr-1" /> Recover
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {missedDays.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">No gaps to recover! 🎉</div>
        )}
      </div>
    </div>
  );
}
