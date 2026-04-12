import { useUserStats } from "@/hooks/useUserStats";
import { useState } from "react";
import ShieldShop from "./ShieldShop";
import PowerUpOverlay from "./PowerUpOverlay";

const statItems = [
  { key: "coins", icon: "🪙", label: "Coins" },
  { key: "streak", icon: "🔥", label: "Streak" },
  { key: "shields", icon: "🛡️", label: "Shields" },
  { key: "power_ups", icon: "⚡", label: "Power-ups" },
] as const;

export default function StatsBar() {
  const { data: stats } = useUserStats();
  const [showShields, setShowShields] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);

  const handleClick = (key: string) => {
    if (key === "shields") setShowShields(true);
    if (key === "power_ups") setShowPowerUps(true);
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2 md:gap-3 px-4 md:px-8 py-3">
        {statItems.map((s) => (
          <button
            key={s.key}
            onClick={() => handleClick(s.key)}
            className="glass rounded-xl p-3 flex flex-col items-center gap-1 hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            <span className="text-lg">{s.icon}</span>
            <span className="text-xl md:text-2xl font-bold text-foreground">
              {stats ? stats[s.key] : 0}
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span>
          </button>
        ))}
      </div>
      {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
      {showPowerUps && <PowerUpOverlay onClose={() => setShowPowerUps(false)} />}
    </>
  );
}
