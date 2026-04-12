import { useState } from "react";
import { useCreateHabit } from "@/hooks/useHabits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const EMOJI_OPTIONS = ["📖", "🏋️", "🧘", "💻", "🎨", "🎵", "🏃", "💤", "🥗", "💧", "✍️", "🧠"];

export default function HabitCreation() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [outcomeName, setOutcomeName] = useState("");
  const [outcomeEmoji, setOutcomeEmoji] = useState("🧠");
  const createHabit = useCreateHabit();

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Habit name is required");
      return;
    }
    createHabit.mutate(
      { name: name.trim(), emoji, outcome_name: outcomeName.trim() || undefined, outcome_emoji: outcomeEmoji || undefined },
      {
        onSuccess: () => {
          setName("");
          setOutcomeName("");
          toast.success("Habit created!");
        },
      }
    );
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-foreground font-medium">
          <Plus className="h-4 w-4 text-primary" /> Add Habit
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${emoji === e ? "bg-primary/30 ring-1 ring-primary" : "hover:bg-secondary"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input
            placeholder="Habit name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-secondary border-border"
          />
          <div className="flex gap-2">
            <Input
              placeholder="Outcome (e.g. Thinker)"
              value={outcomeName}
              onChange={(e) => setOutcomeName(e.target.value)}
              className="bg-secondary border-border flex-1"
            />
            <div className="flex gap-1">
              {["🧠", "💪", "🎯", "❤️"].map((e) => (
                <button
                  key={e}
                  onClick={() => setOutcomeEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center ${outcomeEmoji === e ? "bg-primary/30 ring-1 ring-primary" : "hover:bg-secondary"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} disabled={createHabit.isPending} className="w-full bg-primary text-primary-foreground">
            {createHabit.isPending ? "Creating..." : "Create Habit"}
          </Button>
        </div>
      )}
    </div>
  );
}
