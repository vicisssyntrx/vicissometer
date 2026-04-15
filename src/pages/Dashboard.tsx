import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";
import LightLeakBackground from "@/components/LightLeakBackground";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import Greeting from "@/components/Greeting";
import HabitList from "@/components/HabitList";
import OutcomeCards from "@/components/OutcomeCards";
import GrowthGraph from "@/components/GrowthGraph";
import JourneyInsights from "@/components/JourneyInsights";
import DateSelector from "@/components/DateSelector";
import BottomActionBar from "@/components/BottomActionBar";
import MobileBoostCards from "@/components/MobileBoostCards";
import { useHabits } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useUserStats";
import { useTodayLog, useLogForDate } from "@/hooks/useDailyLogs";
import { useSaveProgress } from "@/hooks/useSaveProgress";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const { data: habits } = useHabits();
  const { data: stats, isLoading: statsLoading, error: statsError } = useUserStats();
  const { data: todayLog, isLoading: todayLogLoading } = useTodayLog();
  const { saveProgress } = useSaveProgress();

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;
  const [editMode, setEditMode] = useState(false);

  // For past dates, fetch that day's log
  const { data: pastLog } = useLogForDate(selectedDate);

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  // When date changes, default to view mode for past days
  useEffect(() => {
    if (!isToday) setEditMode(false);
    setHasLocalEdits(false);
  }, [selectedDate, isToday]);

  // Seed local checkbox state from whichever log matches selectedDate, unless user has started editing.
  useEffect(() => {
    if (hasLocalEdits) return;
    const log = isToday ? todayLog : pastLog;
    if (log?.completed_habits) setCompletedIds(new Set(log.completed_habits));
    else if (log === null) setCompletedIds(new Set());
  }, [todayLog, pastLog, isToday, hasLocalEdits]);

  const canEdit = isToday || editMode;

  // Request notification permission on first load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Schedule browser notifications for habit reminders
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      const now = new Date();
      const evening = new Date();
      evening.setHours(20, 0, 0, 0);
      if (evening > now) {
        const timeout = evening.getTime() - now.getTime();
        const timer = setTimeout(() => {
          new Notification("Vicissometer", { body: "Don't forget to track and save your habits today!", icon: "/icon-192.png" });
        }, timeout);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const toggleHabit = (id: string) => {
    if (!canEdit) return;
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasLocalEdits(true);
  };

  const handleSave = async () => {
    if (!canEdit) return;
    if (todayLogLoading) {
      toast.info("Please wait, checking today's status...");
      return;
    }
    if (!habits || !stats) {
      toast.error("Stats are still loading. Try again.");
      return;
    }
    return saveProgress(habits, completedIds, stats, selectedDate);
  };

  const handleReset = () => {
    if (!canEdit) return;
    setCompletedIds(new Set());
    setHasLocalEdits(true);
    toast.success("Today's progress cleared");
  };

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="relative min-h-screen bg-background">
      <LightLeakBackground />
      <ParticleBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Stats bar — minimal single row */}
        <div className="px-3 sm:px-4 md:px-8 pt-2 pb-1">
          <StatsBar />
        </div>

        <Greeting />

        {/* Date selector */}
        <div className="px-3 sm:px-4 md:px-8 pb-1">
          <DateSelector
            date={selectedDate}
            onDateChange={setSelectedDate}
            editable={editMode}
            onEditableChange={setEditMode}
          />
        </div>

        <div className="flex-1 px-2 sm:px-4 md:px-8 pb-4 md:pb-6">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {/* Left column */}
            <div className="space-y-3 md:space-y-2">
              {!isToday && (
                <div className="glass rounded-xl px-3 py-2 text-center text-xs text-muted-foreground">
                  {editMode ? `Editing ${selectedDate}` : `Viewing ${selectedDate} — read only`}
                </div>
              )}
              <HabitList
                completedIds={completedIds}
                onToggle={toggleHabit}
                viewOnly={!canEdit}
              />
              <BottomActionBar
                onSave={handleSave}
                onReset={handleReset}
                disabled={!habits?.length || statsLoading || todayLogLoading || !!statsError || !canEdit}
                hasHabits={!!habits?.length}
              />
              <OutcomeCards />
            </div>

            {/* Right column */}
            <div className="space-y-3 md:space-y-2">
              <GrowthGraph />
              <MobileBoostCards />
              <JourneyInsights />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
