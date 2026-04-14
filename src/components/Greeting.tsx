import { useAuth } from "@/contexts/AuthContext";

export default function Greeting() {
  const { user } = useAuth();
  const name = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";
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
    <div className="px-4 md:px-8 pt-3 pb-1">
      <h2 className="text-lg md:text-xl font-bold text-foreground">{greeting}</h2>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
