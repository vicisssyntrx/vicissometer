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
import Heatmap from "@/components/Heatmap";
import JourneyInsights from "@/components/JourneyInsights";
import DateSelector from "@/components/DateSelector";
import BottomActionBar from "@/components/BottomActionBar";
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

  // For past dates, fetch that day's log
  const { data: pastLog } = useLogForDate(selectedDate);

  // completedIds: on today use local state seeded from todayLog; on past dates use the log directly
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isToday && todayLog?.completed_habits) {
      setCompletedIds(new Set(todayLog.completed_habits));
    } else if (isToday && todayLog === null) {
      setCompletedIds(new Set());
    }
  }, [todayLog, isToday]);

  // When date changes to a past date, load that day's completions (read-only)
  const pastCompletedIds = !isToday && pastLog
    ? new Set<string>(pastLog.completed_habits)
    : new Set<string>();

  const displayedIds = isToday ? completedIds : pastCompletedIds;

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
    if (!isToday) return; // past dates are read-only
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!isToday) {
      toast.error("Can only save progress for today");
      return;
    }
    if (todayLogLoading) {
      toast.info("Please wait, checking today's status...");
      return;
    }
    if (!habits || !stats) {
      toast.error("Stats are still loading. Try again.");
      return;
    }
    return saveProgress(habits, completedIds, stats);
  };

  const handleReset = () => {
    if (!isToday) {
      toast.error("Can only reset today's progress");
      return;
    }
    setCompletedIds(new Set());
    toast.success("Today's progress cleared");
  };

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="relative min-h-screen bg-background">
      <LightLeakBackground />
      <ParticleBackground />
      <div className="relative z-10 flex flex-col min-h-screen pb-24">
        <Navbar />

        {/* Stats bar — minimal single row */}
        <div className="px-3 sm:px-4 md:px-8 pt-2 pb-1">
          <StatsBar />
        </div>

        <Greeting />

        {/* Date selector */}
        <div className="px-3 sm:px-4 md:px-8 pb-1">
          <DateSelector date={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <div className="flex-1 px-2 sm:px-4 md:px-8 pb-4 md:pb-6">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {/* Left column */}
            <div className="space-y-3 md:space-y-2">
              {!isToday && (
                <div className="glass rounded-xl px-3 py-2 text-center text-xs text-muted-foreground">
                  Viewing {selectedDate} — read only
                </div>
              )}
              <HabitList
                completedIds={displayedIds}
                onToggle={toggleHabit}
                viewOnly={!isToday}
              />
              <OutcomeCards />
            </div>

            {/* Right column */}
            <div className="space-y-3 md:space-y-2">
              <GrowthGraph />
              <Heatmap />
              <JourneyInsights />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar — only wire save/reset to today */}
      <BottomActionBar
        onSave={handleSave}
        onReset={handleReset}
        disabled={!habits?.length || statsLoading || todayLogLoading || !!statsError}
        hasHabits={!!habits?.length}
      />
    </div>
  );
}
