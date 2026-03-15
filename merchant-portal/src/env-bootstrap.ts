/**
 * Expõe env do Vite em globalThis.__CHEFIAPP_ENV__ para backendAdapter (que não usa import.meta para correr em Jest/Node).
 * Carregar antes de qualquer módulo que use backendAdapter.
 */
if (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env) {
  const env = (import.meta as { env: Record<string, string> }).env;
  const bag: Record<string, string> = {};
  if (env.VITE_CORE_URL) bag.VITE_CORE_URL = env.VITE_CORE_URL;
  if (env.VITE_SUPABASE_URL) bag.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  if (env.VITE_KEYCLOAK_URL) bag.VITE_KEYCLOAK_URL = env.VITE_KEYCLOAK_URL;
  if (env.VITE_KEYCLOAK_REALM) bag.VITE_KEYCLOAK_REALM = env.VITE_KEYCLOAK_REALM;
  if (env.VITE_KEYCLOAK_CLIENT_ID) bag.VITE_KEYCLOAK_CLIENT_ID = env.VITE_KEYCLOAK_CLIENT_ID;
  if (env.VITE_API_BASE) bag.VITE_API_BASE = env.VITE_API_BASE;
  if (env.VITE_INTERNAL_API_TOKEN) bag.VITE_INTERNAL_API_TOKEN = env.VITE_INTERNAL_API_TOKEN;
  (globalThis as { __CHEFIAPP_ENV__?: Record<string, string> }).__CHEFIAPP_ENV__ = bag;
}
