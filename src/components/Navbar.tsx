import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import AccountCenter from "./AccountCenter";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ||
    null;
  const initial = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

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
            className="w-9 h-9 md:w-10 md:h-10 rounded-full hover:opacity-90 transition-opacity"
          >
            <Avatar className="h-9 w-9 md:h-10 md:w-10 border border-primary/40 bg-primary/20">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
              <AvatarFallback className="text-primary font-semibold text-sm">{initial}</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </nav>
      {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
      {showAccount && <AccountCenter onClose={() => setShowAccount(false)} />}
    </>
  );
}
