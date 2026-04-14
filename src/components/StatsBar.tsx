import { useUserStats } from "@/hooks/useUserStats";
import { useState } from "react";
import ShieldShop from "./ShieldShop";
import StreakWindow from "./StreakWindow";

const statItems = [
  { key: "coins", icon: "🪙", label: "Coins" },
  { key: "streak", icon: "🔥", label: "Streak" },
  { key: "shields", icon: "🛡️", label: "Shields" },
  { key: "power_ups", icon: "⚡", label: "Power-ups" },
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
      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 overflow-x-auto">
        {statItems.map((s) => (
          <button
            key={s.key}
            onClick={() => handleClick(s.key)}
            className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-secondary/60 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <span className="text-sm">{s.icon}</span>
            <span className="text-sm md:text-base font-bold text-foreground">
              {stats ? stats[s.key] : 0}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider hidden md:inline">{s.label}</span>
          </button>
        ))}
      </div>
      {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
    </>
  );
}
