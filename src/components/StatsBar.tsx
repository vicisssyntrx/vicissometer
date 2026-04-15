import { useUserStats } from "@/hooks/useUserStats";
import { useState } from "react";
import ShieldShop from "./ShieldShop";
import StreakWindow from "./StreakWindow";
import PowerUpOverlay from "./PowerUpOverlay";
import { useIsMobile } from "@/hooks/use-mobile";

const statItems = [
  { key: "coins", icon: "🪙" },
  { key: "streak", icon: "🔥" },
  { key: "shields", icon: "🛡️" },
  { key: "power_ups", icon: "⚡" },
] as const;

export default function StatsBar() {
  const { data: stats } = useUserStats();
  const isMobile = useIsMobile();
  const [showShields, setShowShields] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);

  const visibleItems = isMobile ? statItems.filter((s) => s.key === "coins" || s.key === "streak") : statItems;

  const handleClick = (key: (typeof statItems)[number]["key"]) => {
    if (key === "shields") setShowShields(true);
    if (key === "streak") setShowStreak(true);
    if (key === "power_ups") setShowPowerUps(true);
  };

  return (
    <>
      <div className={`flex items-center gap-1.5 px-1 ${isMobile ? "justify-between" : "justify-center"}`}>
        {visibleItems.map((s) => (
          <button
            key={s.key}
            onClick={() => handleClick(s.key)}
            className="flex-1 max-w-[180px] glass rounded-lg flex items-center justify-center gap-1.5 py-1.5 hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            <span className="text-sm leading-none">{s.icon}</span>
            <span className="text-sm font-bold text-foreground leading-none">
              {stats ? stats[s.key] : 0}
            </span>
          </button>
        ))}
      </div>
      {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
      {showPowerUps && <PowerUpOverlay onClose={() => setShowPowerUps(false)} />}
    </>
  );
}
