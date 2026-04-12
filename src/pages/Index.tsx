import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Dashboard />;
}
