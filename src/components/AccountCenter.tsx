import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X, LogOut, Upload, Shield, Zap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ShieldShop from "./ShieldShop";
import PowerUpOverlay from "./PowerUpOverlay";
import CsvImport from "./CsvImport";

interface Props { onClose: () => void; }

export default function AccountCenter({ onClose }: Props) {
  const { user, signOut } = useAuth();
  const [showShields, setShowShields] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (showShields) return <ShieldShop onClose={() => setShowShields(false)} />;
  if (showPowerUps) return <PowerUpOverlay onClose={() => setShowPowerUps(false)} />;
  if (showImport) return <CsvImport onClose={() => setShowImport(false)} />;

  const initial = user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Account</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-2xl font-bold">
            {initial}
          </div>
          <div>
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setShowShields(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground"
          >
            <Shield className="h-5 w-5 text-primary" /> Shield Shop
          </button>
          <button
            onClick={() => setShowPowerUps(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground"
          >
            <Zap className="h-5 w-5 text-primary" /> Power-Up Recovery
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground"
          >
            <Upload className="h-5 w-5 text-primary" /> Import CSV
          </button>
          <hr className="border-border my-2" />
          <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
            <LogOut className="h-5 w-5 mr-3" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
