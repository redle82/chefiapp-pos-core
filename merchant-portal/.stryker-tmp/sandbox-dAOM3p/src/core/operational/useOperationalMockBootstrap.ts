// @ts-nocheck
import { useEffect } from "react";
import { useOperationalStore } from "./useOperationalStore";

/**
 * useOperationalMockBootstrap
 *
 * Fase 1: inicializa alguns valores mínimos no OperationalStore usando
 * mocks estáticos (estoque e hardware). Isolado aqui para poder ser
 * facilmente removido/substituído quando integrações reais forem ligadas.
 */
export function useOperationalMockBootstrap() {
  const updateStock = useOperationalStore((state) => state.updateStock);
  const setPrinterStatus = useOperationalStore(
    (state) => state.setPrinterStatus,
  );

  useEffect(() => {
    // Impressoras — assumir online por defeito até termos heartbeat real.
    setPrinterStatus("kitchen", { status: "ONLINE", lastPrintAt: null });
    setPrinterStatus("bar", { status: "ONLINE", lastPrintAt: null });

    // Estoque — exemplo de produto com stock crítico / margem estimada.
    // Os IDs aqui são puramente ilustrativos e podem ser substituídos por
    // dados reais assim que o módulo de estoque estiver disponível.
    updateStock("DEMO_LOW_STOCK_PRODUCT", {
      currentQty: 3,
      criticalThreshold: 5,
      isUnavailable: false,
      marginPct: 35,
    });

    updateStock("DEMO_UNAVAILABLE_PRODUCT", {
      currentQty: 0,
      criticalThreshold: 5,
      isUnavailable: true,
      marginPct: null,
    });
  }, [setPrinterStatus, updateStock]);
}

