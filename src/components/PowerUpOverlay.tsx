import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import StreakWindow from "./StreakWindow";

interface Props { onClose: () => void; }

export default function PowerUpOverlay({ onClose }: Props) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showStreak, setShowStreak] = useState(false);

  const gaps = logs?.filter((l) => l.completed_count === 0 && !l.shield_used) || [];

  const addTestPowerUp = async () => {
    if (!user) return;
    const { data: current, error: loadError } = await supabase
      .from("user_stats")
      .select("coins, streak, shields, power_ups, current_growth, start_date")
      .eq("user_id", user.id)
      .maybeSingle();
    if (loadError) {
      toast.error(loadError.message);
      return;
    }

    if (current) {
      const { error } = await supabase
        .from("user_stats")
        .update({ power_ups: (current.power_ups ?? 0) + 1 })
        .eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_stats")
        .insert({
          user_id: user.id,
          coins: 0,
          streak: 0,
          shields: 0,
          power_ups: 1,
          current_growth: 1,
        });
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success("Added 1 power-up for testing");
  };

  const recover = async (log: (typeof gaps)[number]) => {
    if (!user || !stats || stats.power_ups < 1) {
      toast.error("No power-ups available");
      return;
    }
    const recoveryGrowth = log.growth_before * 1.01;
    const { error: logErr } = await supabase
      .from("daily_logs")
      .update({
        growth_after: recoveryGrowth,
        completed_count: -1,
      })
      .eq("id", log.id);
    if (logErr) {
      toast.error(logErr.message);
      return;
    }
    const { error: statErr } = await supabase
      .from("user_stats")
      .update({
        power_ups: stats.power_ups - 1,
        current_growth: Math.max(stats.current_growth, recoveryGrowth),
      })
      .eq("user_id", user.id);
    if (statErr) {
      toast.error(statErr.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success("Gap recovered");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">⚡ Power-Ups</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats?.power_ups || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{gaps.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Gaps Found</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Recover missed unshielded gaps. Each recovery uses 1 power-up.
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          You earn 1 power-up for every 7 consecutive streak days.
        </p>
        <Button type="button" variant="secondary" onClick={() => setShowStreak(true)} className="w-full mb-2">
          Open Streak Calendar
        </Button>
        {(stats?.power_ups ?? 0) === 0 && (
          <Button type="button" variant="secondary" onClick={addTestPowerUp} className="w-full mb-3">
            Add 1 power-up (testing)
          </Button>
        )}
        {gaps.length > 0 ? (
          <div className="space-y-2">
            {gaps.slice(0, 15).map((gap) => (
              <div key={gap.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{format(parseISO(gap.date), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">Missed day</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => recover(gap)}
                  disabled={!stats || stats.power_ups < 1}
                  className="bg-primary text-primary-foreground"
                >
                  <Zap className="h-3 w-3 mr-1" /> Recover
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            No recoverable gaps found.
          </div>
        )}
      </div>
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
    </div>
  );
}
