/**
 * Preferências TPV por restaurante (modo rápido, comportamiento de cierre).
 * Persistência em localStorage até haver coluna em gm_restaurants ou tabela de config.
 * A UI do TPV (/op/tpv) pode ler getTpvPreferences(restaurantId) para activar modo rápido
 * e pedir confirmação ao cerrar turno (confirmOnClose).
 */

const PREFIX = "chefiapp_tpv_prefs_";

export interface TpvPreferences {
  quickMode: boolean;
  confirmOnClose: boolean;
}

const DEFAULT: TpvPreferences = {
  quickMode: false,
  confirmOnClose: true,
};

function key(restaurantId: string): string {
  return `${PREFIX}${restaurantId}`;
}

export function getTpvPreferences(
  restaurantId: string | null,
): TpvPreferences {
  if (!restaurantId || typeof localStorage === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(key(restaurantId));
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<TpvPreferences>;
    return {
      quickMode: parsed.quickMode ?? DEFAULT.quickMode,
      confirmOnClose: parsed.confirmOnClose ?? DEFAULT.confirmOnClose,
    };
  } catch {
    return DEFAULT;
  }
}

export function setTpvPreferences(
  restaurantId: string | null,
  prefs: Partial<TpvPreferences>,
): void {
  if (!restaurantId || typeof localStorage === "undefined") return;
  try {
    const current = getTpvPreferences(restaurantId);
    const next: TpvPreferences = {
      quickMode: prefs.quickMode ?? current.quickMode,
      confirmOnClose: prefs.confirmOnClose ?? current.confirmOnClose,
    };
    localStorage.setItem(key(restaurantId), JSON.stringify(next));
  } catch {
    // ignore
  }
}
