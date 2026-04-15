import { useUserStats } from "@/hooks/useUserStats";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import StreakWindow from "./StreakWindow";

const SHOP_OPTIONS = [
  { shields: 1, cost: 50 },
  { shields: 2, cost: 100 },
  { shields: 3, cost: 150 },
];

interface Props { onClose: () => void; }

export default function ShieldShop({ onClose }: Props) {
  const { data: stats } = useUserStats();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showStreak, setShowStreak] = useState(false);

  const buy = async (shields: number, cost: number) => {
    if (!stats || !user) return;
    if (stats.coins < cost) {
      toast.error("Not enough coins!");
      return;
    }
    const { error } = await supabase.from("user_stats").update({
      coins: stats.coins - cost,
      shields: stats.shields + shields,
    }).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success(`Bought ${shields} shield${shields > 1 ? "s" : ""}!`);
  };

  const addTestCoins = async () => {
    if (!user) return;
    const { data: current, error: loadError } = await supabase
      .from("user_stats")
      .select("coins, streak, shields, power_ups, current_growth, start_date")
      .eq("user_id", user.id)
      .maybeSingle();
    if (loadError) {
      toast.error(loadError.message);
      return;
    }

    if (current) {
      const { error } = await supabase
        .from("user_stats")
        .update({ coins: (current.coins ?? 0) + 100 })
        .eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_stats")
        .insert({
          user_id: user.id,
          coins: 100,
          streak: 0,
          shields: 0,
          power_ups: 0,
          current_growth: 1,
        });
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success("Added 100 coins for testing");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">🛡️ Shield Shop</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-foreground">🪙 {stats?.coins || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Your coins</p>
          <p className="text-lg font-semibold text-foreground mt-2">🛡️ {stats?.shields || 0} owned</p>
        </div>
        <div className="space-y-3">
          {SHOP_OPTIONS.map((opt) => {
            const canAfford = (stats?.coins || 0) >= opt.cost;
            return (
              <Button
                key={opt.shields}
                onClick={() => buy(opt.shields, opt.cost)}
                disabled={!canAfford}
                variant={canAfford ? "default" : "secondary"}
                className={`w-full h-14 text-base ${canAfford ? "bg-primary text-primary-foreground" : ""}`}
              >
                {opt.shields} Shield{opt.shields > 1 ? "s" : ""} — {opt.cost} coins
              </Button>
            );
          })}
        </div>
        <Button type="button" variant="secondary" onClick={addTestCoins} className="w-full mt-3">
          Add 100 coins (testing)
        </Button>
        <Button type="button" variant="secondary" onClick={() => setShowStreak(true)} className="w-full mt-3">
          Open Streak Calendar
        </Button>
      </div>
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
    </div>
  );
}
