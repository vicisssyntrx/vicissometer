import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Habit } from "./useHabits";
import { UserStats } from "./useUserStats";
import type { Json } from "@/integrations/supabase/types";
import { todayYmdLocal } from "@/lib/date";

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

  const localToday = () => todayYmdLocal();

  const saveProgress = async (
    habits: Habit[],
    completedIds: Set<string>,
    stats: UserStats,
    dateOverride?: string
  ) => {
    if (!user) return;
    const targetDate = dateOverride ?? localToday();
    const isSavingToday = targetDate === localToday();
    const total = habits.length;
    const completed = completedIds.size;

    if (total === 0) {
      toast.error("Add some habits first!");
      return;
    }

    // Past-day editing should NOT award coins, change streak, or mutate user_stats.
    if (!isSavingToday) {
      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          {
            user_id: user.id,
            date: targetDate,
            completed_habits: Array.from(completedIds),
            completed_count: completed,
            total_count: total,
            shield_used: false,
            streak_after: 0,
            growth_before: 1.0,
            growth_after: 1.0,
            locked: false,
          },
          { onConflict: "user_id,date" }
        );
      if (error) {
        toast.error("Failed to save progress: " + error.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ["daily_logs"] });
      qc.invalidateQueries({ queryKey: ["daily_log_today"] });
      qc.invalidateQueries({ queryKey: ["daily_log_date"] });
      toast.success("Progress saved!");
      return true;
    }

    // Today: apply rewards and update stats (RPC handles upsert)
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
      if (newStreak > 0 && newStreak % 7 === 0) newPowerUps += 1;
    } else if (completed === 0) {
      if (stats.shields > 0) {
        newShields -= 1;
        shieldUsed = true;
        newGrowth = prevGrowth;
      } else {
        newStreak = 0;
        newGrowth = prevGrowth;
      }
    }

    if (completed > 0 && completed < total) newStreak = 0;

    const { data, error: rpcError } = await supabase.rpc("save_daily_progress", {
      p_date: targetDate,
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

    if (completed === total) toast.success("Perfect day! +10 coins");
    else if (shieldUsed) toast.info("Shield protected your streak");
    else if (completed > 0) toast.success("Progress saved!");
    else toast.warning("Day saved. Streak reset.");

    return true;
  };

  return { saveProgress };
}
