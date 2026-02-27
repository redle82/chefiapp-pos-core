/**
 * modulesConfigStorage — FASE 1 Passo 2: preferência TPV/KDS por restaurante
 *
 * Fallback em localStorage até haver colunas em gm_restaurants ou tabela tenant_modules.
 * Chave: chefiapp_modules_${restaurantId}
 * Default: tpv e kds ativos (não quebra fluxo existente).
 */

export interface ModulesEnabled {
  tpv: boolean;
  kds: boolean;
}

// TDZ-safe: function declarations are hoisted, const is not.
// In a monolithic Rollup chunk, module body order may cause TDZ on const.
function defaults(): ModulesEnabled {
  return { tpv: true, kds: true };
}

function key(restaurantId: string): string {
  return `chefiapp_modules_${restaurantId}`;
}

export function getModulesEnabled(restaurantId: string | null): ModulesEnabled {
  const def = defaults();
  if (!restaurantId || typeof localStorage === "undefined") return def;
  try {
    const raw = localStorage.getItem(key(restaurantId));
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<ModulesEnabled>;
    return {
      tpv: parsed.tpv ?? def.tpv,
      kds: parsed.kds ?? def.kds,
    };
  } catch {
    return def;
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
