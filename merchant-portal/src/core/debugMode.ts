/**
 * Debug mode — gesto explícito, nunca ambiente.
 *
 * Regra: ambiente nunca muda comportamento funcional.
 * Bypasses e ferramentas de teste só ativam com pedido explícito:
 * - URL ?debug=1 ou
 * - sessionStorage chefiapp_debug=1
 *
 * Não usar import.meta.env.DEV para lógica; só para nível de log (Logger).
 */

export function isDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "1") return true;
  try {
    if (sessionStorage.getItem("chefiapp_debug") === "1") return true;
  } catch {
    // ignore
  }
  return false;
}
