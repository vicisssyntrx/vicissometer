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

  if (isLoading) return <div className="glass rounded-2xl p-6 text-center text-muted-foreground">Loading habits...</div>;
  if (!habits?.length) return <div className="glass rounded-2xl p-6 text-center text-muted-foreground">No habits yet. Create one above!</div>;

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
      id: editingId,
      name: editName.trim(),
      emoji: editEmoji || "✅",
      outcome_name: editOutcome.trim() || null,
      outcome_emoji: editOutcomeEmoji || null,
    }, {
      onSuccess: () => { setEditingId(null); toast.success("Updated!"); },
    });
  };

  return (
    <div className="space-y-2">
      {habits.map((h) => {
        const checked = completedIds.has(h.id);
        const isEditing = editingId === h.id;

        if (isEditing) {
          return (
            <div key={h.id} className="glass rounded-xl p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <Input value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} className="bg-secondary border-border w-14 text-center text-lg" maxLength={4} />
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary border-border flex-1" />
              </div>
              <div className="flex gap-2 items-center">
                <Input value={editOutcomeEmoji} onChange={(e) => setEditOutcomeEmoji(e.target.value)} className="bg-secondary border-border w-14 text-center text-lg" maxLength={4} placeholder="🧠" />
                <Input value={editOutcome} onChange={(e) => setEditOutcome(e.target.value)} className="bg-secondary border-border flex-1" placeholder="Outcome" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground p-1"><X className="h-4 w-4" /></button>
                <button onClick={saveEdit} className="text-primary hover:text-primary/80 p-1"><Check className="h-4 w-4" /></button>
              </div>
            </div>
          );
        }

        return (
          <div key={h.id} className={`glass rounded-xl p-4 flex items-center gap-3 transition-all ${checked ? "border-primary/40" : ""}`}>
            <span className="text-xl">{h.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{h.name}</p>
              {h.outcome_name && (
                <p className="text-xs text-muted-foreground">{h.outcome_emoji} {h.outcome_name}</p>
              )}
            </div>
            <Switch checked={checked} onCheckedChange={() => onToggle(h.id)} disabled={locked} className="data-[state=checked]:bg-primary" />
            {!locked && (
              <>
                <button onClick={() => startEdit(h)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deleteHabit.mutate(h.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
