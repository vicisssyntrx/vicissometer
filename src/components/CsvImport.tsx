import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props { onClose: () => void; }

interface ParsedRow { date: string; completed: boolean; }

export default function CsvImport({ onClose }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split("\n").slice(1); // skip header
      const rows: ParsedRow[] = [];
      const errs: string[] = [];
      const seen = new Set<string>();

      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].trim().split(",");
        if (parts.length < 2) { errs.push(`Row ${i + 2}: invalid format`); continue; }
        const date = parts[0].trim();
        const val = parts[1].trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { errs.push(`Row ${i + 2}: invalid date "${date}"`); continue; }
        if (val !== "0" && val !== "1") { errs.push(`Row ${i + 2}: value must be 0 or 1`); continue; }
        if (seen.has(date)) { errs.push(`Row ${i + 2}: duplicate date "${date}"`); continue; }
        if (new Date(date) > new Date()) { errs.push(`Row ${i + 2}: future date "${date}"`); continue; }
        seen.add(date);
        rows.push({ date, completed: val === "1" });
      }

      setPreview(rows);
      setErrors(errs);
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (!preview || !user) return;
    setImporting(true);

    let growth = 1.0;
    let streak = 0;
    let coins = 0;

    const logsToInsert = preview.map((row) => {
      const prevGrowth = growth;
      if (row.completed) {
        growth *= 1.01;
        streak += 1;
        coins += 10;
      } else {
        streak = 0;
      }

      return {
        user_id: user.id,
        date: row.date,
        completed_habits: [] as string[],
        completed_count: row.completed ? 1 : 0,
        total_count: 1,
        shield_used: false,
        streak_after: streak,
        growth_before: prevGrowth,
        growth_after: growth,
        locked: true,
      };
    });

    const { error } = await supabase.from("daily_logs").upsert(logsToInsert, { onConflict: "user_id,date" });
    if (error) {
      toast.error("Import failed: " + error.message);
      setImporting(false);
      return;
    }

    // Update stats
    await supabase.from("user_stats").update({
      current_growth: growth,
      streak,
      coins,
    }).eq("user_id", user.id);

    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success(`Imported ${preview.length} days!`);
    setImporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">📤 Import History</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Upload a CSV with format: <code className="text-primary">date,completed</code> (1 = done, 0 = missed)
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
        />
        <Button onClick={() => fileRef.current?.click()} variant="secondary" className="w-full mb-4">
          <Upload className="h-4 w-4 mr-2" /> Select CSV File
        </Button>

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive max-h-32 overflow-y-auto">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        {preview && (
          <>
            <div className="glass rounded-xl p-3 mb-4 text-sm">
              <p className="text-foreground">📊 {preview.length} days total</p>
              <p className="text-muted-foreground">{preview.filter((r) => r.completed).length} completed, {preview.filter((r) => !r.completed).length} missed</p>
            </div>
            <Button onClick={doImport} disabled={importing} className="w-full bg-primary text-primary-foreground">
              {importing ? "Importing..." : `Import ${preview.length} Days`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
