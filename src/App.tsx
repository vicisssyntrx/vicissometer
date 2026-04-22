import { useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthProvider";
import PwaInstallManager from "@/components/PwaInstallManager";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// QueryClient is created once at the module level so it persists across re-renders.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2 retries with 1 second delay gives worn network enough time to recover.
      retry: 2,
      retryDelay: 1000,
      staleTime: 0, // Always refetch on window focus to ensure cross-device sync
    },
  },
});

function AppInner() {
  // Stable ref so the callback identity doesn't change across renders.
  const prevUserIdRef = useRef<string | null>(null);

  const handleAuthChange = useCallback((userId: string | null) => {
    // When the active user changes (login, logout, or switch), blow away ALL cached
    // query data so the new user's data is fetched fresh from Supabase.
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      queryClient.removeQueries(); // hard-remove (not just invalidate) to avoid showing old user data
      console.log("[Auth] User changed to", userId, "— cleared React Query cache");
    }
  }, []);

  return (
    <AuthProvider onAuthChange={handleAuthChange}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PwaInstallManager />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
