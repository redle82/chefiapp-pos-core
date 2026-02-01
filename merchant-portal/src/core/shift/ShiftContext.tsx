import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { CashRegisterEngine } from "../tpv/CashRegister";

interface ShiftContextValue {
  isShiftOpen: boolean;
  isChecking: boolean;
  lastCheckedAt: Date | null;
  refreshShiftStatus: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextValue | null>(null);

const INITIAL_INTERVAL = 5000; // 5s initial retry if failed
const MAX_INTERVAL = 60000; // 60s max interval

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id;

  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const backoffRef = useRef(INITIAL_INTERVAL);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkShiftStatus = useCallback(async () => {
    if (!restaurantId || !runtime.isPublished) return;

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
      // If connection refused, implement exponential backoff
      const msg = err instanceof Error ? err.message : String(err);
      const isConnectionError =
        msg.includes("Failed to fetch") ||
        msg.includes("net::ERR_CONNECTION_REFUSED");

      if (isConnectionError) {
        // Backoff: double the interval up to MAX_INTERVAL
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_INTERVAL);
      } else {
        // Other errors: maybe just log and stick to current backoff
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
  }, [restaurantId, runtime.isPublished]);

  useEffect(() => {
    if (restaurantId && runtime.isPublished) {
      // Start polling
      backoffRef.current = INITIAL_INTERVAL;
      checkShiftStatus();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [restaurantId, runtime.isPublished]); // Removing checkShiftStatus dependency to avoid loops

  const value = {
    isShiftOpen,
    isChecking,
    lastCheckedAt,
    refreshShiftStatus: checkShiftStatus,
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
