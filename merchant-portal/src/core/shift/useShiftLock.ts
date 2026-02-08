import { useEffect, useRef } from "react";
import { useShift } from "./ShiftContext";

export function useShiftLock() {
  const { isShiftOpen } = useShift();
  const isShiftOpenRef = useRef(isShiftOpen);

  // Sync ref with context state for the beforeunload listener
  useEffect(() => {
    isShiftOpenRef.current = isShiftOpen;
  }, [isShiftOpen]);

  // Listener for Reload / Close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isShiftOpenRef.current) {
        // Standard message (modern browsers often ignore custom text, but we set it anyway)
        const message =
          "AO VIVO: TURNO ATIVO. REARREGO BLOQUEADO. Feche o turno ou solicite Manager Override.";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return { isShiftOpen };
}
