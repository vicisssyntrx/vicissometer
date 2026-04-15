import { useState } from "react";
import { Save, RotateCcw, ListPlus } from "lucide-react";
import HabitCreation from "./HabitCreation";
import HabitEditList from "./HabitEditList";

interface Props {
  onSave: () => Promise<boolean | undefined>;
  onReset: () => void;
  disabled: boolean;
  hasHabits: boolean;
}

export default function BottomActionBar({ onSave, onReset, disabled, hasHabits }: Props) {
  const [saving, setSaving] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await onSave();
    setSaving(false);
    if (result) {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1500);
    }
  };

  return (
    <>
      {/* Manage Habits Sheet */}
      {showManage && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowManage(false)}
          />
          <div className="relative glass-strong rounded-t-2xl p-4 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-foreground">Manage Habits</h3>
              <button
                onClick={() => setShowManage(false)}
                className="text-muted-foreground hover:text-foreground text-2xl leading-none px-2"
              >
                ×
              </button>
            </div>
            <HabitCreation />
            <HabitEditList />
          </div>
        </div>
      )}

      {/* Action bar (inline; placed by parent) */}
      <div className="glass-strong border border-white/10 rounded-2xl px-3 py-3">
        <div className="flex items-center gap-2">
          {/* Add/Edit Habits */}
          <button
            onClick={() => setShowManage(true)}
            className={`flex-none flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-all ${
              !hasHabits
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 border border-primary/60 min-w-[100px] animate-pulse-subtle"
                : "glass text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <ListPlus className="h-5 w-5" />
            <span className="text-[10px] leading-tight font-medium">
              {!hasHabits ? "Add Habits" : "Habits"}
            </span>
          </button>

          {/* Save Progress — primary, takes most space */}
          <button
            onClick={handleSave}
            disabled={disabled || saving}
            className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              pulsing ? "animate-red-pulse" : ""
            }`}
          >
            <Save className="h-5 w-5" />
            {saving ? "Saving…" : "Save Progress"}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            disabled={saving}
            className="flex-none flex flex-col items-center justify-center gap-0.5 glass rounded-xl px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="text-[10px] leading-tight font-medium">Reset</span>
          </button>
        </div>
      </div>
    </>
  );
}
