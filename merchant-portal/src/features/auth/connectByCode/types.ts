/**
 * Types for connectByCode — CODE_AND_DEVICE_PAIRING_CONTRACT.
 * Role and resolution always come from contract/invite, never from code text.
 */

import type { OperationalContract, StaffRole } from "../../../pages/AppStaff/context/StaffCoreTypes";

export type RoleSource = "invite" | "contract" | "session" | null;

export interface ConnectByCodeContext {
  deviceId?: string;
  restaurantHint?: string | null;
}

export interface ConnectByCodeResult {
  success: boolean;
  operationalContract?: OperationalContract;
  resolvedRole?: StaffRole;
  roleSource: RoleSource;
  message?: string;
}
