/**
 * useOnboarding Hook
 *
 * React hook for managing onboarding flow across components
 * Integrates with backend state machine via OnboardingClient
 */

import { useCallback, useEffect, useState } from "react";
import {
  createOnboardingContext,
  getOnboardingState,
  updateOnboardingStep,
} from "../infra/clients/OnboardingClient";
import type {
  OnboardingContextResponse,
  OnboardingStateResponse,
} from "../infra/clients/OnboardingClient";

export interface UseOnboardingState {
  // Context
  context: OnboardingContextResponse | null;
  contextLoading: boolean;
  contextError: Error | null;

  // State
  state: OnboardingStateResponse | null;
  stateLoading: boolean;
  stateError: Error | null;

  // Actions
  initializeOnboarding: (
    restaurantName: string,
  ) => Promise<OnboardingContextResponse>;
  refreshState: () => Promise<void>;
  completeStep: (stepName: string, data?: Record<string, any>) => Promise<void>;

  // Helpers
  isOnboarding: boolean;
  currentStep: string | null;
  progressPercent: number;
}

export function useOnboarding(): UseOnboardingState {
  const [context, setContext] = useState<OnboardingContextResponse | null>(
    null,
  );
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<Error | null>(null);

  const [state, setState] = useState<OnboardingStateResponse | null>(null);
  const [stateLoading, setStateLoading] = useState(false);
  const [stateError, setStateError] = useState<Error | null>(null);

  // Load existing onboarding state on mount
  useEffect(() => {
    const loadState = async () => {
      setStateLoading(true);
      setStateError(null);
      try {
        const result = await getOnboardingState();
        setState(result);
      } catch (error) {
        setStateError(
          error instanceof Error ? error : new Error("Unknown error"),
        );
      } finally {
        setStateLoading(false);
      }
    };

    loadState();
  }, []);

  // Initialize new onboarding context
  const initializeOnboarding = useCallback(
    async (restaurantName: string): Promise<OnboardingContextResponse> => {
      setContextLoading(true);
      setContextError(null);
      try {
        const result = await createOnboardingContext(restaurantName);
        setContext(result);

        // After creating context, load the state
        const newState = await getOnboardingState();
        setState(newState);

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        setContextError(err);
        throw err;
      } finally {
        setContextLoading(false);
      }
    },
    [],
  );

  // Refresh current state
  const refreshState = useCallback(async () => {
    setStateLoading(true);
    setStateError(null);
    try {
      const result = await getOnboardingState();
      setState(result);
    } catch (error) {
      setStateError(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    } finally {
      setStateLoading(false);
    }
  }, []);

  // Complete current step and move to next
  const completeStep = useCallback(
    async (stepName: string, data: Record<string, any> = {}) => {
      if (!state) {
        throw new Error("No onboarding in progress");
      }

      try {
        await updateOnboardingStep(state.onboarding_id, stepName, data);
        // Refresh state to get updated progress
        await refreshState();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        setStateError(err);
        throw err;
      }
    },
    [state, refreshState],
  );

  return {
    context,
    contextLoading,
    contextError,
    state,
    stateLoading,
    stateError,
    initializeOnboarding,
    refreshState,
    completeStep,
    isOnboarding: !!state && !state.is_complete,
    currentStep: state?.current_step ?? null,
    progressPercent: state?.progress_percent ?? 0,
  };
}
