import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as UserStats;
    },
    enabled: !!user,
  });
}

export function useRefreshStats() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["user_stats"] });
}
