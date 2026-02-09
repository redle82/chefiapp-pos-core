import { registerPushTokenForUser } from "@/services/pushRegistration";
import { supabase } from "@/services/supabase";
import React, { createContext, useContext, useEffect, useState } from "react";

/** Minimal session type (Core auth; no @supabase/supabase-js). */
export type Session = {
  user: { id: string; email?: string };
  access_token?: string;
} | null;

interface AuthContextType {
  session: Session;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    registerPushTokenForUser(session.user.id).catch((error) => {
      console.warn("[Auth] Push registration failed", error);
    });
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  // Placeholder for simple Admin check (e.g. email domain or metadata)
  const isAdmin = !!session?.user;

  return (
    <AuthContext.Provider
      value={{ session, loading, isAdmin, signOut, signIn, signUp }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
