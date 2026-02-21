/**
 * modulesConfigStorage — FASE 1 Passo 2: preferência TPV/KDS por restaurante
 *
 * Fallback em localStorage até haver colunas em gm_restaurants ou tabela tenant_modules.
 * Chave: chefiapp_modules_${restaurantId}
 * Default: tpv e kds ativos (não quebra fluxo existente).
 */
// @ts-nocheck


export interface ModulesEnabled {
  tpv: boolean;
  kds: boolean;
}

const DEFAULT: ModulesEnabled = { tpv: true, kds: true };
const PREFIX = "chefiapp_modules_";

function key(restaurantId: string): string {
  return `${PREFIX}${restaurantId}`;
}

export function getModulesEnabled(restaurantId: string | null): ModulesEnabled {
  if (!restaurantId || typeof localStorage === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(key(restaurantId));
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<ModulesEnabled>;
    return {
      tpv: parsed.tpv ?? DEFAULT.tpv,
      kds: parsed.kds ?? DEFAULT.kds,
    };
  } catch {
    return DEFAULT;
  }
}

export function setModulesEnabled(
  restaurantId: string | null,
  config: Partial<ModulesEnabled>,
): void {
  if (!restaurantId || typeof localStorage === "undefined") return;
  try {
    const current = getModulesEnabled(restaurantId);
    const next: ModulesEnabled = {
      tpv: config.tpv ?? current.tpv,
      kds: config.kds ?? current.kds,
    };
    localStorage.setItem(key(restaurantId), JSON.stringify(next));
  } catch {
    // ignore
  }
}
