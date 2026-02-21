// @ts-nocheck
import { useEffect } from "react";
import { useOrders } from "../pages/TPV/context/OrderContextReal";

/**
 * useShiftLock — UI guard to prevent accidental reloads during active shifts.
 * Implements CORE_IMMUTABLE_SHIFT_CONTRACT.
 */
export function useShiftLock() {
  const { cashRegisterId } = useOrders();

  useEffect(() => {
    if (!cashRegisterId) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Standard way to trigger a "Confirm reload" dialog in browsers
      const message =
        "CAIXA ABERTO: Se recarregar a página, poderá perder dados locais não sincronizados e interromper a estabilidade do turno.";
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [cashRegisterId]);
}
