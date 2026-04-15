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
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
        <span className="flex items-center gap-2 text-foreground font-medium text-base">
          <Plus className="h-5 w-5 text-primary" /> Add Habit
        </span>
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-2 items-center">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" className="bg-secondary border-border w-16 text-center text-xl h-11" maxLength={4} />
            <Input placeholder="Habit name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border flex-1 h-11 text-base" />
          </div>
          <div className="flex gap-2 items-center">
            <Input value={outcomeEmoji} onChange={(e) => setOutcomeEmoji(e.target.value)} placeholder="Emoji" className="bg-secondary border-border w-16 text-center text-xl h-11" maxLength={4} />
            <Input placeholder="Outcome (e.g. Thinker)" value={outcomeName} onChange={(e) => setOutcomeName(e.target.value)} className="bg-secondary border-border flex-1 h-11 text-base" />
          </div>
          <Button onClick={handleCreate} disabled={createHabit.isPending} className="w-full bg-primary text-primary-foreground h-11 text-base">
            {createHabit.isPending ? "Creating..." : "Create Habit"}
          </Button>
        </div>
      )}
    </div>
  );
}
