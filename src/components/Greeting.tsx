import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
    greeting = `Good Morning, ${name}`;
    message = "Rise and grind. Today's 1% starts now.";
  } else if (hour >= 12 && hour < 17) {
    greeting = `Good Afternoon, ${name}`;
    message = "Halfway through. Keep the momentum alive.";
  } else if (hour >= 17 && hour < 21) {
    greeting = `Good Evening, ${name}`;
    message = "Reflect and finish strong. Every rep counts.";
  } else {
    greeting = `Good Night, ${name}`;
    message = "Rest well. Tomorrow is another 1%.";
  }

  return (
    <div className="px-3 sm:px-4 md:px-8 pt-3 pb-2">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{greeting}</h2>
      <p className="text-sm md:text-base text-muted-foreground">{message}</p>
    </div>
  );
}
