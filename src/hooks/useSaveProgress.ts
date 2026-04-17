import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
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
    todayLog: any,
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
      qc.invalidateQueries({ queryKey: ["daily_logs"], exact: false });
      qc.invalidateQueries({ queryKey: ["daily_log_today"], exact: false });
      qc.invalidateQueries({ queryKey: ["daily_log_date"], exact: false });
      toast.success("Progress saved!");
      return true;
    }

    // Fetch yesterday's exact streak to prevent streak-wiping chronological bugs
    const { data: yesterdayLog } = await supabase
      .from("daily_logs")
      .select("streak_after")
      .eq("user_id", user.id)
      .lt("date", targetDate)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    const previousStreak = yesterdayLog?.streak_after || 0;

    // Today: apply rewards and update stats (RPC handles upsert)
    let prevGrowth = stats.current_growth;
    if (todayLog?.locked && todayLog.total_count > 0 && todayLog.completed_count > 0) {
      const increment = (todayLog.completed_count / todayLog.total_count) * 0.01;
      const isSynced = Math.abs(stats.current_growth - todayLog.growth_after) < 0.001;
      if (isSynced) {
        prevGrowth = stats.current_growth / (1 + increment);
      }
    }
    
    let newGrowth = prevGrowth;
    let newCoins = stats.coins;
    let newShields = stats.shields;
    let shieldUsed = false;
    let newPowerUps = stats.power_ups;

    // Cleanly roll back absolute pools using historical exactness
    const wasPerfect = todayLog?.locked && todayLog.completed_count === todayLog.total_count && todayLog.total_count > 0;
    const wasShieldUsed = todayLog?.locked && todayLog.completed_count === 0 && todayLog.total_count > 0 && todayLog.shield_used;
    
    if (wasPerfect) {
      newCoins = Math.max(0, newCoins - 10);
      const oldStreak = previousStreak + 1;
      if (oldStreak > 0 && oldStreak % 7 === 0) {
          newPowerUps = Math.max(0, newPowerUps - 1);
      }
    }
    if (wasShieldUsed) {
      newShields += 1;
    }

    if (completed > 0) {
      const increment = (completed / total) * 0.01;
      newGrowth = prevGrowth * (1 + increment);
    }

    let newStreak = previousStreak;

    if (completed === total) {
      newStreak = previousStreak + 1;
      newCoins += 10;
      if (newStreak > 0 && newStreak % 7 === 0) newPowerUps += 1;
    } else if (completed === 0) {
      if (newShields > 0) {
        newShields -= 1;
        shieldUsed = true;
      } else {
        newStreak = 0;
      }
    } else {
      newStreak = 0;
    }

    // Force unlock the row first so the RPC proceeds with updating user_stats
    if (todayLog?.locked) {
      await supabase.from("daily_logs").update({ locked: false }).eq("user_id", user.id).eq("date", targetDate);
    }

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

    qc.invalidateQueries({ queryKey: ["user_stats"], exact: false });
    qc.invalidateQueries({ queryKey: ["daily_logs"], exact: false });
    qc.invalidateQueries({ queryKey: ["daily_log_today"], exact: false });

    if (completed === total) {
      if (wasPerfect) {
        toast.success("Progress updated!");
      } else {
        toast.success("Perfect day! +10 coins");
      }
    }
    else if (shieldUsed) toast.info("Shield protected your streak");
    else if (completed > 0) toast.success("Progress saved!");
    else toast.warning("Day saved. Streak reset.");

    return true;
  };

  const resetProgress = async (
    stats: UserStats,
    todayLog: any,
    dateOverride?: string
  ) => {
    if (!user) return;
    const targetDate = dateOverride ?? localToday();
    const isSavingToday = targetDate === localToday();

    if (!isSavingToday) {
      toast.error("Can only fully reset today's progress.");
      return;
    }

    const wasPerfect = todayLog?.locked && todayLog.completed_count === todayLog.total_count && todayLog.total_count > 0;
    
    let newCoins = stats.coins;
    let newStreak = stats.streak;
    let newPowerUps = stats.power_ups;
    let newShields = stats.shields;
    let newGrowth = stats.current_growth;

    if (todayLog?.locked && todayLog.total_count > 0 && todayLog.completed_count > 0) {
      const increment = (todayLog.completed_count / todayLog.total_count) * 0.01;
      const isSynced = Math.abs(stats.current_growth - todayLog.growth_after) < 0.001;
      if (isSynced) {
        newGrowth = stats.current_growth / (1 + increment);
      }
    }

    if (wasPerfect) {
      newCoins = Math.max(0, newCoins - 10);
      newStreak = Math.max(0, newStreak - 1);
      if ((newStreak + 1) > 0 && (newStreak + 1) % 7 === 0) newPowerUps = Math.max(0, newPowerUps - 1);
    }

    const wasShieldUsed = todayLog?.locked && todayLog.completed_count === 0 && todayLog.total_count > 0 && todayLog.shield_used;
    if (wasShieldUsed) {
      newShields += 1;
    }

    // Step 1: Delete the log completely
    const { error: resetError } = await supabase
      .from("daily_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("date", targetDate);

    if (resetError) {
      toast.error("Failed to reset log: " + resetError.message);
      return false;
    }

    // Step 2: Push reverted stats
    const { error: statsError } = await supabase
      .from("user_stats")
      .update({
        coins: newCoins,
        streak: newStreak,
        power_ups: newPowerUps,
        shields: newShields,
        current_growth: newGrowth
      })
      .eq("user_id", user.id);

    if (statsError) {
      toast.error("Stats could not be fully reverted.");
    }

    qc.invalidateQueries({ queryKey: ["user_stats"], exact: false });
    qc.invalidateQueries({ queryKey: ["daily_logs"], exact: false });
    qc.invalidateQueries({ queryKey: ["daily_log_today"], exact: false });
    
    toast.success("Today's progress has been fully reset.");
    return true;
  };

  return { saveProgress, resetProgress };
}
