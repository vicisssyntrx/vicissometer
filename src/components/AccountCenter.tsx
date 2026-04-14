import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, LogOut, Upload, Shield, Zap, Settings, RotateCcw, Bell, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ShieldShop from "./ShieldShop";
import PowerUpOverlay from "./PowerUpOverlay";
import CsvImport from "./CsvImport";

interface Props { onClose: () => void; }

export default function AccountCenter({ onClose }: Props) {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [showShields, setShowShields] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission === "granted" : false
  );
  const [resetting, setResetting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleUpdateProfile = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    if (error) { toast.error(error.message); return; }
    // Also update profiles table
    if (user) {
      await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    }
    toast.success("Profile updated!");
    setEditingProfile(false);
  };

  const handleToggleNotifications = async () => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setNotificationsEnabled(result === "granted");
        if (result === "granted") toast.success("Notifications enabled!");
        else toast.info("Notifications denied");
      } else if (Notification.permission === "granted") {
        setNotificationsEnabled(false);
        toast.info("Notifications muted in app (browser permission remains)");
      } else {
        toast.info("Please enable notifications in your browser settings");
      }
    }
  };

  const handleResetDefaults = async () => {
    if (!user) return;
    const confirmed = window.confirm("This will delete ALL your data (habits, history, stats) and start fresh. Are you sure?");
    if (!confirmed) return;
    setResetting(true);

    // Delete all daily logs
    await supabase.from("daily_logs").delete().eq("user_id", user.id);
    // Delete all habits
    await supabase.from("habits").delete().eq("user_id", user.id);
    // Reset stats
    await supabase.from("user_stats").update({
      coins: 0,
      streak: 0,
      shields: 0,
      power_ups: 0,
      current_growth: 1.0,
    }).eq("user_id", user.id);

    qc.invalidateQueries();
    toast.success("All data reset to defaults!");
    setResetting(false);
    onClose();
  };

  if (showShields) return <ShieldShop onClose={() => setShowShields(false)} />;
  if (showPowerUps) return <PowerUpOverlay onClose={() => setShowPowerUps(false)} />;
  if (showImport) return <CsvImport onClose={() => setShowImport(false)} />;

  const initial = user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";
  const currentDisplayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Account</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-2xl font-bold">
            {initial}
          </div>
          <div className="flex-1">
            {editingProfile ? (
              <div className="space-y-2">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary border-border" placeholder="Display Name" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateProfile} className="bg-primary text-primary-foreground text-xs">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)} className="text-xs">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold text-foreground">{currentDisplayName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <button onClick={() => { setDisplayName(currentDisplayName); setEditingProfile(true); }} className="text-xs text-primary hover:underline mt-1">
                  <User className="h-3 w-3 inline mr-1" />Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <button onClick={() => setShowShields(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground">
            <Shield className="h-5 w-5 text-primary" /> Shield Shop
          </button>
          <button onClick={() => setShowPowerUps(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground">
            <Zap className="h-5 w-5 text-primary" /> Power-Up Recovery
          </button>
          <button onClick={() => setShowImport(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground">
            <Upload className="h-5 w-5 text-primary" /> Import History
          </button>

          {/* Notifications toggle */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl text-foreground">
            <span className="flex items-center gap-3"><Bell className="h-5 w-5 text-primary" /> Notifications</span>
            <Switch checked={notificationsEnabled} onCheckedChange={handleToggleNotifications} className="data-[state=checked]:bg-primary" />
          </div>

          <hr className="border-border my-1" />

          <button onClick={handleResetDefaults} disabled={resetting} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive">
            <RotateCcw className="h-5 w-5" /> {resetting ? "Resetting..." : "Reset All Data"}
          </button>

          <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
            <LogOut className="h-5 w-5 mr-3" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
