/**
 * OnboardingProvider
 *
 * Context provider for managing global onboarding state
 * Handles routing logic: /welcome vs /app based on onboarding status
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOnboardingState } from "../infra/clients/OnboardingClient";
import type { OnboardingStateResponse } from "../infra/clients/OnboardingClient";

interface OnboardingContextType {
  state: OnboardingStateResponse | null;
  isLoading: boolean;
  isOnboarding: boolean;
  refreshState: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext must be used within OnboardingProvider",
    );
  }
  return context;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
  autoRouteOnboardingUsers?: boolean;
}

export function OnboardingProvider({
  children,
  autoRouteOnboardingUsers = true,
}: OnboardingProviderProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshState = async () => {
    try {
      const result = await getOnboardingState();
      setState(result);
    } catch (error) {
      console.error("Failed to fetch onboarding state:", error);
    }
  };

  // Load onboarding state on mount
  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true);
      try {
        await refreshState();
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  // Auto-route incomplete onboarding users to /welcome
  useEffect(() => {
    if (!isLoading && autoRouteOnboardingUsers) {
      const currentPath = window.location.pathname;

      if (
        state &&
        !state.is_complete &&
        !currentPath.startsWith("/onboarding")
      ) {
        // Onboarding in progress, redirect to onboarding screens
        navigate("/onboarding", { replace: true });
      }
    }
  }, [state, isLoading, navigate, autoRouteOnboardingUsers]);

  const value: OnboardingContextType = {
    state,
    isLoading,
    isOnboarding: !!state && !state.is_complete,
    refreshState,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
