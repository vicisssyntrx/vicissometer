import { ChevronLeft, ChevronRight, Pencil, Eye, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Props {
  date: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  editable?: boolean;
  onEditableChange?: (editable: boolean) => void;
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

function parseDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toYmd(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DateSelector({ date, onDateChange, editable = false, onEditableChange }: Props) {
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

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`text-sm font-semibold px-3 py-1 rounded-lg inline-flex items-center gap-2 transition-colors ${
                isToday ? "text-primary bg-primary/10 border border-primary/30" : "text-foreground glass hover:bg-secondary/50"
              }`}
              aria-label="Pick a date"
            >
              <CalendarDays className="h-4 w-4 opacity-80" />
              {formatDisplay(date)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 glass-strong border-white/10">
            <Calendar
              mode="single"
              selected={parseDate(date)}
              onSelect={(d) => {
                if (!d) return;
                onDateChange(toYmd(d));
              }}
              disabled={(d) => d > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {!isToday && (
          <>
            <button
              type="button"
              onClick={() => onDateChange(today)}
              className="text-xs text-primary hover:text-primary/80 underline underline-offset-2"
            >
              Today
            </button>
            {onEditableChange && (
              <button
                type="button"
                onClick={() => onEditableChange(!editable)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
                  editable ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
                }`}
                aria-label={editable ? "Switch to view mode" : "Switch to edit mode"}
              >
                {editable ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {editable ? "View" : "Edit"}
              </button>
            )}
          </>
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
