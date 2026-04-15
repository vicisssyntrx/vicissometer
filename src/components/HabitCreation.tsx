import { useState } from "react";
import { useCreateHabit } from "@/hooks/useHabits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function HabitCreation() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [outcomeName, setOutcomeName] = useState("");
  const [outcomeEmoji, setOutcomeEmoji] = useState("🧠");
  const createHabit = useCreateHabit();

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Habit name is required"); return; }
    createHabit.mutate(
      { name: name.trim(), emoji: emoji || "✅", outcome_name: outcomeName.trim() || undefined, outcome_emoji: outcomeEmoji || undefined },
      { onSuccess: () => { setName(""); setOutcomeName(""); setEmoji("✅"); setOutcomeEmoji("🧠"); toast.success("Habit created!"); } }
    );
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors">
        <span className="flex items-center gap-2 text-foreground font-medium text-sm">
          <Plus className="h-4 w-4 text-primary" /> Add Habit
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex gap-1.5 items-center">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" className="bg-secondary border-border w-14 text-center text-lg h-9" maxLength={4} />
            <Input placeholder="Habit name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border flex-1 h-9 text-sm" />
          </div>
          <div className="flex gap-1.5 items-center">
            <Input value={outcomeEmoji} onChange={(e) => setOutcomeEmoji(e.target.value)} placeholder="Emoji" className="bg-secondary border-border w-14 text-center text-lg h-9" maxLength={4} />
            <Input placeholder="Outcome (e.g. Thinker)" value={outcomeName} onChange={(e) => setOutcomeName(e.target.value)} className="bg-secondary border-border flex-1 h-9 text-sm" />
          </div>
          <Button onClick={handleCreate} disabled={createHabit.isPending} className="w-full bg-primary text-primary-foreground h-9 text-sm">
            {createHabit.isPending ? "Creating..." : "Create Habit"}
          </Button>
        </div>
      )}
    </div>
  );
}
