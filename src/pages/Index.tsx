import { useAuth } from "@/contexts/useAuth";
import { Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import LoadingScreen from "@/components/LoadingScreen";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Restoring your session…" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Dashboard />;
}
