/**
 * PLUGIN REGISTRY — Effects que reagem a eventos do Core
 *
 * Permite registar handlers que processam eventos publicados pelo EventBus.
 * O handler "critical" (ex: analytics) determina retry/dead-letter.
 * Handlers não-critical são best-effort (erros logados, não bloqueiam).
 *
 * USAGE:
 *   registerEffect(analyticsPlugin, { critical: true });
 *   registerEffect(auditPlugin);
 *   await emit(event);
 */

import { Logger } from "../logger";
import type { CoreEvent } from "./eventTypes";

export type EffectHandler = (event: CoreEvent) => Promise<void>;

export interface EffectRegistration {
  handler: EffectHandler;
  critical: boolean;
  name?: string;
}

const plugins: EffectRegistration[] = [];

/**
 * Regista um effect que será notificado em cada evento publicado.
 */
export function registerEffect(
  handler: EffectHandler,
  options?: { critical?: boolean; name?: string }
): void {
  plugins.push({
    handler,
    critical: options?.critical ?? false,
    name: options?.name,
  });
}

/**
 * Remove todos os plugins (útil para testes).
 */
export function clearEffects(): void {
  plugins.length = 0;
}

/**
 * Emite evento para todos os plugins.
 * - Critical: falha propaga (para retry do EventBus).
 * - Non-critical: erros logados, não propagam.
 */
export async function emit(event: CoreEvent): Promise<{ success: boolean; error?: string }> {
  const critical = plugins.filter((p) => p.critical);
  const secondary = plugins.filter((p) => !p.critical);

  // Run critical first (usually one: analytics)
  for (const { handler, name } of critical) {
    try {
      await handler(event);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Logger.warn("[PLUGIN_REGISTRY] Critical effect failed", {
        plugin: name ?? "unknown",
        eventType: event.eventType,
        error: msg,
      });
      return { success: false, error: msg };
    }
  }

  // Run secondary in parallel, best-effort
  const secondaryPromises = secondary.map(async ({ handler, name }) => {
    try {
      await handler(event);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Logger.warn("[PLUGIN_REGISTRY] Secondary effect failed (non-blocking)", {
        plugin: name ?? "unknown",
        eventType: event.eventType,
        error: msg,
      });
    }
  });
  await Promise.all(secondaryPromises);

  return { success: true };
}
