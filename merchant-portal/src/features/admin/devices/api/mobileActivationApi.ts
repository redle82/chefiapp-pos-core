import { CONFIG } from "../../../../config";

export interface ActivationRequestPayload {
  restaurantId: string;
  requestedRole: string;
  staffMemberId: string;
  label: string;
  pinPolicy: {
    mode: "server_generated";
    length: number;
  };
  ttlSeconds: number;
}

export interface ActivationRequestResponse {
  activationRequestId: string;
  status: "pending" | "consumed" | "revoked" | "expired";
  expiresAt: string;
  pinDelivery: {
    mode: "show_once_in_admin";
    pin: string;
  };
  qr: {
    format: "url";
    value: string;
  };
}

export interface ActivationRequestStatusResponse {
  activationRequestId: string;
  status: "pending" | "consumed" | "revoked" | "expired";
  expiresAt: string;
  consumedAt?: string | null;
  revokedAt?: string | null;
  revokedReason?: string | null;
}

function ensureApiBase(): string {
  const apiBase = (CONFIG.API_BASE || "").trim();
  if (!apiBase) {
    throw new Error("VITE_API_BASE is required for activation endpoints");
  }
  return apiBase.replace(/\/+$/, "");
}

function adminHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-internal-token": CONFIG.INTERNAL_API_TOKEN,
  };
}

export async function createMobileActivationRequest(
  payload: ActivationRequestPayload,
): Promise<ActivationRequestResponse> {
  const response = await fetch(
    `${ensureApiBase()}/mobile/activation-requests`,
    {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || "Failed to create activation request",
    );
  }

  return result as ActivationRequestResponse;
}

export async function getMobileActivationRequestStatus(
  activationRequestId: string,
): Promise<ActivationRequestStatusResponse> {
  const response = await fetch(
    `${ensureApiBase()}/mobile/activation-requests/${activationRequestId}`,
    {
      method: "GET",
      headers: adminHeaders(),
    },
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || "Failed to read activation request",
    );
  }

  return result as ActivationRequestStatusResponse;
}

export async function revokeMobileActivationRequest(
  activationRequestId: string,
  reason: string,
): Promise<void> {
  const response = await fetch(
    `${ensureApiBase()}/mobile/activation-requests/${activationRequestId}/revoke`,
    {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ reason }),
    },
  );

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(
      result?.message || result?.error || "Failed to revoke activation request",
    );
  }
}
