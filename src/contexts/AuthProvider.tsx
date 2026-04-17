import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "./AuthContext";

export function AuthProvider({
  children,
  onAuthChange,
}: {
  children: ReactNode;
  onAuthChange?: (userId: string | null) => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // onAuthStateChange is the canonical source of truth.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const newUserId = newSession?.user?.id ?? null;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (prevUserIdRef.current !== newUserId) {
        prevUserIdRef.current = newUserId;
        onAuthChange?.(newUserId);
      }
    });

    // Seed initial state in case the listener fires after first render.
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession((prev) => prev ?? initialSession);
        setUser((prev) => prev ?? (initialSession?.user ?? null));
        setLoading((prev) => (prev ? false : prev));
      })
      .catch(() => {
        // Network error on getSession — still resolve loading so the app isn't stuck.
        setLoading(false);
      });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.warn("Sign out network error, forcing local sign out", err);
    } finally {
      // Regardless of network success, we MUST wipe the local session and tell the app we're logged out.
      // E.g., if Supabase is blocked by an adblocker or HTTP/2 error, we still want to log out.
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-'))
        .forEach((k) => localStorage.removeItem(k));
      setSession(null);
      setUser(null);
      if (prevUserIdRef.current !== null) {
        prevUserIdRef.current = null;
        onAuthChange?.(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
