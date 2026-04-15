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
      <nav className="relative z-20 flex items-center justify-between px-2 md:px-8 py-1.5 md:py-2 glass-strong">
        {/* Desktop: show title, Mobile: show stats inline */}
        <h1 className="hidden md:block text-xl font-bold tracking-tight text-foreground">
          Vicissometer
        </h1>
        <div className="md:hidden flex-1 min-w-0 overflow-x-auto">
          <StatsBar />
        </div>
        <div className="flex items-center gap-1 ml-1.5 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setShowNotif(!showNotif)} className="relative h-7 w-7 md:h-8 md:w-8">
            <Bell className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </Button>
          <button
            onClick={() => setShowAccount(true)}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-[10px] md:text-xs hover:bg-primary/30 transition-colors"
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
