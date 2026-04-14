import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (habit: { id: string; name: string; emoji: string; outcome_name?: string | null; outcome_emoji?: string | null }) => {
      const { error } = await supabase.from("habits").update({
        name: habit.name,
        emoji: habit.emoji,
        outcome_name: habit.outcome_name || null,
        outcome_emoji: habit.outcome_emoji || null,
      }).eq("id", habit.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}
