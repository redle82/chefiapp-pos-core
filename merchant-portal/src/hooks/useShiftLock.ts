import { useEffect } from "react";
import { isLogoutInProgress } from "../core/auth/authKeycloak";
import { useOrders } from "../pages/TPV/context/OrderContextReal";

/**
 * useShiftLock — UI guard to prevent accidental reloads during active shifts.
 * Implements CORE_IMMUTABLE_SHIFT_CONTRACT.
 * Does not show "Leave site?" when logout is in progress.
 */
export function useShiftLock() {
  const { cashRegisterId } = useOrders();

  useEffect(() => {
    if (!cashRegisterId) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLogoutInProgress()) return;
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
