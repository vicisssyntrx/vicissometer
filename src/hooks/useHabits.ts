import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  outcome_name: string | null;
  outcome_emoji: string | null;
  reminder_time: string | null;
  sort_order: number;
  created_at: string;
}

export function useHabits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habit: { name: string; emoji: string; outcome_name?: string; outcome_emoji?: string; reminder_time?: string }) => {
      const { data, error } = await supabase.from("habits").insert({
        user_id: user!.id,
        name: habit.name,
        emoji: habit.emoji,
        outcome_name: habit.outcome_name || null,
        outcome_emoji: habit.outcome_emoji || null,
        reminder_time: habit.reminder_time || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}
