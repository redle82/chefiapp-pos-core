// @ts-nocheck
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { getTpvRestaurantId } from "../storage/installedDeviceStorage";
import { CashRegisterEngine } from "../tpv/CashRegister";

interface ShiftContextValue {
  isShiftOpen: boolean;
  isChecking: boolean;
  lastCheckedAt: Date | null;
  refreshShiftStatus: () => Promise<void>;
  /** Marca turno como aberto (ex.: quando o RPC devolve CASH_REGISTER_ALREADY_OPEN). */
  markShiftOpen: () => void;
}

/** Exported for public/trial tree (minimal providers). */
export const ShiftContext = createContext<ShiftContextValue | null>(null);

const INITIAL_INTERVAL = 5000; // 5s initial retry if failed
const MAX_INTERVAL = 60000; // 60s max interval

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { runtime } = useRestaurantRuntime();
  const installedTpvRestaurantId = getTpvRestaurantId();
  const restaurantId =
    runtime.restaurant_id ?? installedTpvRestaurantId ?? null;
  const canCheckShift =
    !!restaurantId && (runtime.isPublished || !!installedTpvRestaurantId);

  // Estado do caixa vem sempre do Core (incluindo seed); evita "Caixa Fechado" quando o seed já tem caixa aberto.
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const backoffRef = useRef(INITIAL_INTERVAL);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkShiftStatus = useCallback(async () => {
    if (!restaurantId || !canCheckShift) return;

    setIsChecking(true);
    try {
      const register = await CashRegisterEngine.getOpenCashRegister(
        restaurantId,
      );
      const isOpen = !!register;

      setIsShiftOpen(isOpen);
      setLastCheckedAt(new Date());

      // Success! Reset backoff to normal polling
      backoffRef.current = MAX_INTERVAL;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isAbort =
        err instanceof Error &&
        (err.name === "AbortError" || msg.includes("aborted"));

      if (isAbort) {
        backoffRef.current = MAX_INTERVAL;
        return;
      }

      const isConnectionError =
        msg.includes("Failed to fetch") ||
        msg.includes("net::ERR_CONNECTION_REFUSED");

      if (isConnectionError) {
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_INTERVAL);
      } else {
        backoffRef.current = MAX_INTERVAL;
        console.warn(
          "[ShiftContext] Non-connection error checking shift:",
          err,
        );
      }
    } finally {
      setIsChecking(false);

      // Schedule next check
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(checkShiftStatus, backoffRef.current);
    }
  }, [restaurantId, canCheckShift]);

  useEffect(() => {
    if (restaurantId && canCheckShift) {
      backoffRef.current = INITIAL_INTERVAL;
      checkShiftStatus();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [restaurantId, canCheckShift]); // Removing checkShiftStatus dependency to avoid loops

  const markShiftOpen = useCallback(() => {
    setIsShiftOpen(true);
    setLastCheckedAt(new Date());
  }, []);

  const value = {
    isShiftOpen,
    isChecking,
    lastCheckedAt,
    refreshShiftStatus: checkShiftStatus,
    markShiftOpen,
  };

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
};

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error("useShift must be used within a ShiftProvider");
  }
  return context;
};
