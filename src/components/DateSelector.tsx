import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  date: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
}

function formatDisplay(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function DateSelector({ date, onDateChange }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;

  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <button
        onClick={() => onDateChange(addDays(date, -1))}
        className="flex items-center justify-center w-8 h-8 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${isToday ? "text-primary bg-primary/10 border border-primary/30" : "text-foreground glass"}`}>
          {formatDisplay(date)}
        </span>
        {!isToday && (
          <button
            onClick={() => onDateChange(today)}
            className="text-xs text-primary hover:text-primary/80 underline underline-offset-2"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={() => onDateChange(addDays(date, 1))}
        disabled={isToday}
        className="flex items-center justify-center w-8 h-8 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
