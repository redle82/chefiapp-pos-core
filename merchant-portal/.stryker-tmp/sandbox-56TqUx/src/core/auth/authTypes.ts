/**
 * Tipos mínimos de auth para Core (Docker). Sem dependência de @supabase/supabase-js.
 */
// @ts-nocheck


export interface CoreUser {
  id: string;
  aud?: string;
  role?: string;
  email?: string;
  phone?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface CoreSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user: CoreUser;
}
