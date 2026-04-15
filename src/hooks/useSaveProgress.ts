import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Habit } from "./useHabits";
import { UserStats } from "./useUserStats";
import type { Json } from "@/integrations/supabase/types";

interface SaveProgressResponse {
  success?: boolean;
  message?: string;
}

function parseSaveResponse(value: Json): SaveProgressResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const maybeSuccess = value.success;
  const maybeMessage = value.message;
  return {
    success: typeof maybeSuccess === "boolean" ? maybeSuccess : undefined,
    message: typeof maybeMessage === "string" ? maybeMessage : undefined,
  };
}

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

    const { data, error: rpcError } = await supabase.rpc("save_daily_progress", {
      p_date: today,
      p_total_count: total,
      p_completed_habits: Array.from(completedIds),
      p_completed_count: completed,
      p_shield_used: shieldUsed,
      p_streak_after: newStreak,
      p_growth_before: prevGrowth,
      p_growth_after: newGrowth,
      p_coins: newCoins,
      p_streak: newStreak,
      p_shields: newShields,
      p_power_ups: newPowerUps,
      p_current_growth: newGrowth,
    });

    if (rpcError) {
      toast.error("Failed to save progress: " + rpcError.message);
      return;
    }
    const response = parseSaveResponse(data);
    if (!response.success) {
      toast.error(response.message || "Could not save progress");
      return;
    }

    qc.invalidateQueries({ queryKey: ["user_stats"] });
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["daily_log_today"] });

    if (completed === total) {
      toast.success("Perfect day! +10 coins");
    } else if (shieldUsed) {
      toast.info("Shield protected your streak");
    } else if (completed > 0) {
      toast.success("Progress saved!");
    } else {
      toast.warning("Day saved. Streak reset.");
    }

    return true;
  };

  return { saveProgress };
}
