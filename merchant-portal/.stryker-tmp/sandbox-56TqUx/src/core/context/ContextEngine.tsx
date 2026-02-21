// @ts-nocheck
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { usePulseOptional } from "../pulse";
import { resolveContext } from "./ContextLogic";
import type { AppContextState, DeviceContext, UserRole } from "./ContextTypes";

// Initial state helpers
const getInitialDevice = (): DeviceContext => {
  // Simple detection for now
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
};

interface ContextEngineValue extends AppContextState {
  switchView: (targetRole: UserRole | null) => void; // null to reset to original
  updateDevice: (device: DeviceContext) => void;
  updateTurn: (turn: any) => void; // Typed as any for now
  hasTPV: boolean; // Infrastructure flag
}

const ContextEngineContext = createContext<ContextEngineValue | undefined>(
  undefined,
);

export function ContextEngineProvider({
  children,
  userRole,
  hasTPV = true, // Default to true for backward comp, but ideally passed from topology
}: {
  children: React.ReactNode;
  userRole: UserRole;
  hasTPV?: boolean;
}) {
  const [viewRole, setViewRole] = useState<UserRole | null>(null);
  const [device, setDevice] = useState<DeviceContext>(getInitialDevice());
  const [currentTurn, setCurrentTurn] = useState<any | undefined>(undefined); // Typed as any to avoid circular deps for now, or import TurnSession

  // Effect to detecting window resize for simple responsiveness (optional, usually handled by CSS, but good for context logic)
  React.useEffect(() => {
    const handleResize = () => {
      const newDevice = getInitialDevice();
      if (newDevice !== device) setDevice(newDevice);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [device]);

  // Role Resolution
  // If viewRole is set, we are in "View As" mode.
  // Otherwise, we are the userRole.
  const activeRole = viewRole || userRole;
  const isViewMode = !!viewRole;
  const originalRole = isViewMode ? userRole : undefined;

  // Calculate Context State
  const pulseCtx = usePulseOptional();
  const contextState = useMemo(() => {
    const pulseZone = pulseCtx?.snapshot?.zone ?? null;
    const base = resolveContext(
      activeRole,
      device,
      isViewMode,
      originalRole,
      pulseZone,
    );
    return { ...base, currentTurn };
  }, [
    activeRole,
    device,
    isViewMode,
    originalRole,
    currentTurn,
    pulseCtx?.snapshot?.zone,
  ]);

  const switchView = useCallback(
    (targetRole: UserRole | null) => {
      // Security check: Only Owner (or maybe Manager) can switch views
      if (userRole !== "owner" && userRole !== "manager") {
        console.warn(
          "[ContextEngine] Access Denied: Only Owner/Manager can switch views.",
        );
        return;
      }

      // Cannot switch to own role as a "view", just reset
      if (targetRole === userRole) {
        setViewRole(null);
        return;
      }

      setViewRole(targetRole);
    },
    [userRole],
  );

  const value: ContextEngineValue = {
    ...contextState,
    switchView,
    updateDevice: setDevice,
    updateTurn: setCurrentTurn,
    hasTPV,
  };

  return (
    <ContextEngineContext.Provider value={value}>
      {children}
    </ContextEngineContext.Provider>
  );
}

export function useContextEngine() {
  const context = useContext(ContextEngineContext);
  if (!context) {
    throw new Error(
      "useContextEngine must be used within a ContextEngineProvider",
    );
  }
  return context;
}
