import { useUserStats } from "@/hooks/useUserStats";
import { useState } from "react";
import ShieldShop from "./ShieldShop";
import StreakWindow from "./StreakWindow";

const statItems = [
  { key: "coins", icon: "🪙" },
  { key: "streak", icon: "🔥" },
  { key: "shields", icon: "🛡️" },
  { key: "power_ups", icon: "⚡" },
] as const;

export default function StatsBar() {
  const { data: stats } = useUserStats();
  const [showShields, setShowShields] = useState(false);
  const [showStreak, setShowStreak] = useState(false);

  const handleClick = (key: string) => {
    if (key === "shields") setShowShields(true);
    if (key === "streak") setShowStreak(true);
    if (key === "power_ups") setShowStreak(true);
  };

  return (
    <>
      <div className="flex items-center gap-1 md:gap-2 px-1 md:px-4 py-1 md:py-1.5 overflow-x-auto">
        {statItems.map((s) => (
          <button
            key={s.key}
            onClick={() => handleClick(s.key)}
            className="glass rounded-md md:rounded-lg px-2 md:px-3 py-1 md:py-1.5 flex items-center gap-1 hover:bg-secondary/60 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <span className="text-xs md:text-sm">{s.icon}</span>
            <span className="text-xs md:text-base font-bold text-foreground">
              {stats ? stats[s.key] : 0}
            </span>
          </button>
        ))}
      </div>
      {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
    </>
  );
}
