import { createClient } from "@supabase/supabase-js";

import { CONFIG } from "../../config";

console.log("!!! CONNECTION.TS EXECUTING !!!");

const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseKey = CONFIG.SUPABASE_ANON_KEY;

// Cliente canônico para o Docker Core (PostgREST + Realtime)
export const dockerCoreClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Verifica se o Core está acessível.
 */
export async function checkDockerCoreHealth(): Promise<boolean> {
  try {
    const { error } = await dockerCoreClient
      .from("gm_restaurants")
      .select("id")
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}
