/**
 * Shared auth helper for Edge Functions.
 * Use requireUser() to get the current user or return 401 JSON response.
 *
 * CORS: Callers MUST handle OPTIONS (preflight) before calling requireUser()
 * and return 200 with corsHeaders so browsers don't break.
 */

import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export interface AuthResult {
  user: { id: string; [k: string]: unknown };
  supabase: SupabaseClient;
}

/**
 * Creates a Supabase client with the request's Authorization header
 * and returns the current user. If no valid user, returns a 401 Response
 * so the caller can return it directly.
 */
export async function requireUser(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<AuthResult | Response> {
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Valid user required" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return { user, supabase };
}

export { corsHeaders };
