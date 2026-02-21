/**
 * Staff Incident Service — Incident Playbook: Dispositivo roubado
 * Chamadas aos RPCs admin_disable_staff_member e admin_reenable_staff_member.
 * Audit trail é gravado em app_logs pelo backend.
 */

import { invokeRpc } from "../infra/coreRpc";

export interface DisableResult {
  ok: boolean;
  error?:
    | "FORBIDDEN"
    | "CANNOT_DISABLE_SELF"
    | "TARGET_NOT_MEMBER"
    | "MANAGER_CANNOT_DISABLE_OWNER_OR_MANAGER"
    | "CANNOT_DISABLE_LAST_OWNER";
  updated?: boolean;
}

export interface ReenableResult {
  ok: boolean;
  error?: "FORBIDDEN";
  updated?: boolean;
}

/**
 * Desativa um membro do restaurante (kill switch — dispositivo roubado).
 * Apenas owner/manager. Registra evento em app_logs (action: user_disabled).
 */
export async function disableStaffMember(
  targetUserId: string,
  restaurantId: string,
  reason?: string,
): Promise<DisableResult> {
  const { data, error } = await invokeRpc<DisableResult>("admin_disable_staff_member", {
    p_target_user_id: targetUserId,
    p_restaurant_id: restaurantId,
    p_reason: reason ?? "",
  });
  if (error) return { ok: false, error: "FORBIDDEN" };
  const result = data as DisableResult | null;
  return result ?? { ok: false };
}

/**
 * Reativa um membro após recuperação (reset de senha / novo login).
 * Apenas owner/manager. Registra evento em app_logs (action: user_reenabled).
 */
export async function reenableStaffMember(
  targetUserId: string,
  restaurantId: string,
  reason?: string,
): Promise<ReenableResult> {
  const { data, error } = await invokeRpc<ReenableResult>("admin_reenable_staff_member", {
    p_target_user_id: targetUserId,
    p_restaurant_id: restaurantId,
    p_reason: reason ?? "",
  });
  if (error) return { ok: false, error: "FORBIDDEN" };
  const result = data as ReenableResult | null;
  return result ?? { ok: false };
}
