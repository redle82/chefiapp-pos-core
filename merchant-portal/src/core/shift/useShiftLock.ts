import { useEffect, useRef } from "react";
import { isLogoutInProgress } from "../auth/authKeycloak";
import { useShift } from "./ShiftContext";

export function useShiftLock() {
  const { isShiftOpen } = useShift();
  const isShiftOpenRef = useRef(isShiftOpen);

  useEffect(() => {
    isShiftOpenRef.current = isShiftOpen;
  }, [isShiftOpen]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLogoutInProgress()) return;
      if (isShiftOpenRef.current) {
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
