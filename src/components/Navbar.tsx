import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import AccountCenter from "./AccountCenter";
import StatsBar from "./StatsBar";

export default function Navbar() {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const initial = user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <>
      <nav className="relative z-20 flex items-center justify-between px-3 md:px-8 py-2 glass-strong">
        {/* Desktop: show title, Mobile: show stats inline */}
        <h1 className="hidden md:block text-xl font-bold tracking-tight text-foreground">
          Vicissometer
        </h1>
        <div className="md:hidden flex-1 overflow-x-auto">
          <StatsBar />
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <Button variant="ghost" size="icon" onClick={() => setShowNotif(!showNotif)} className="relative h-8 w-8">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <button
            onClick={() => setShowAccount(true)}
            className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs hover:bg-primary/30 transition-colors"
          >
            {initial}
          </button>
        </div>
      </nav>
      {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
      {showAccount && <AccountCenter onClose={() => setShowAccount(false)} />}
    </>
  );
}
