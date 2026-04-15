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

  const handleClick = (key: (typeof statItems)[number]["key"]) => {
    if (key === "shields") setShowShields(true);
    if (key === "streak") setShowStreak(true);
    if (key === "power_ups") setShowStreak(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statItems.map((s) => (
          <button
            key={s.key}
            onClick={() => handleClick(s.key)}
            className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 hover:bg-secondary/60 transition-colors cursor-pointer min-h-14"
          >
            <span className="text-base">{s.icon}</span>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{s.label}</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{stats ? stats[s.key] : 0}</p>
            </div>
          </button>
        ))}
      </div>
      {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
    </>
  );
}
