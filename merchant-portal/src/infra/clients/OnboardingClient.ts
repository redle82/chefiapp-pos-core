/**
 * Onboarding Client
 *
 * Integration layer between frontend UI and backend onboarding state machine.
 * Calls RPC functions: create_onboarding_context, update_onboarding_step, get_onboarding_state
 *
 * Responsibilities:
 * 1. Initialize onboarding when user creates new restaurant
 * 2. Track progress through 9 screens
 * 3. Persist data to backend after each screen
 * 4. Auto-complete onboarding and redirect on success
 */

import { getCoreClient } from "../../core/db";

export interface OnboardingContextResponse {
  org_id: string;
  restaurant_id: string;
  onboarding_id: string;
  status: string;
}

export interface OnboardingStateResponse {
  onboarding_id: string;
  restaurant_id: string;
  org_id: string;
  current_step: string;
  restaurant_name: string;
  restaurant_status: string;
  progress_percent: number;
  is_complete: boolean;
}

export interface OnboardingStepUpdateResponse {
  current_step: string;
  restaurant_id: string;
  status: string;
}

/**
 * Create onboarding context for new restaurant
 * Called when user clicks "Create Restaurant" on welcome screen
 */
export async function createOnboardingContext(
  restaurantName: string,
): Promise<OnboardingContextResponse> {
  const client = getCoreClient();
  const { data, error } = await client.rpc(
    "create_onboarding_context",
    { p_restaurant_name: restaurantName },
  );

  if (error) {
    console.error("Failed to create onboarding context:", error);
    throw new Error(`Onboarding initialization failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No onboarding context returned");
  }

  const result = data[0] as OnboardingContextResponse;

  // Store IDs in session for quick access
  if (typeof window !== "undefined") {
    sessionStorage.setItem("chefiapp_onboarding_id", result.onboarding_id);
    sessionStorage.setItem("chefiapp_org_id", result.org_id);
    sessionStorage.setItem("chefiapp_restaurant_id", result.restaurant_id);
    localStorage.setItem("chefiapp_restaurant_id", result.restaurant_id);
  }

  return result;
}

/**
 * Get current onboarding state for logged-in user
 * Used to determine which screen to show on page load
 */
export async function getOnboardingState(): Promise<OnboardingStateResponse | null> {
  const client = getCoreClient();
  const { data, error } = await client.rpc("get_onboarding_state");

  if (error) {
    // Non-fatal: user might not have onboarding in progress
    console.warn("Failed to fetch onboarding state:", error);
    return null;
  }

  if (!data || data.length === 0) {
    // No active onboarding
    return null;
  }

  return data[0] as OnboardingStateResponse;
}

/**
 * Update onboarding step after user completes a screen
 * Atomically moves state machine forward and stores screen data
 */
export async function updateOnboardingStep(
  onboardingId: string,
  nextStep: string,
  data: Record<string, any> = {},
): Promise<OnboardingStepUpdateResponse> {
  const client = getCoreClient();
  const { data: response, error } = await client.rpc(
    "update_onboarding_step",
    {
      p_onboarding_id: onboardingId,
      p_next_step: nextStep,
      p_data: data,
    },
  );

  if (error) {
    console.error(`Failed to update onboarding step to ${nextStep}:`, error);
    throw new Error(`Step update failed: ${error.message}`);
  }

  if (!response || response.length === 0) {
    throw new Error("No response from step update");
  }

  const result = response[0] as OnboardingStepUpdateResponse;

  // If completed, clear storage
  if (nextStep === "complete") {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("chefiapp_onboarding_id");
      sessionStorage.removeItem("chefiapp_org_id");
    }
  }

  return result;
}

/**
 * Helper: Persist current screen data and move to next step
 * Called at end of each onboarding screen
 */
export async function completeOnboardingScreen(
  onboardingId: string,
  stepName: string,
  screenData: Record<string, any>,
): Promise<void> {
  try {
    await updateOnboardingStep(onboardingId, stepName, screenData);
  } catch (error) {
    console.error(`Screen '${stepName}' completion failed:`, error);
    throw error;
  }
}

/**
 * Helper: Determine next URL after onboarding completion
 */
export function getPostOnboardingRedirectUrl(): string {
  // After step 'complete', user should go to activation center or dashboard
  return "/app/staff/home";
}

/**
 * Helper: Check if user should see onboarding vs app
 */
export function shouldShowOnboarding(
  state: OnboardingStateResponse | null,
): boolean {
  return state !== null && !state.is_complete;
}
