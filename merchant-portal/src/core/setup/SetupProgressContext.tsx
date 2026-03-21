/**
 * SetupProgressContext — React context for the setup progress engine.
 *
 * Usage:
 *   const { state, progress, nextRoute, phase } = useSetupProgress();
 *
 * For standalone usage outside the provider, use:
 *   import { useSetupProgressFromRuntime } from "./useSetupProgressFromRuntime";
 *
 * The context does NOT own any state — it's a derived view of the
 * restaurant's current configuration.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 2)
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  getSetupProgress,
  type SetupProgressInput,
  type SetupProgressResult,
  type SetupStatusFlags,
} from "./SetupProgressEngine";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const defaultResult: SetupProgressResult = {
  state: "lead",
  nextRoute: "/",
  progress: 0,
  phase: "Identidade",
  phaseIndex: 0,
  totalPhases: 8,
  isSetupComplete: false,
  isOperational: false,
};

const SetupProgressCtx = createContext<SetupProgressResult>(defaultResult);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SetupProgressProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
  hasRestaurant: boolean;
  setupStatus: SetupStatusFlags;
  onboardingCompletedAt: string | null;
  tpvInstalled?: boolean;
  tpvPaired?: boolean;
  shiftOpen?: boolean;
  kdsConnected?: boolean;
  staffAppConnected?: boolean;
  testPassed?: boolean;
}

export function SetupProgressProvider({
  children,
  isAuthenticated,
  hasRestaurant,
  setupStatus,
  onboardingCompletedAt,
  tpvInstalled = false,
  tpvPaired = false,
  shiftOpen = false,
  kdsConnected = false,
  staffAppConnected = false,
  testPassed = false,
}: SetupProgressProviderProps) {
  const input: SetupProgressInput = useMemo(
    () => ({
      isAuthenticated,
      hasRestaurant,
      setupStatus,
      onboardingCompletedAt,
      tpvInstalled,
      tpvPaired,
      shiftOpen,
      kdsConnected,
      staffAppConnected,
      testPassed,
    }),
    [
      isAuthenticated,
      hasRestaurant,
      setupStatus,
      onboardingCompletedAt,
      tpvInstalled,
      tpvPaired,
      shiftOpen,
      kdsConnected,
      staffAppConnected,
      testPassed,
    ],
  );

  const result = useMemo(() => getSetupProgress(input), [input]);

  return (
    <SetupProgressCtx.Provider value={result}>
      {children}
    </SetupProgressCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSetupProgress(): SetupProgressResult {
  return useContext(SetupProgressCtx);
}
