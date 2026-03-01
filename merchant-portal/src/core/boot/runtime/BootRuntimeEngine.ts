import type { DeviceType } from "../../runtime/LaunchContext";
import type { BootDestination, BootStep } from "../BootState";
import { BOOT_TIMEOUTS } from "../BootState";

export interface BootRuntimeTimeoutBudget {
  auth: number;
  tenant: number;
  global: number;
}

export function getBootTimeoutBudget(
  isDocker: boolean,
): BootRuntimeTimeoutBudget {
  if (isDocker) {
    return {
      auth: BOOT_TIMEOUTS.authDocker,
      tenant: BOOT_TIMEOUTS.tenantDocker,
      global: BOOT_TIMEOUTS.globalDocker,
    };
  }

  return {
    auth: BOOT_TIMEOUTS.auth,
    tenant: BOOT_TIMEOUTS.tenant,
    global: BOOT_TIMEOUTS.global,
  };
}

export function getBootCheckKey(
  userId: string | null | undefined,
  pathname: string,
): string {
  return `${userId ?? "anon"}::${pathname}`;
}

export function shouldNavigateToDecision(
  decision: BootDestination | null | undefined,
  pathname: string,
  search: string,
): decision is BootDestination & { type: "REDIRECT"; to: string } {
  if (!decision || decision.type !== "REDIRECT" || !decision.to) return false;

  const currentPathWithSearch = `${pathname}${search}`;
  if (currentPathWithSearch === decision.to) return false;
  if (pathname === decision.to) return false;

  return true;
}

export function shouldResetPipelineForUserChange(
  previousUserId: string | null | undefined,
  currentUserId: string | null,
): boolean {
  if (previousUserId === undefined) return false;
  return previousUserId !== currentUserId;
}

export function isBootErrorStep(step: BootStep): boolean {
  return (
    step === "AUTH_TIMEOUT" ||
    step === "TENANT_ERROR" ||
    step === "TENANT_TIMEOUT" ||
    step === "ROUTE_ERROR"
  );
}

export function deriveDeviceType(pathname: string): DeviceType {
  if (pathname.startsWith("/app/staff") || pathname.startsWith("/waiter")) {
    return "staff";
  }
  if (pathname.startsWith("/op/kds") || pathname.startsWith("/app/kds")) {
    return "kds";
  }
  if (
    pathname.startsWith("/op/tpv") ||
    pathname.startsWith("/op/pos") ||
    pathname.startsWith("/app/tpv")
  ) {
    return "pos";
  }
  return "admin";
}
