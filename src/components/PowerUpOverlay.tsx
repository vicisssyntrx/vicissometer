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

export default function PowerUpOverlay({ onClose }: Props) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Find gap days (completed_count === 0 and not shielded, growth didn't increase)
  const gaps = logs?.filter((l) => l.completed_count === 0 && !l.shield_used) || [];

  const recover = async (log: typeof gaps[0]) => {
    if (!user || !stats || stats.power_ups < 1) {
      toast.error("No power-ups available!");
      return;
    }

    // Apply +1% recovery
    const recoveryGrowth = log.growth_before * 1.01;

    const { error: logErr } = await supabase.from("daily_logs").update({
      growth_after: recoveryGrowth,
      completed_count: -1, // mark as recovered
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">⚡ Power-Up Recovery</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Power-ups remaining: <span className="text-primary font-bold">{stats?.power_ups || 0}</span>
        </p>

        {gaps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recoverable gaps found! 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {gaps.map((g) => (
              <div key={g.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{format(parseISO(g.date), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">Missed day — no growth applied</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => recover(g)}
                  disabled={(stats?.power_ups || 0) < 1}
                  className="bg-primary text-primary-foreground"
                >
                  <Zap className="h-3 w-3 mr-1" /> Recover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
