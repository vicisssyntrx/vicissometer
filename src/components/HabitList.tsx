import { useHabits, useDeleteHabit } from "@/hooks/useHabits";
import { useUpdateHabit } from "@/hooks/useUpdateHabit";
import { Switch } from "@/components/ui/switch";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  locked: boolean;
}

export default function HabitList({ completedIds, onToggle, locked }: Props) {
  const { data: habits, isLoading } = useHabits();
  const deleteHabit = useDeleteHabit();
  const updateHabit = useUpdateHabit();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editOutcome, setEditOutcome] = useState("");
  const [editOutcomeEmoji, setEditOutcomeEmoji] = useState("");

  if (isLoading) return <div className="glass rounded-xl p-4 text-center text-muted-foreground text-sm">Loading habits...</div>;
  if (!habits?.length) return <div className="glass rounded-xl p-4 text-center text-muted-foreground text-sm">No habits yet. Create one above!</div>;

  const startEdit = (h: typeof habits[0]) => {
    setEditingId(h.id);
    setEditName(h.name);
    setEditEmoji(h.emoji);
    setEditOutcome(h.outcome_name || "");
    setEditOutcomeEmoji(h.outcome_emoji || "");
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) { toast.error("Name required"); return; }
    updateHabit.mutate({
      id: editingId, name: editName.trim(), emoji: editEmoji || "✅",
      outcome_name: editOutcome.trim() || null, outcome_emoji: editOutcomeEmoji || null,
    }, { onSuccess: () => { setEditingId(null); toast.success("Updated!"); } });
  };

  return (
    <div className="space-y-1.5">
      {habits.map((h) => {
        const checked = completedIds.has(h.id);
        const isEditing = editingId === h.id;

        if (isEditing) {
          return (
            <div key={h.id} className="glass rounded-xl p-2.5 space-y-1.5">
              <div className="flex gap-1.5 items-center">
                <Input value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} className="bg-secondary border-border w-12 text-center text-base h-8" maxLength={4} />
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary border-border flex-1 h-8 text-sm" />
              </div>
              <div className="flex gap-1.5 items-center">
                <Input value={editOutcomeEmoji} onChange={(e) => setEditOutcomeEmoji(e.target.value)} className="bg-secondary border-border w-12 text-center text-base h-8" maxLength={4} placeholder="🧠" />
                <Input value={editOutcome} onChange={(e) => setEditOutcome(e.target.value)} className="bg-secondary border-border flex-1 h-8 text-sm" placeholder="Outcome" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground p-1"><X className="h-3.5 w-3.5" /></button>
                <button onClick={saveEdit} className="text-primary hover:text-primary/80 p-1"><Check className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        }

        return (
          <div key={h.id} className={`glass rounded-xl p-3 flex items-center gap-2.5 transition-all ${checked ? "border-primary/40" : ""}`}>
            <span className="text-lg">{h.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{h.name}</p>
              {h.outcome_name && (
                <p className="text-[11px] text-muted-foreground">{h.outcome_emoji} {h.outcome_name}</p>
              )}
            </div>
            <Switch checked={checked} onCheckedChange={() => onToggle(h.id)} disabled={locked} className="data-[state=checked]:bg-primary scale-90" />
            {!locked && (
              <>
                <button onClick={() => startEdit(h)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteHabit.mutate(h.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
