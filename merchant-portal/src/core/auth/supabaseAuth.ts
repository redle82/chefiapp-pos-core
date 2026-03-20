/**
 * Supabase Auth — fluxo soberano P0 (Supabase/Core).
 *
 * Usado quando CONFIG.isSupabaseBackend: login email/password, sessão JWT
 * para PostgREST/RLS. Uma única fonte para getSession/signIn/signOut.
 */

import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import { CONFIG } from "../../config";
import type { CoreSession, CoreUser } from "./authTypes";

let client: ReturnType<typeof createClient> | null = null;

function getSupabaseClient(): ReturnType<typeof createClient> | null {
  if (client) return client;
  if (typeof window === "undefined" || !CONFIG.CORE_URL || !CONFIG.CORE_ANON_KEY) {
    return null;
  }
  client = createClient(CONFIG.CORE_URL, CONFIG.CORE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

function mapUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> }): CoreUser {
  return {
    id: u.id,
    aud: "authenticated",
    role: "authenticated",
    email: u.email ?? undefined,
    phone: "",
    app_metadata: {},
    user_metadata: (u.user_metadata as Record<string, unknown>) ?? {},
    created_at: undefined,
  };
}

export function mapSupabaseSession(session: Session | null): CoreSession | null {
  if (!session?.user) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in ?? undefined,
    token_type: "bearer",
    user: mapUser(session.user),
  };
}

export async function getSupabaseSession(): Promise<CoreSession | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return mapSupabaseSession(data.session);
}

export async function signInWithPasswordSupabase(
  email: string,
  password: string
): Promise<{ session: CoreSession; user: CoreUser } | { error: Error }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error };
  const core = mapSupabaseSession(data.session);
  if (!core) return { error: new Error("No session after sign in") };
  return { session: core, user: core.user };
}

// ── Phone OTP ──────────────────────────────────────────────

export async function signInWithPhoneOtp(
  phone: string
): Promise<{ success: true } | { error: Error }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { error };
  return { success: true };
}

export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<{ session: CoreSession; user: CoreUser } | { error: Error }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) return { error };
  const core = mapSupabaseSession(data.session);
  if (!core) return { error: new Error("No session after OTP verification") };
  return { session: core, user: core.user };
}

// ── Google OAuth ───────────────────────────────────────────

export async function signInWithGoogle(
  redirectTo?: string
): Promise<{ success: true } | { error: Error }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
    },
  });
  if (error) return { error };
  return { success: true };
}

// ── Sign Out ───────────────────────────────────────────────

export async function signOutSupabase(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) await supabase.auth.signOut();
}

export function onSupabaseAuthStateChange(
  callback: (session: CoreSession | null) => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(mapSupabaseSession(session));
  });
  return () => subscription.unsubscribe();
}
