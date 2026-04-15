import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

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

function normalizeCompletedHabits(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeLog(log: Omit<DailyLog, "completed_habits"> & { completed_habits: Json }): DailyLog {
  return {
    ...log,
    completed_habits: normalizeCompletedHabits(log.completed_habits),
  };
}

export function useDailyLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data.map((row) => normalizeLog(row));
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
        .eq("user_id", user!.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeLog(data) : null;
    },
    enabled: !!user,
  });
}

export function useLogForDate(date: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_log_date", user?.id, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeLog(data) : null;
    },
    enabled: !!user && !!date,
  });
}

export function useRefreshLogs() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["daily_log_today"] });
    qc.invalidateQueries({ queryKey: ["daily_log_date"] });
  };
}
