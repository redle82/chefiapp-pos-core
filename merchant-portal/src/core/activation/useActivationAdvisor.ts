/**
 * USE ACTIVATION ADVISOR
 *
 * Read-only React hook that provides activation recommendations.
 *
 * Constitutional Principle:
 * - READS existing stores (SystemState, Blueprint, localStorage)
 * - NEVER creates new source of truth
 * - NEVER mutates any state
 * - Guards against missing data
 *
 * Phase 3B — Activation Intelligence
 */

import { useMemo } from "react";
import { useSystemState } from "../kernel/BootstrapKernel";
import { getTabIsolated } from "../storage/TabIsolatedStorage";
import {
  ActivationAdvisor,
  type ActivationRecommendation,
  type OnboardingAnswers,
} from "./ActivationAdvisor";

// ═══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════

const ONBOARDING_ANSWERS_KEY = "chefiapp_onboarding_answers";
const ADVANCED_PROGRESS_KEY = "chefiapp_advanced_progress";

// ═══════════════════════════════════════════════════════════════
// HOOK RETURN TYPE
// ═══════════════════════════════════════════════════════════════

export interface UseActivationAdvisorResult {
  /** All recommendations based on current answers */
  recommendations: ActivationRecommendation[];
  /** High-priority recommendations only */
  highPriority: ActivationRecommendation[];
  /** Summary of recommendations by impact */
  summary: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  /** Whether the advisor has enough data to provide recommendations */
  isReady: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

/**
 * useActivationAdvisor — Read-only hook for activation recommendations
 *
 * Reads from:
 * - SystemState (via context)
 * - localStorage (onboarding answers)
 *
 * Never writes to anything.
 */
export function useActivationAdvisor(): UseActivationAdvisorResult {
  const { state: systemState, isReady: systemReady } = useSystemState();

  // Read onboarding answers from localStorage (read-only)
  const answers = useMemo<Partial<OnboardingAnswers>>(() => {
    try {
      // Try main onboarding answers storage
      const stored = getTabIsolated(ONBOARDING_ANSWERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Fallback: Try advanced progress for partial answers
      const advanced = getTabIsolated(ADVANCED_PROGRESS_KEY);
      if (advanced) {
        const parsed = JSON.parse(advanced);
        return parsed.answers || {};
      }

      // Fallback: Extract from blueprint if available
      if (systemState?.blueprint) {
        return extractAnswersFromBlueprint(systemState.blueprint);
      }

      return {};
    } catch (e) {
      console.warn("[useActivationAdvisor] Failed to read answers:", e);
      return {};
    }
  }, [systemState?.blueprint]);

  // Compute recommendations
  const result = useMemo(() => {
    // Guard: System not ready
    if (!systemReady) {
      return {
        recommendations: [],
        highPriority: [],
        summary: { high: 0, medium: 0, low: 0, total: 0 },
        isReady: false,
        isLoading: true,
        error: null,
      };
    }

    // Guard: No answers available
    if (Object.keys(answers).length === 0) {
      return {
        recommendations: [],
        highPriority: [],
        summary: { high: 0, medium: 0, low: 0, total: 0 },
        isReady: false,
        isLoading: false,
        error: null,
      };
    }

    try {
      const input = {
        answers,
        blueprint: systemState!.blueprint,
        systemState: systemState!,
      };

      const recommendations =
        ActivationAdvisor.getActivationRecommendations(input);
      const highPriority =
        ActivationAdvisor.getHighPriorityRecommendations(input);
      const impactSummary = ActivationAdvisor.getImpactSummary(recommendations);

      return {
        recommendations,
        highPriority,
        summary: {
          ...impactSummary,
          total: recommendations.length,
        },
        isReady: true,
        isLoading: false,
        error: null,
      };
    } catch (e) {
      console.error(
        "[useActivationAdvisor] Error computing recommendations:",
        e,
      );
      return {
        recommendations: [],
        highPriority: [],
        summary: { high: 0, medium: 0, low: 0, total: 0 },
        isReady: false,
        isLoading: false,
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  }, [answers, systemState, systemReady]);

  return result;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Extract onboarding-like answers from an existing blueprint
 * Used as fallback when explicit answers are not stored
 */
function extractAnswersFromBlueprint(
  blueprint: any,
): Partial<OnboardingAnswers> {
  const answers: Partial<OnboardingAnswers> = {};

  try {
    // Organization info
    if (blueprint.organization) {
      answers.restaurant_name = blueprint.organization.restaurantName;
      answers.restaurant_city = blueprint.organization.city;

      // Map business type to restaurant_type
      const typeMap: Record<
        string,
        "restaurant" | "bar" | "cafe" | "club" | "dark_kitchen"
      > = {
        Restaurant: "restaurant",
        Bar: "bar",
        Cafe: "cafe",
        Club: "club",
        DarkKitchen: "dark_kitchen",
      };
      if (blueprint.organization.businessType) {
        answers.restaurant_type =
          typeMap[blueprint.organization.businessType] || "restaurant";
      }
    }

    // Operation info
    if (blueprint.operation) {
      // Map team size
      const teamSizeMap: Record<string, "solo" | "small" | "medium" | "large"> =
        {
          "1-5": "small",
          "6-15": "medium",
          "15+": "large",
        };
      if (blueprint.operation.teamSize) {
        answers.team_size =
          teamSizeMap[blueprint.operation.teamSize] || "small";
      }
    }

    // Identity info
    if (blueprint.identity) {
      answers.public_name = blueprint.identity.userName;

      const roleMap: Record<string, "owner" | "manager" | "tech"> = {
        Owner: "owner",
        Manager: "manager",
        Technical: "tech",
      };
      if (blueprint.identity.userRole) {
        answers.initial_role = roleMap[blueprint.identity.userRole] || "owner";
      }
    }

    // Workflow info
    if (blueprint.systemProfiles?.workflowProfile) {
      answers.has_tables =
        blueprint.systemProfiles.workflowProfile.enableTableService !== false;
    }
  } catch (e) {
    console.warn("[extractAnswersFromBlueprint] Error:", e);
  }

  return answers;
}

// ═══════════════════════════════════════════════════════════════
// STANDALONE FUNCTIONS (for non-hook usage)
// ═══════════════════════════════════════════════════════════════

/**
 * Get recommendations without React hook (for server-side or non-component usage)
 */
export function getRecommendationsFromStorage(): ActivationRecommendation[] {
  try {
    const stored = getTabIsolated(ONBOARDING_ANSWERS_KEY);
    if (!stored) return [];

    const answers = JSON.parse(stored);
    return ActivationAdvisor.getActivationRecommendations({
      answers,
      blueprint: null,
      systemState: null,
    });
  } catch {
    return [];
  }
}

export default useActivationAdvisor;
