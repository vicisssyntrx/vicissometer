import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import StreakWindow from "./StreakWindow";

interface Props { onClose: () => void; }

export default function PowerUpOverlay({ onClose }: Props) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const [showStreak, setShowStreak] = useState(false);

  const gaps = logs?.filter((l) => l.completed_count === 0 && !l.shield_used) || [];

  if (showStreak) {
    return <StreakWindow onClose={() => { setShowStreak(false); onClose(); }} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">⚡ Power-Ups</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats?.power_ups || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{gaps.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Gaps Found</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Use power-ups from the Streak Window to recover missed days and restore growth.
        </p>

        <Button onClick={() => setShowStreak(true)} className="w-full bg-primary text-primary-foreground">
          <Zap className="h-4 w-4 mr-2" /> Open Streak Window to Use
        </Button>
      </div>
    </div>
  );
}
