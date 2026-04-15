import { useDailyLogs } from "@/hooks/useDailyLogs";
import { X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { parseISO } from "date-fns";
import { computeCurrentStreak } from "@/lib/streak";

interface Props { onClose: () => void; }

export default function StreakWindow({ onClose }: Props) {
  const { data: logs } = useDailyLogs();
  const completedDays = logs?.filter((l) => l.completed_count === l.total_count && l.total_count > 0).map((l) => parseISO(l.date)) || [];
  const partialDays = logs?.filter((l) => l.completed_count > 0 && l.completed_count < l.total_count).map((l) => parseISO(l.date)) || [];
  const shieldedDays = logs?.filter((l) => l.shield_used).map((l) => parseISO(l.date)) || [];
  const missedDays = logs?.filter((l) => l.completed_count === 0 && !l.shield_used).map((l) => parseISO(l.date)) || [];
  const currentStreak = computeCurrentStreak(logs);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="rounded-2xl p-3 sm:p-4 w-full max-w-[95vw] sm:max-w-lg max-h-[88vh] overflow-y-auto bg-background border border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">🔥 Streak Calendar</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Current streak: <span className="font-semibold text-foreground">{currentStreak}</span>
        </p>

        <div className="rounded-xl border border-border p-2 overflow-x-auto">
          <Calendar
            mode="single"
            selected={undefined}
            className="p-0 w-full"
            classNames={{
              months: "flex w-full flex-col",
              month: "w-full space-y-3",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              row: "flex w-full mt-2",
              head_cell: "w-full text-center text-muted-foreground text-sm",
              cell: "relative p-0 text-center w-full",
              day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 mx-auto",
            }}
            modifiers={{
              completed: completedDays,
              partial: partialDays,
              shielded: shieldedDays,
              gap: missedDays,
            }}
            modifiersClassNames={{
              completed: "bg-red-600 text-white hover:bg-red-600 focus:bg-red-600",
              partial: "bg-red-400/70 text-white hover:bg-red-400/70 focus:bg-red-400/70",
              shielded: "bg-blue-600 text-white hover:bg-blue-600 focus:bg-blue-600",
              gap: "bg-zinc-600 text-white hover:bg-zinc-600 focus:bg-zinc-600",
            }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-600" /> Completed</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-400/70" /> Partial</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-zinc-600" /> Gap</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-blue-600" /> Shielded</div>
        </div>
      </div>
    </div>
  );
}
