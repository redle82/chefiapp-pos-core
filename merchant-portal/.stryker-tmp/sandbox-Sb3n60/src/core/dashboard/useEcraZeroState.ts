/**
 * useEcraZeroState — estado do Ecrã Zero do Dono (verde / amarelo / vermelho)
 *
 * Regra (docs/product/ECRA_ZERO_DONO.md):
 * - Vermelho: pelo menos 1 alerta crítico → motivo = título do primeiro
 * - Amarelo: pelo menos 1 alerta ativo (não crítico) OU estoque baixo → motivo = título ou "Estoque baixo"
 * - Verde: nenhum alerta ativo/crítico e estoque OK
 *
 * FASE 2 Passo 5: estoque baixo (qty <= min_qty) faz Ecrã Zero passar a amarelo.
 */

import { useEffect, useState } from "react";
import { readStockLevels } from "../../infra/readers/InventoryStockReader";
import { alertEngine } from "../alerts/AlertEngine";

export type EcraZeroState = "verde" | "amarelo" | "vermelho";

export interface EcraZeroResult {
  state: EcraZeroState;
  reason: string | null;
  loading: boolean;
}

export function useEcraZeroState(restaurantId: string | null): EcraZeroResult {
  const [state, setState] = useState<EcraZeroState>("verde");
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setState("verde");
      setReason(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [critical, active] = await Promise.all([
          alertEngine.getCritical(restaurantId),
          alertEngine.getActive(restaurantId),
        ]);
        if (cancelled) return;
        if (critical.length > 0) {
          setState("vermelho");
          setReason(critical[0].title ?? "Alerta crítico.");
        } else if (active.length > 0) {
          setState("amarelo");
          setReason(active[0].title ?? "Alerta ativo.");
        } else {
          try {
            const levels = await readStockLevels(restaurantId);
            const low = levels.filter((l) => l.qty <= l.min_qty);
            if (!cancelled && low.length > 0) {
              setState("amarelo");
              setReason(
                low.length === 1
                  ? `Estoque baixo: ${low[0].ingredient?.name ?? "ingrediente"}`
                  : `Estoque baixo: ${low.length} ingrediente(s)`
              );
              // Trigger real: criar alerta stock_low para aparecer no Dashboard de Alertas (idempotente: só criamos se ainda não há active)
              const hasStockLow = active.some(
                (a) => a.alertType === "stock_low"
              );
              if (!hasStockLow) {
                const first = low[0];
                alertEngine
                  .createFromEvent(restaurantId, "stock_low", {
                    productName: first?.ingredient?.name ?? "ingrediente",
                    count: low.length,
                    entityType: "inventory",
                    entityId: first?.id,
                  })
                  .catch(() => {});
              }
            } else if (!cancelled) {
              setState("verde");
              setReason(null);
            }
          } catch {
            if (!cancelled) {
              setState("verde");
              setReason(null);
            }
          }
        }
      } catch {
        if (!cancelled) {
          setState("verde");
          setReason(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return { state, reason, loading };
}
