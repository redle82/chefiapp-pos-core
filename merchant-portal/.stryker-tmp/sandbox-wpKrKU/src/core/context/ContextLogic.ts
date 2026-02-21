import type { PulseZone } from "../../../../core-engine/pulse/PulseState";
import type {
  AppContextState,
  DeviceContext,
  ModuleVisibility,
  OperationalMode,
  PermissionSet,
  UserRole,
} from "./ContextTypes";
import { DEFAULT_PERMISSIONS } from "./ContextTypes";

/**
 * Derive OperationalMode from the current PulseZone.
 *
 * FLOW_ALTO (score ≥ 70) → 'rush'  — peak hours, suppress non-urgent, streamline UI
 * FLOW_PARCIAL (30-69)   → 'tower' — normal observation mode
 * FLOW_BASE (< 30)       → 'tower' — calm, full admin capabilities
 *
 * 'training' mode is set explicitly by the user, never by pulse.
 */
export function resolveOperationalMode(
  zone: PulseZone | null,
): OperationalMode {
  if (zone === "FLOW_ALTO") return "rush";
  return "tower";
}

export function resolveContext(
  role: UserRole,
  device: DeviceContext,
  isViewMode: boolean = false,
  originalRole?: UserRole,
  pulseZone?: PulseZone | null,
): AppContextState {
  // 1. Determine Intention based on Role
  let intention = "execute"; // Default
  if (role === "kitchen") intention = "produce";
  if (role === "manager") intention = "coordinate";
  if (role === "owner") intention = "decide";
  if (role === "waiter") intention = "execute";

  // 2. Resolve Permissions
  // In view mode, we use the permissions of the VIEWED role to simulate their experience,
  // BUT we might want to flag that it's read-only in the UI layer.
  // Ideally, permissions reflect what the role CAN do.
  // If Owner views as Waiter, can they fire an order? Ideally NO, or YES but logged as Owner.
  // "Manifesto: If they want to act, they assume ownership action."
  // So permissions should arguably be the VIEWED role's permissions.
  const permissions: PermissionSet = { ...DEFAULT_PERMISSIONS[role] };

  // 3. Resolve Module Visibility
  const visibleModules: ModuleVisibility = {
    orders: false,
    kitchen: false,
    tables: false,
    finance: false,
    settings: false,
    reports: false,
    menu: false,
  };

  switch (role) {
    case "waiter":
      visibleModules.orders = true;
      visibleModules.tables = true;
      break;
    case "kitchen":
      visibleModules.kitchen = true;
      break;
    case "manager":
      visibleModules.orders = true;
      visibleModules.tables = true;
      visibleModules.kitchen = true; // Monitors status
      visibleModules.settings = true; // Operational settings
      break;
    case "owner":
      // Owner sees everything relevant to decision making
      visibleModules.reports = true;
      visibleModules.finance = true;
      visibleModules.settings = true;
      visibleModules.tables = true; // Macro view
      visibleModules.kitchen = true; // Macro view
      break;
  }

  // 4. Resolve Layout
  let uiLayout: AppContextState["uiLayout"] = "management_dashboard";

  if (role === "waiter") uiLayout = "mobile_execution";
  if (role === "kitchen") uiLayout = "kitchen_production";
  if (role === "owner") uiLayout = "owner_control";

  // Override for TPV Central (usually acts as Manager/Owner station or pure POS)
  if (device === "tpv_central" && role === "waiter") {
    // A waiter at the central terminal might just be entering an order
    uiLayout = "mobile_execution"; // Or a specific 'pos_register' layout if we had one
  }

  return {
    role,
    device,
    intention: intention as any,
    permissions,
    visibleModules,
    uiLayout,
    operationalMode: resolveOperationalMode(pulseZone ?? null),
    isViewMode,
    originalRole,
  };
}
