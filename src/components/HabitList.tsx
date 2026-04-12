import { useHabits, useDeleteHabit, Habit } from "@/hooks/useHabits";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

interface Props {
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  locked: boolean;
}

export default function HabitList({ completedIds, onToggle, locked }: Props) {
  const { data: habits, isLoading } = useHabits();
  const deleteHabit = useDeleteHabit();

  if (isLoading) return <div className="glass rounded-2xl p-6 text-center text-muted-foreground">Loading habits...</div>;
  if (!habits?.length) return <div className="glass rounded-2xl p-6 text-center text-muted-foreground">No habits yet. Create one above!</div>;

  return (
    <div className="space-y-2">
      {habits.map((h) => {
        const checked = completedIds.has(h.id);
        return (
          <div
            key={h.id}
            className={`glass rounded-xl p-4 flex items-center gap-3 transition-all ${checked ? "border-primary/40" : ""}`}
          >
            <span className="text-xl">{h.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{h.name}</p>
              {h.outcome_name && (
                <p className="text-xs text-muted-foreground">
                  {h.outcome_emoji} {h.outcome_name}
                </p>
              )}
            </div>
            <Switch
              checked={checked}
              onCheckedChange={() => onToggle(h.id)}
              disabled={locked}
              className="data-[state=checked]:bg-primary"
            />
            {!locked && (
              <button
                onClick={() => deleteHabit.mutate(h.id)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
