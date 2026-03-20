/**
 * OnboardingService -- Frontend service layer for restaurant onboarding.
 *
 * Abstracts the two paths for creating a restaurant:
 *   1. Vercel API endpoint (POST /api/onboarding/create-restaurant) -- preferred
 *   2. Supabase RPC fallback (create_onboarding_context) -- for Docker Core
 *
 * After creation, stores restaurantId in localStorage/sessionStorage
 * so the app can immediately operate in restaurant context.
 */

import { CONFIG } from "../../config";
import { getCoreSessionAsync } from "../auth/getCoreSession";
import type { CountryConfig } from "../config/CountryConfig";
import { getCountryConfig } from "../config/CountryConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateRestaurantData {
  name: string;
  country: string;
  restaurantType: string;
  taxId?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  logoUrl?: string;
}

export interface CreateRestaurantResult {
  restaurantId: string;
  orgId: string;
  onboardingId: string;
  restaurantName: string;
}

export interface OnboardingStatus {
  hasRestaurant: boolean;
  restaurantId: string | null;
  isOnboardingComplete: boolean;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  restaurantId: "chefiapp_restaurant_id",
  orgId: "chefiapp_org_id",
  onboardingId: "chefiapp_onboarding_id",
  onboardingComplete: "chefiapp_onboarding_complete",
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiBaseUrl(): string {
  // In production, Vercel API routes are at the same origin
  // In dev, the Vite dev server proxies /api to Vercel
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getCoreSessionAsync();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

/**
 * Create a restaurant via the Vercel API endpoint.
 * Falls back to Supabase RPC if API is unavailable.
 */
export async function createRestaurant(
  data: CreateRestaurantData,
): Promise<CreateRestaurantResult> {
  const countryConfig = getCountryConfig(data.country);
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Sessao expirada. Faz login novamente.");
  }

  // Try Vercel API first (service_role backed, most reliable)
  try {
    const result = await createViaApi(data, countryConfig, token);
    persistOnboardingIds(result);
    return result;
  } catch (apiError) {
    console.warn("[OnboardingService] API endpoint failed, trying RPC fallback:", apiError);
  }

  // Fallback: Supabase RPC (SECURITY DEFINER)
  const result = await createViaRpc(data.name);
  persistOnboardingIds(result);
  return result;
}

/**
 * Create restaurant via Vercel API endpoint.
 */
async function createViaApi(
  data: CreateRestaurantData,
  countryConfig: CountryConfig,
  token: string,
): Promise<CreateRestaurantResult> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/onboarding/create-restaurant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: data.name,
      country: data.country,
      timezone: countryConfig.timezone,
      currency: countryConfig.currency,
      locale: countryConfig.locale,
      taxId: data.taxId,
      phone: data.phone,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      logoUrl: data.logoUrl,
      restaurantType: data.restaurantType,
      defaultTaxRateBps: countryConfig.vatRates[0]
        ? countryConfig.vatRates[0] * 100
        : 2300,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Unknown error" }));

    // If user already has a restaurant, return that info
    if (response.status === 409 && body.restaurantId) {
      return {
        restaurantId: body.restaurantId,
        orgId: "",
        onboardingId: "",
        restaurantName: data.name,
      };
    }

    throw new Error(body.error || `API error ${response.status}`);
  }

  return await response.json();
}

/**
 * Fallback: Create restaurant via Supabase RPC (SECURITY DEFINER).
 */
async function createViaRpc(
  restaurantName: string,
): Promise<CreateRestaurantResult> {
  // Dynamic import to avoid circular deps
  const { createOnboardingContext } = await import(
    "../../infra/clients/OnboardingClient"
  );
  const ctx = await createOnboardingContext(restaurantName);
  return {
    restaurantId: ctx.restaurant_id,
    orgId: ctx.org_id,
    onboardingId: ctx.onboarding_id,
    restaurantName: restaurantName,
  };
}

/**
 * Persist restaurant IDs for immediate use across the app.
 */
function persistOnboardingIds(result: CreateRestaurantResult): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.restaurantId, result.restaurantId);
    sessionStorage.setItem(STORAGE_KEYS.restaurantId, result.restaurantId);
    sessionStorage.setItem(STORAGE_KEYS.orgId, result.orgId);
    if (result.onboardingId) {
      sessionStorage.setItem(STORAGE_KEYS.onboardingId, result.onboardingId);
    }
  } catch {
    // Storage may be blocked in private browsing
  }
}

/**
 * Check if the current user already has a restaurant.
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const token = await getAccessToken();
  if (!token) {
    return { hasRestaurant: false, restaurantId: null, isOnboardingComplete: false };
  }

  // Check localStorage first (fast path)
  try {
    const storedId = localStorage.getItem(STORAGE_KEYS.restaurantId);
    const storedComplete = localStorage.getItem(STORAGE_KEYS.onboardingComplete);
    if (storedId) {
      return {
        hasRestaurant: true,
        restaurantId: storedId,
        isOnboardingComplete: storedComplete === "true",
      };
    }
  } catch {
    // ignore
  }

  // Check via RPC
  try {
    const { getOnboardingState } = await import(
      "../../infra/clients/OnboardingClient"
    );
    const state = await getOnboardingState();
    if (state) {
      // Persist for next time
      try {
        localStorage.setItem(STORAGE_KEYS.restaurantId, state.restaurant_id);
        if (state.is_complete) {
          localStorage.setItem(STORAGE_KEYS.onboardingComplete, "true");
        }
      } catch {
        // ignore
      }
      return {
        hasRestaurant: true,
        restaurantId: state.restaurant_id,
        isOnboardingComplete: state.is_complete,
      };
    }
  } catch {
    // RPC unavailable
  }

  return { hasRestaurant: false, restaurantId: null, isOnboardingComplete: false };
}

/**
 * Mark onboarding as complete. Updates localStorage and navigates context.
 */
export function completeOnboarding(restaurantId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.restaurantId, restaurantId);
    localStorage.setItem(STORAGE_KEYS.onboardingComplete, "true");
    sessionStorage.removeItem(STORAGE_KEYS.onboardingId);
    sessionStorage.removeItem(STORAGE_KEYS.orgId);
  } catch {
    // ignore
  }
}

/**
 * Clear all onboarding storage (e.g. on logout).
 */
export function clearOnboardingStorage(): void {
  if (typeof window === "undefined") return;

  try {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
