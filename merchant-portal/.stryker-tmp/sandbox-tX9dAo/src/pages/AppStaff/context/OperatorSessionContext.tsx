import React, { createContext, useContext, useMemo, useState } from "react";
import type { OperatorSession, OperatorAppId, ScreenMode } from "./StaffCoreTypes";
import { useStaff } from "./StaffContext";
import { resolveAppForRole } from "../../../core/roles/roleAppRouting";
import { now as getNow } from "../../../intelligence/nervous-system/Clock";

interface OperatorSessionContextValue {
  session: OperatorSession;
  setActiveApp: (next: OperatorAppId) => void;
  setScreenMode: (mode: ScreenMode) => void;
  touch: () => void;
}

const OperatorSessionContext = createContext<OperatorSessionContextValue | undefined>(
  undefined
);

export const OperatorSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { activeRole, activeWorkerId } = useStaff();

  const initialApp = resolveAppForRole(activeRole);
  const [session, setSession] = useState<OperatorSession>(() => ({
    operatorId: activeWorkerId ?? null,
    role: activeRole,
    deviceId:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 64) : null,
    activeApp: initialApp,
    screenMode: "single",
    lastSeenAt: getNow(),
  }));

  const setActiveApp = (next: OperatorAppId) => {
    setSession((prev) => ({
      ...prev,
      activeApp: next,
      lastSeenAt: getNow(),
    }));
  };

  const setScreenMode = (mode: ScreenMode) => {
    setSession((prev) => ({
      ...prev,
      screenMode: mode,
      lastSeenAt: getNow(),
    }));
  };

  const touch = () => {
    setSession((prev) => ({
      ...prev,
      lastSeenAt: getNow(),
    }));
  };

  const value = useMemo(
    () => ({
      session,
      setActiveApp,
      setScreenMode,
      touch,
    }),
    [session]
  );

  return (
    <OperatorSessionContext.Provider value={value}>
      {children}
    </OperatorSessionContext.Provider>
  );
};

export function useOperatorSession() {
  const ctx = useContext(OperatorSessionContext);
  if (!ctx) {
    throw new Error(
      "useOperatorSession deve ser usado dentro de OperatorSessionProvider"
    );
  }
  return ctx;
}

