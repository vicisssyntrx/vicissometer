import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useState } from "react";

interface Props {
  onSave: () => Promise<boolean | undefined>;
  locked: boolean;
  disabled: boolean;
}

export default function SaveProgressButton({ onSave, locked, disabled }: Props) {
  const [saving, setSaving] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const handle = async () => {
    setSaving(true);
    const result = await onSave();
    setSaving(false);
    if (result) {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1500);
    }
  };

  if (locked) {
    return (
      <div className="glass rounded-xl p-3 text-center text-muted-foreground text-sm">
        ✅ Today's progress is saved and locked
      </div>
    );
  }

  return (
    <Button
      onClick={handle}
      disabled={disabled || saving}
      className={`w-full h-11 md:h-14 text-sm md:text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all ${pulsing ? "animate-red-pulse" : ""}`}
    >
      <Save className="h-4 w-4 mr-2" />
      {saving ? "Saving..." : "Save Progress"}
    </Button>
  );
}
