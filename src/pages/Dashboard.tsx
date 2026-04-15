import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";
import LightLeakBackground from "@/components/LightLeakBackground";
import Navbar from "@/components/Navbar";
import Greeting from "@/components/Greeting";
import HabitList from "@/components/HabitList";
import OutcomeCards from "@/components/OutcomeCards";
import GrowthGraph from "@/components/GrowthGraph";
import JourneyInsights from "@/components/JourneyInsights";
import BottomActionBar from "@/components/BottomActionBar";
import MobileBoostCards from "@/components/MobileBoostCards";
import { useHabits } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useUserStats";
import { useTodayLog } from "@/hooks/useDailyLogs";
import { useSaveProgress } from "@/hooks/useSaveProgress";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: habits } = useHabits();
  const { data: stats, isLoading: statsLoading, error: statsError } = useUserStats();
  const { data: todayLog, isLoading: todayLogLoading } = useTodayLog();
  const { saveProgress } = useSaveProgress();

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  // Seed local checkbox state from today's log unless user has started editing.
  useEffect(() => {
    if (hasLocalEdits) return;
    if (todayLog?.completed_habits) setCompletedIds(new Set(todayLog.completed_habits));
    else if (todayLog === null) setCompletedIds(new Set());
  }, [todayLog, hasLocalEdits]);

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
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasLocalEdits(true);
  };

  const handleSave = async () => {
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
      <div className="relative z-10 flex flex-col min-h-screen pt-16 sm:pt-18 md:pt-20">
        <Navbar />

        <Greeting />

        <div className="flex-1 px-3 sm:px-5 pb-4 md:pb-6">
          <div className="mx-auto w-full max-w-[1060px] md:grid md:grid-cols-2 md:gap-4">
            {/* Mobile flow */}
            <div className="space-y-3 md:hidden">
              <HabitList
                completedIds={completedIds}
                onToggle={toggleHabit}
                viewOnly={false}
              />
              <div className="dashboard-rise rise-delay-1">
                <BottomActionBar
                  onSave={handleSave}
                  onReset={handleReset}
                  disabled={!habits?.length || statsLoading || todayLogLoading || !!statsError}
                  hasHabits={!!habits?.length}
                />
              </div>
              <div className="dashboard-rise rise-delay-2">
                <GrowthGraph />
              </div>
              <div className="dashboard-rise rise-delay-3">
                <OutcomeCards />
              </div>
              <div className="dashboard-rise rise-delay-4">
                <JourneyInsights />
              </div>
              <div className="dashboard-rise rise-delay-5">
                <MobileBoostCards />
              </div>
            </div>

            {/* Desktop left column */}
            <div className="hidden md:block space-y-2">
              <div className="dashboard-rise rise-delay-1">
                <HabitList
                  completedIds={completedIds}
                  onToggle={toggleHabit}
                  viewOnly={false}
                />
              </div>
              <div className="dashboard-rise rise-delay-2">
                <BottomActionBar
                  onSave={handleSave}
                  onReset={handleReset}
                  disabled={!habits?.length || statsLoading || todayLogLoading || !!statsError}
                  hasHabits={!!habits?.length}
                />
              </div>
              <div className="dashboard-rise rise-delay-3">
                <OutcomeCards />
              </div>
            </div>

            {/* Desktop right column */}
            <div className="hidden md:block space-y-2">
              <div className="dashboard-rise rise-delay-2">
                <GrowthGraph />
              </div>
              <div className="dashboard-rise rise-delay-3">
                <JourneyInsights />
              </div>
              <div className="dashboard-rise rise-delay-4">
                <MobileBoostCards />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
