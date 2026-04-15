import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";
import LightLeakBackground from "@/components/LightLeakBackground";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import Greeting from "@/components/Greeting";
import HabitCreation from "@/components/HabitCreation";
import HabitList from "@/components/HabitList";
import SaveProgressButton from "@/components/SaveProgressButton";
import OutcomeCards from "@/components/OutcomeCards";
import GrowthGraph from "@/components/GrowthGraph";
import Heatmap from "@/components/Heatmap";
import JourneyInsights from "@/components/JourneyInsights";
import { useHabits } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useUserStats";
import { useTodayLog } from "@/hooks/useDailyLogs";
import { useSaveProgress } from "@/hooks/useSaveProgress";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: habits } = useHabits();
  const { data: stats } = useUserStats();
  const { data: todayLog } = useTodayLog();
  const { saveProgress } = useSaveProgress();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const locked = !!todayLog?.locked;

  useEffect(() => {
    if (todayLog?.completed_habits) {
      setCompletedIds(new Set(todayLog.completed_habits as string[]));
    }
  }, [todayLog]);

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
      if (evening > now && !todayLog?.locked) {
        const timeout = evening.getTime() - now.getTime();
        const timer = setTimeout(() => {
          new Notification("Vicissometer", { body: "Don't forget to track and save your habits today!", icon: "/icon-192.png" });
        }, timeout);
        return () => clearTimeout(timer);
      }
    }
  }, [todayLog]);

  const toggleHabit = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!habits || !stats) return;
    return saveProgress(habits, completedIds, stats);
  };

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="relative min-h-screen bg-background">
      <LightLeakBackground />
      <ParticleBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        {/* Desktop stats below navbar */}
        <div className="hidden md:block">
          <StatsBar />
        </div>
        <Greeting />

        <div className="flex-1 px-2 md:px-8 pb-4">
          <div className="grid md:grid-cols-2 gap-3 max-w-6xl mx-auto">
            {/* Left column */}
            <div className="space-y-2">
              <HabitCreation />
              <HabitList completedIds={completedIds} onToggle={toggleHabit} locked={locked} />
              <SaveProgressButton onSave={handleSave} locked={locked} disabled={!habits?.length} />
              <OutcomeCards />
            </div>

            {/* Right column */}
            <div className="space-y-2">
              <GrowthGraph />
              <Heatmap />
              <JourneyInsights />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
