import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export default function Greeting() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const name = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();

  let greeting = "";
  let message = "";

  if (hour >= 5 && hour < 12) {
    greeting = `Good Morning, ${name} ☀️`;
    message = "Rise and grind. Today's 1% starts now.";
  } else if (hour >= 12 && hour < 17) {
    greeting = `Good Afternoon, ${name} 🌤️`;
    message = "Halfway through. Keep the momentum alive.";
  } else if (hour >= 17 && hour < 21) {
    greeting = `Good Evening, ${name} 🌙`;
    message = "Reflect and finish strong. Every rep counts.";
  } else {
    greeting = `Good Night, ${name} 🌌`;
    message = "Rest well. Tomorrow is another 1%.";
  }

  const fullGreeting = useMemo(() => greeting, [greeting]);
  const [typedGreeting, setTypedGreeting] = useState(fullGreeting);

  useEffect(() => {
    const key = "viciss_greeting_typed_once";
    const alreadyTyped = sessionStorage.getItem(key) === "true";
    if (alreadyTyped) {
      setTypedGreeting(fullGreeting);
      return;
    }

    let idx = 0;
    setTypedGreeting("");
    const timer = window.setInterval(() => {
      idx += 1;
      setTypedGreeting(fullGreeting.slice(0, idx));
      if (idx >= fullGreeting.length) {
        window.clearInterval(timer);
        sessionStorage.setItem(key, "true");
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, [fullGreeting]);

  return (
    <div className="px-5 sm:px-6 pt-6 pb-4">
      <div className="mx-auto w-full max-w-[860px]">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{typedGreeting}</h2>
        <p className="text-base md:text-lg text-muted-foreground mt-0.5">{message}</p>
      </div>
    </div>
  );
}
