import { useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // exponential backoff
      staleTime: 30 * 1000, // 30 seconds — prevents the focus-refetch storm
      refetchOnWindowFocus: true,  // still syncs cross-device on tab switch
      refetchOnReconnect: true,
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
