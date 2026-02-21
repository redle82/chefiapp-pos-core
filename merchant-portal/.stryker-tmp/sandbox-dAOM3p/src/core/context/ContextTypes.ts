// @ts-nocheck
export type UserRole = "waiter" | "kitchen" | "manager" | "owner";
export type DeviceContext = "mobile" | "tablet" | "desktop" | "tpv_central";
export type UserIntention =
  | "execute"
  | "coordinate"
  | "supervise"
  | "decide"
  | "produce";

export type OperationalMode = "tower" | "rush" | "training";

export interface TurnSession {
  id: string;
  restaurant_id: string;
  user_id: string;
  role_at_turn: string;
  operational_mode: OperationalMode;
  device_id: string;
  device_name?: string;
  started_at: string;
  status: "active" | "closed" | "force_closed";
  permissions_snapshot: PermissionSet;
}

export interface AppContextState {
  // 1. Who
  role: UserRole;
  // 2. Where
  device: DeviceContext;
  // 3. What (Intention)
  intention: UserIntention;

  // Derived State (The Output)
  permissions: PermissionSet;
  visibleModules: ModuleVisibility;
  uiLayout:
    | "mobile_execution"
    | "kitchen_production"
    | "management_dashboard"
    | "owner_control";

  // Operational Context
  currentTurn?: TurnSession;

  // Pulse-derived mode — tower (calm) vs rush (peak) vs training
  operationalMode: OperationalMode;

  // Meta
  isViewMode: boolean; // If true, owner is viewing as another role
  originalRole?: UserRole; // If isViewMode, who are they really?
}

export interface PermissionSet {
  canViewFinancials: boolean;
  canModifyMenu: boolean;
  canmanageStaff: boolean;
  canVoidOrders: boolean;
  canCloseRegister: boolean;
}

export interface ModuleVisibility {
  orders: boolean;
  kitchen: boolean;
  tables: boolean;
  finance: boolean;
  settings: boolean;
  reports: boolean;
  menu: boolean;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, PermissionSet> = {
  waiter: {
    canViewFinancials: false,
    canModifyMenu: false,
    canmanageStaff: false,
    canVoidOrders: false,
    canCloseRegister: false,
  },
  kitchen: {
    canViewFinancials: false,
    canModifyMenu: false,
    canmanageStaff: false,
    canVoidOrders: false,
    canCloseRegister: false,
  },
  manager: {
    canViewFinancials: false, // Managers execute, owners strategy
    canModifyMenu: true,
    canmanageStaff: true,
    canVoidOrders: true,
    canCloseRegister: true,
  },
  owner: {
    canViewFinancials: true,
    canModifyMenu: true,
    canmanageStaff: true,
    canVoidOrders: true,
    canCloseRegister: true,
  },
};
