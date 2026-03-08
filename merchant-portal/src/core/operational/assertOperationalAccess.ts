export type OperationalModule = "tpv" | "kds" | "appstaff" | "waiter" | "admin";

export type RuntimeType = "electron" | "browser" | "mobile-app" | "unknown";

export interface OperationalAccessParams {
  module: OperationalModule;
  runtime: RuntimeType;
  allowAppStaffInElectron?: boolean;
}

export interface OperationalAccessResult {
  allowed: boolean;
  reason?: "RUNTIME_FORBIDDEN";
  redirectTo?: string;
}

const RUNTIME_MATRIX: Record<OperationalModule, RuntimeType[]> = {
  tpv: ["electron"],
  kds: ["electron"],
  appstaff: ["mobile-app"],
  waiter: ["mobile-app"],
  admin: ["browser", "electron"],
};

export function assertOperationalAccess({
  module,
  runtime,
  allowAppStaffInElectron = false,
}: OperationalAccessParams): OperationalAccessResult {
  if (
    allowAppStaffInElectron &&
    module === "appstaff" &&
    runtime === "electron"
  ) {
    return { allowed: true };
  }

  const allowedRuntimes = RUNTIME_MATRIX[module] ?? [];
  if (allowedRuntimes.includes(runtime)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "RUNTIME_FORBIDDEN",
    redirectTo: runtime === "browser" ? "/admin/devices" : undefined,
  };
}
