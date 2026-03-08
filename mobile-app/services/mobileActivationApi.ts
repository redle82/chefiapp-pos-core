import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export interface MobileActivatePayload {
  activationToken: string;
  pin: string;
  device: {
    platform: "ios" | "android";
    deviceName: string;
    osVersion: string;
    appVersion: string;
    installId: string;
    deviceFingerprint: string;
  };
}

export interface MobileActivateResponse {
  status: "activated";
  restaurantId: string;
  staffMemberId: string;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  principal: {
    roles: string[];
    modulesEnabled: string[];
    permissions: string[];
  };
  bootstrap: {
    featureFlags: {
      deliveryModule: boolean;
      offlineOutbox: boolean;
    };
  };
}

const INSTALL_ID_KEY = "mobile_activation_install_id";
const ACCESS_TOKEN_KEY = "mobile_activation_access_token";
const REFRESH_TOKEN_KEY = "mobile_activation_refresh_token";
const PRINCIPAL_KEY = "mobile_activation_principal";

async function safeSecureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    if (__DEV__) {
      console.warn(
        `[MobileActivation] SecureStore read failed for ${key}`,
        error,
      );
    }
    return null;
  }
}

async function safeSecureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    if (__DEV__) {
      console.warn(
        `[MobileActivation] SecureStore write failed for ${key}`,
        error,
      );
    }
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function resolveGatewayBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_GATEWAY_URL?.trim();
  if (explicit) return normalizeBaseUrl(explicit);

  const coreUrl = process.env.EXPO_PUBLIC_CORE_URL?.trim();
  if (!coreUrl) return "http://localhost:4320";

  try {
    const core = new URL(coreUrl);
    return `${core.protocol}//${core.hostname}:4320`;
  } catch {
    return "http://localhost:4320";
  }
}

export async function getOrCreateInstallId(): Promise<string> {
  const existing = await safeSecureGet(INSTALL_ID_KEY);
  if (existing) return existing;

  const generated = `iid_${cryptoRandomUuid()}`;
  await safeSecureSet(INSTALL_ID_KEY, generated);
  return generated;
}

function cryptoRandomUuid(): string {
  const values = Array.from({ length: 36 }, () =>
    Math.floor(Math.random() * 16),
  );
  values[14] = 4;
  values[19] = (values[19] & 0x3) | 0x8;

  return values
    .map((value, index) => {
      if (index === 8 || index === 13 || index === 18 || index === 23) {
        return "-";
      }
      return value.toString(16);
    })
    .join("");
}

export function simpleHash(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return `dfp_${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

export function buildDeviceFingerprint(input: {
  installId: string;
  appVersion: string;
}): string {
  return simpleHash(`${input.installId}:${Platform.OS}:${input.appVersion}`);
}

export async function activateWithQrPin(input: {
  activationToken: string;
  pin: string;
}): Promise<MobileActivateResponse> {
  const installId = await getOrCreateInstallId();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const deviceName =
    Constants.deviceName ||
    Constants.expoConfig?.name ||
    (Platform.OS === "ios" ? "iPhone" : "Android Device");

  const payload: MobileActivatePayload = {
    activationToken: input.activationToken,
    pin: input.pin,
    device: {
      platform: Platform.OS === "android" ? "android" : "ios",
      deviceName,
      osVersion: String(Platform.Version),
      appVersion,
      installId,
      deviceFingerprint: buildDeviceFingerprint({
        installId,
        appVersion,
      }),
    },
  };

  const response = await fetch(`${resolveGatewayBaseUrl()}/mobile/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = body?.error || "ACTIVATION_FAILED";
    const typedError = new Error(error);
    (typedError as Error & { code?: string; retryAfterSeconds?: number }).code =
      error;
    if (typeof body?.retryAfterSeconds === "number") {
      (
        typedError as Error & { code?: string; retryAfterSeconds?: number }
      ).retryAfterSeconds = body.retryAfterSeconds;
    }
    throw typedError;
  }

  const result = body as MobileActivateResponse;
  await safeSecureSet(ACCESS_TOKEN_KEY, result.session.accessToken);
  await safeSecureSet(REFRESH_TOKEN_KEY, result.session.refreshToken);
  await safeSecureSet(PRINCIPAL_KEY, JSON.stringify(result.principal));

  return result;
}

// ─── Activation state helpers ───────────────────────────────────────

/**
 * Read stored activation session. Returns null if device is not activated.
 */
export async function getActivationSession(): Promise<{
  accessToken: string;
  refreshToken: string | null;
  principal: MobileActivateResponse["principal"] | null;
} | null> {
  const accessToken = await safeSecureGet(ACCESS_TOKEN_KEY);
  if (!accessToken) return null;

  const refreshToken = await safeSecureGet(REFRESH_TOKEN_KEY);
  let principal: MobileActivateResponse["principal"] | null = null;
  const raw = await safeSecureGet(PRINCIPAL_KEY);
  if (raw) {
    try {
      principal = JSON.parse(raw);
    } catch {
      /* corrupted — treat as null */
    }
  }
  return { accessToken, refreshToken, principal };
}

/**
 * Clear all activation tokens (logout / deactivate).
 */
export async function clearActivationSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(PRINCIPAL_KEY).catch(() => {}),
  ]);
}

export type ActivationState =
  | { status: "loading" }
  | { status: "not-activated" }
  | { status: "activated"; accessToken: string };

/**
 * React hook — checks SecureStore once on mount and returns activation state.
 * Use in the root index route to decide where to redirect.
 */
export function useActivationState(): ActivationState {
  const [state, setState] = useState<ActivationState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getActivationSession().then((session) => {
      if (cancelled) return;
      if (session) {
        setState({ status: "activated", accessToken: session.accessToken });
      } else {
        setState({ status: "not-activated" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
