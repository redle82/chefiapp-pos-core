/**
 * useSetupProgressFromRuntime — Standalone hook for setup progress.
 *
 * Reads directly from RestaurantRuntimeContext and derives the current
 * SetupState via SetupProgressEngine. Use this in any component that
 * is inside RestaurantRuntimeContext (all authenticated routes).
 *
 * Maps RestaurantRuntime fields to SetupProgressEngine input:
 * - setup_status → setupStatus flags (identity, schedule, menu, etc.)
 * - isPublished → onboardingCompletedAt proxy (published = activated)
 * - restaurant_id → hasRestaurant
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 2)
 */

import { useMemo } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  getSetupProgress,
  type SetupProgressInput,
  type SetupProgressResult,
  type SetupStatusFlags,
} from "./SetupProgressEngine";

export function useSetupProgressFromRuntime(): SetupProgressResult {
  const runtime = useRestaurantRuntime();

  const hasRestaurant = !!runtime?.restaurant_id;
  const setupStatus = (runtime?.setup_status ?? {}) as SetupStatusFlags;
  // isPublished serves as proxy for "onboarding completed" — a published
  // restaurant has been through the activation ritual.
  const isActivated = runtime?.isPublished ?? false;

  const input: SetupProgressInput = useMemo(
    () => ({
      isAuthenticated: true,
      hasRestaurant,
      setupStatus,
      onboardingCompletedAt: isActivated ? "activated" : null,
      tpvInstalled: false,
      tpvPaired: false,
      shiftOpen: false,
      kdsConnected: false,
      staffAppConnected: false,
      testPassed: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasRestaurant, JSON.stringify(setupStatus), isActivated],
  );

  return useMemo(() => getSetupProgress(input), [input]);
}
