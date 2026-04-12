import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Habit } from "./useHabits";
import { UserStats } from "./useUserStats";

export function useSaveProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const saveProgress = async (
    habits: Habit[],
    completedIds: Set<string>,
    stats: UserStats
  ) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const total = habits.length;
    const completed = completedIds.size;

    if (total === 0) {
      toast.error("Add some habits first!");
      return;
    }

    // Growth calc
    const prevGrowth = stats.current_growth;
    let newGrowth = prevGrowth;
    let newStreak = stats.streak;
    let newCoins = stats.coins;
    let newShields = stats.shields;
    let shieldUsed = false;
    let newPowerUps = stats.power_ups;

    if (completed > 0) {
      const increment = (completed / total) * 0.01;
      newGrowth = prevGrowth * (1 + increment);
    }

    if (completed === total) {
      newStreak += 1;
      newCoins += 10;
      // Power-up every 7 full days
      if (newStreak > 0 && newStreak % 7 === 0) {
        newPowerUps += 1;
      }
    } else if (completed === 0) {
      if (stats.shields > 0) {
        newShields -= 1;
        shieldUsed = true;
        // streak preserved, no growth
        newGrowth = prevGrowth;
      } else {
        newStreak = 0;
        newGrowth = prevGrowth;
      }
    }
    // Partial: streak breaks (not shielded for partial)

    if (completed > 0 && completed < total) {
      newStreak = 0;
    }

    // Insert daily log
    const { error: logErr } = await supabase.from("daily_logs").upsert({
      user_id: user.id,
      date: today,
      completed_habits: Array.from(completedIds),
      completed_count: completed,
      total_count: total,
      shield_used: shieldUsed,
      streak_after: newStreak,
      growth_before: prevGrowth,
      growth_after: newGrowth,
      locked: true,
    }, { onConflict: "user_id,date" });

    if (logErr) {
      toast.error("Failed to save: " + logErr.message);
      return;
    }

    // Update stats
    const { error: statErr } = await supabase.from("user_stats").update({
      coins: newCoins,
      streak: newStreak,
      shields: newShields,
      power_ups: newPowerUps,
      current_growth: newGrowth,
    }).eq("user_id", user.id);

    if (statErr) {
      toast.error("Failed to update stats: " + statErr.message);
      return;
    }

    qc.invalidateQueries({ queryKey: ["user_stats"] });
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["daily_log_today"] });

    if (completed === total) {
      toast.success("🔥 Perfect day! +10 coins");
    } else if (shieldUsed) {
      toast.info("🛡️ Shield protected your streak");
    } else if (completed > 0) {
      toast.success("Progress saved!");
    } else {
      toast.warning("Day saved. Streak reset.");
    }

    return true;
  };

  return { saveProgress };
}
