import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import AccountCenter from "./AccountCenter";

export default function Navbar() {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const initial = user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <>
      <nav className="relative z-20 flex items-center justify-between px-3 sm:px-4 md:px-8 py-2 md:py-2.5 glass-strong">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Vicissometer
        </h1>
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setShowNotif(!showNotif)} className="relative h-9 w-9 md:h-10 md:w-10">
            <Bell className="h-4.5 w-4.5 md:h-5 md:w-5 text-muted-foreground" />
          </Button>
          <button
            onClick={() => setShowAccount(true)}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-sm hover:bg-primary/30 transition-colors"
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
