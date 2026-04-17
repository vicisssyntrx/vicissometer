import { useState, useRef } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Props { onClose: () => void; }

interface ParsedRow { date: string; completed: boolean; }
type XlsxRow = (string | number | null | undefined)[];

export default function CsvImport({ onClose }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const parseCSV = (text: string): { rows: ParsedRow[]; errs: string[] } => {
    const normalized = text.trim();
    if (!normalized) return { rows: [], errs: ["File is empty"] };
    const lines = normalized.split(/\r?\n/).slice(1);
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
    return { rows, errs };
  };

  const parseXLSX = (data: ArrayBuffer): { rows: ParsedRow[]; errs: string[] } => {
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<XlsxRow>(sheet, { header: 1 });
    const rows: ParsedRow[] = [];
    const errs: string[] = [];
    const seen = new Set<string>();

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 2) { errs.push(`Row ${i + 1}: invalid format`); continue; }

      let dateStr = "";
      const rawDate = row[0];
      if (typeof rawDate === "number") {
        // Excel serial date number
        const d = XLSX.SSF.parse_date_code(rawDate);
        dateStr = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
      } else if (typeof rawDate === "string") {
        dateStr = rawDate.trim();
      }

      const val = String(row[1]).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { errs.push(`Row ${i + 1}: invalid date "${rawDate}"`); continue; }
      if (val !== "0" && val !== "1") { errs.push(`Row ${i + 1}: value must be 0 or 1`); continue; }
      if (seen.has(dateStr)) { errs.push(`Row ${i + 1}: duplicate date "${dateStr}"`); continue; }
      if (new Date(dateStr) > new Date()) { errs.push(`Row ${i + 1}: future date "${dateStr}"`); continue; }
      seen.add(dateStr);
      rows.push({ date: dateStr, completed: val === "1" });
    }
    return { rows, errs };
  };

  const parseFile = (file: File) => {
    setPreview(null);
    setErrors([]);
    const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as ArrayBuffer;
        const { rows, errs } = parseXLSX(data);
        rows.sort((a, b) => a.date.localeCompare(b.date));
        setPreview(rows);
        setErrors(errs);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { rows, errs } = parseCSV(text);
        rows.sort((a, b) => a.date.localeCompare(b.date));
        setPreview(rows);
        setErrors(errs);
      };
      reader.readAsText(file);
    }
  };

  const doImport = async () => {
    if (!preview || !user) return;
    setImporting(true);

    // 1. First, dump the raw parsed CSV rows into daily_logs
    const skeletonLogsBase = preview.map((row) => ({
      user_id: user.id,
      date: row.date,
      completed_habits: [] as string[],
      completed_count: row.completed ? 1 : 0,
      total_count: 1,
      shield_used: false,
      streak_after: 0,
      growth_before: 1.0,
      growth_after: 1.0,
      locked: true,
    }));

    const { error: insertErr } = await supabase.from("daily_logs").upsert(skeletonLogsBase, { onConflict: "user_id,date" });
    if (insertErr) {
      toast.error("Failed to import CSV logs: " + insertErr.message);
      setImporting(false);
      return;
    }

    // 2. Download the ENTIRE universal master history of all logs and dynamically regenerate exact compounding stats.
    const { data: allLogs, error: fetchErr } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (fetchErr || !allLogs) {
      toast.error("Failed to sync historical mathematics.");
      setImporting(false);
      return;
    }

    let runningGrowth = 1.0;
    let runningStreak = 0;
    const finalUpdatePayloads = [];

    // Rigorously recount every single day from the dawn of the timeline.
    for (const log of allLogs) {
      const prevGrowth = runningGrowth;
      let dayWasCompletedOrShielded = false;

      if (log.completed_count !== null && log.total_count !== null && log.total_count > 0 && log.completed_count === log.total_count) {
        runningGrowth *= 1.01;
        runningStreak += 1;
        dayWasCompletedOrShielded = true;
      } else if (log.shield_used) {
        dayWasCompletedOrShielded = true;
      }

      if (!dayWasCompletedOrShielded) {
        runningStreak = 0;
      }

      finalUpdatePayloads.push({
        ...log,
        growth_before: prevGrowth,
        growth_after: runningGrowth,
        streak_after: runningStreak
      });
    }

    // Push the corrected mathematical history strictly back to the DB to fix any chronological paradoxes.
    await supabase.from("daily_logs").upsert(finalUpdatePayloads, { onConflict: "user_id,date" });

    // 3. Atomically overwrite User Stats with the final pristine numbers.
    const { error: statsErr } = await supabase
      .from("user_stats")
      .update({
        current_growth: runningGrowth,
        streak: runningStreak,
      })
      .eq("user_id", user.id);

    if (statsErr) {
      toast.error("Failed final sync line: " + statsErr.message);
      setImporting(false);
      return;
    }

    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    qc.invalidateQueries({ queryKey: ["daily_log_today"] });
    toast.success(`Imported ${preview.length} days!`);
    setImporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">📤 Import History</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Upload a <code className="text-primary">CSV</code> or <code className="text-primary">XLSX</code> with format: <code className="text-primary">date, completed</code> (1 = done, 0 = missed). No coins or shields are awarded from imports.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
        />
        <Button onClick={() => fileRef.current?.click()} variant="secondary" className="w-full mb-4">
          <Upload className="h-4 w-4 mr-2" /> Select CSV or XLSX File
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
            <Button onClick={doImport} disabled={importing || preview.length === 0} className="w-full bg-primary text-primary-foreground">
              {importing ? "Importing..." : `Import ${preview.length} Days`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
