import { X } from "lucide-react";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";

interface Props { onClose: () => void; }

export default function NotificationPanel({ onClose }: Props) {
  const { data: stats } = useUserStats();
  const { data: logs } = useDailyLogs();

  const notifications: { icon: string; message: string }[] = [];

  // Check if today is not saved
  const today = new Date().toISOString().split("T")[0];
  const todayLog = logs?.find((l) => l.date === today);
  if (!todayLog) {
    notifications.push({ icon: "📋", message: "Don't forget to track your habits today!" });
  }

  if (stats) {
    if (stats.streak > 0 && stats.shields === 0) {
      notifications.push({ icon: "⚠️", message: `Your ${stats.streak}-day streak is unprotected! Buy shields.` });
    }
    if (stats.power_ups > 0) {
      notifications.push({ icon: "⚡", message: `You have ${stats.power_ups} power-up${stats.power_ups > 1 ? "s" : ""} to use!` });
    }
    if (stats.streak >= 7) {
      notifications.push({ icon: "🔥", message: `Amazing ${stats.streak}-day streak!` });
    }
  }

  // Never miss twice
  if (logs && logs.length > 0) {
    const lastLog = logs[logs.length - 1];
    if (lastLog.completed_count === 0 && !lastLog.shield_used) {
      notifications.push({ icon: "💪", message: "Yesterday was missed. Never miss twice — show up today!" });
    }
  }

  if (notifications.length === 0) {
    notifications.push({ icon: "✨", message: "You're all caught up!" });
  }

  return (
    <div className="absolute right-4 top-14 z-30 glass-strong rounded-xl p-4 w-80 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <div className="space-y-2">
        {notifications.map((n, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/30">
            <span className="text-base">{n.icon}</span>
            <p className="text-sm text-foreground">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
