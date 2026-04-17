import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import type { TablesInsert } from "@/integrations/supabase/types";

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
      if (!user?.id) {
        console.warn("useHabits: user not authenticated");
        throw new Error("User not authenticated");
      }
      
      try {
        const { data, error } = await supabase
          .from("habits")
          .select("*")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true });
        
        if (error) {
          console.error("useHabits query error:", error);
          throw error;
        }
        
        console.log("useHabits query success, got", data?.length ?? 0, "habits");
        return data as Habit[];
      } catch (err) {
        console.error("useHabits exception:", err);
        throw err;
      }
    },
    enabled: !!user?.id,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habit: { name: string; emoji: string; outcome_name?: string; outcome_emoji?: string; reminder_time?: string }) => {
      console.log("useCreateHabit: creating habit", habit);
      
      if (!user) {
        const error = "You must be signed in to create habits.";
        console.error("useCreateHabit:", error);
        throw new Error(error);
      }

      // Get current max sort_order to assign new habit an incremented value
      let nextSortOrder = 0;
      try {
        console.log("useCreateHabit: fetching existing sort_order for user", user.id);
        
        const { data: existingHabits, error: sortOrderError } = await supabase
          .from("habits")
          .select("sort_order")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: false })
          .limit(1);
        
        if (sortOrderError) {
          console.warn("useCreateHabit: Error fetching existing sort_order:", sortOrderError);
        } else if (existingHabits && existingHabits.length > 0) {
          nextSortOrder = (existingHabits[0].sort_order ?? 0) + 1;
          console.log("useCreateHabit: next sort_order will be", nextSortOrder);
        }
      } catch (err) {
        console.warn("useCreateHabit: Exception while getting sort_order:", err);
      }

      const newHabit: TablesInsert<"habits"> = {
        user_id: user.id,
        name: habit.name,
        emoji: habit.emoji,
        outcome_name: habit.outcome_name || null,
        outcome_emoji: habit.outcome_emoji || null,
        reminder_time: habit.reminder_time || null,
        sort_order: nextSortOrder,
      };

      console.log("useCreateHabit: inserting habit", newHabit);
      
      const { data, error } = await supabase
        .from("habits")
        .insert(newHabit)
        .select()
        .single();
      
      if (error) {
        console.error("useCreateHabit: insert error", error);
        throw error;
      }
      
      console.log("useCreateHabit: success", data);
      return data as Habit;
    },
    onSuccess: () => {
      console.log("useCreateHabit: invalidating habits cache");
      qc.invalidateQueries({ queryKey: ["habits"], exact: false });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"], exact: false }),
  });
}
