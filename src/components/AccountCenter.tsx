import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { X, LogOut, Upload, Shield, Zap, RotateCcw, Bell, User, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ShieldShop from "./ShieldShop";
import PowerUpOverlay from "./PowerUpOverlay";
import CsvImport from "./CsvImport";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { getInstallLabel, isMobileDevice, isRunningStandalone } from "@/lib/pwa";

interface Props { onClose: () => void; }

export default function AccountCenter({ onClose }: Props) {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [showShields, setShowShields] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission === "granted" : false
  );
  const [resetting, setResetting] = useState(false);
  const [installing, setInstalling] = useState(false);
  const installLabel = useMemo(() => getInstallLabel(), []);
  const isInstalled = isRunningStandalone();
  const isMobile = isMobileDevice();

  // Fetch current start_date
  const { data: stats } = useQuery({
    queryKey: ["user_stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_stats").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const currentStartDate = startDate || (stats?.start_date ? new Date(stats.start_date + "T00:00:00") : undefined);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleUpdateProfile = async () => {
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
    if (error) { toast.error(error.message); return; }
    if (user) {
      await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile updated!");
    setEditingProfile(false);
  };

  const handleSetStartDate = async (date: Date | undefined) => {
    if (!date || !user) return;
    setStartDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const update: TablesUpdate<"user_stats"> = { start_date: dateStr };
    const { error } = await supabase.from("user_stats").update(update).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success(`Program starts ${format(date, "MMM d, yyyy")} → ends ${format(new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()), "MMM d, yyyy")}`);
  };

  const handleToggleNotifications = async () => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setNotificationsEnabled(result === "granted");
        if (result === "granted") toast.success("Notifications enabled!");
        else toast.info("Notifications denied");
      } else if (Notification.permission === "granted") {
        setNotificationsEnabled(!notificationsEnabled);
        toast.info(notificationsEnabled ? "Notifications muted" : "Notifications enabled");
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
    const { error: logDeleteError } = await supabase.from("daily_logs").delete().eq("user_id", user.id);
    if (logDeleteError) {
      toast.error(logDeleteError.message);
      setResetting(false);
      return;
    }
    const { error: habitDeleteError } = await supabase.from("habits").delete().eq("user_id", user.id);
    if (habitDeleteError) {
      toast.error(habitDeleteError.message);
      setResetting(false);
      return;
    }
    const { error: statResetError } = await supabase.from("user_stats").update({
      coins: 0, streak: 0, shields: 0, power_ups: 0, current_growth: 1.0,
    }).eq("user_id", user.id);
    if (statResetError) {
      toast.error(statResetError.message);
      setResetting(false);
      return;
    }
    qc.invalidateQueries();
    toast.success("All data reset to defaults!");
    setResetting(false);
    onClose();
  };

  const handleInstallApp = async () => {
    const installPrompt = window.__vicissInstallPromptEvent;
    if (!installPrompt) {
      if (isMobile) {
        toast.info("Use Chrome menu > Add to Home screen to install");
      } else {
        toast.info("Use your browser install icon in the address bar");
      }
      return;
    }

    setInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success(`${installLabel} started`);
      } else {
        toast.info("Install dismissed");
      }
    } catch {
      toast.error("Install prompt not available");
    } finally {
      setInstalling(false);
    }
  };

  if (showShields) return <ShieldShop onClose={() => setShowShields(false)} />;
  if (showPowerUps) return <PowerUpOverlay onClose={() => setShowPowerUps(false)} />;
  if (showImport) return <CsvImport onClose={() => setShowImport(false)} />;

  const initial = user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";
  const currentDisplayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="glass-strong rounded-2xl p-4 sm:p-5 w-full max-w-sm max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Account</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xl font-bold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-2">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary border-border h-10 text-base" placeholder="Display Name" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateProfile} className="bg-primary text-primary-foreground text-sm h-8">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)} className="text-sm h-8">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold text-foreground text-base truncate">{currentDisplayName}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                <button onClick={() => { setDisplayName(currentDisplayName); setEditingProfile(true); }} className="text-sm text-primary hover:underline mt-0.5">
                  <User className="h-3 w-3 inline mr-1" />Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-0.5">
          <button onClick={() => setShowShields(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground text-base">
            <Shield className="h-5 w-5 text-primary" /> Shield Shop
          </button>
          <button onClick={() => setShowPowerUps(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground text-base">
            <Zap className="h-5 w-5 text-primary" /> Power-Up Recovery
          </button>
          <button onClick={() => setShowImport(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground text-base">
            <Upload className="h-5 w-5 text-primary" /> Import History
          </button>
          {!isInstalled && (
            <button
              onClick={handleInstallApp}
              disabled={installing}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground text-base disabled:opacity-60"
            >
              <Download className="h-5 w-5 text-primary" />
              {installing ? "Preparing install..." : installLabel}
            </button>
          )}

          {/* Start Date */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl text-foreground text-base">
            <span className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /> Start Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-sm text-primary hover:underline">
                  {currentStartDate ? format(currentStartDate, "MMM d, yyyy") : "Set date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="end">
                <CalendarPicker
                  mode="single"
                  selected={currentStartDate}
                  onSelect={handleSetStartDate}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notifications toggle */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl text-foreground text-base">
            <span className="flex items-center gap-3"><Bell className="h-5 w-5 text-primary" /> Notifications</span>
            <Switch checked={notificationsEnabled} onCheckedChange={handleToggleNotifications} className="data-[state=checked]:bg-primary" />
          </div>

          <hr className="border-border my-1" />

          <button onClick={handleResetDefaults} disabled={resetting} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive text-base">
            <RotateCcw className="h-5 w-5" /> {resetting ? "Resetting..." : "Reset All Data"}
          </button>

          <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive text-base h-10">
            <LogOut className="h-5 w-5 mr-3" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
