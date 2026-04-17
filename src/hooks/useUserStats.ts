import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

export interface UserStats {
  id: string;
  user_id: string;
  coins: number;
  streak: number;
  shields: number;
  power_ups: number;
  current_growth: number;
  updated_at: string;
  start_date: string;
}

export function useUserStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as UserStats;

      // Row doesn't exist yet — create it (upsert handles race conditions)
      const { data: created, error: createError } = await supabase
        .from("user_stats")
        .upsert({ user_id: user.id }, { onConflict: "user_id" })
        .select("*")
        .maybeSingle();
      if (createError) throw createError;
      if (!created) throw new Error("Failed to create user stats");
      return created as UserStats;
    },
    enabled: !!user?.id,
  });
}

export function useRefreshStats() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["user_stats"], exact: false });
}
