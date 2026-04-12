import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  completed_habits: string[];
  completed_count: number;
  total_count: number;
  shield_used: boolean;
  streak_after: number;
  growth_before: number;
  growth_after: number;
  locked: boolean;
  created_at: string;
}

export function useDailyLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data as DailyLog[];
    },
    enabled: !!user,
  });
}

export function useTodayLog() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["daily_log_today", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data as DailyLog | null;
    },
    enabled: !!user,
  });
}

export function useRefreshLogs() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["daily_log_today"] });
  };
}
