import { useState } from "react";
import { useUserStats } from "@/hooks/useUserStats";
import ShieldShop from "./ShieldShop";
import StreakWindow from "./StreakWindow";

export default function MobileBoostCards() {
  const { data: stats } = useUserStats();
  const [showShields, setShowShields] = useState(false);
  const [showStreak, setShowStreak] = useState(false);

  return (
    <>
      <div className="md:hidden grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setShowShields(true)}
          className="glass rounded-2xl p-3 text-left hover:bg-secondary/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Shields</span>
            <span className="text-lg">🛡️</span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats?.shields ?? 0}</div>
        </button>

        <button
          type="button"
          onClick={() => setShowStreak(true)}
          className="glass rounded-2xl p-3 text-left hover:bg-secondary/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Power-Ups</span>
            <span className="text-lg">⚡</span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats?.power_ups ?? 0}</div>
        </button>
      </div>

      {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
    </>
  );
}

