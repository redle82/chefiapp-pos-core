/**
 * Sistema de papéis — exports
 */
// @ts-nocheck


export {
  RoleProvider,
  useRole,
  useRoleOptional,
  type RoleContextValue,
  type RoleProviderProps,
} from "./RoleContext";
export { RoleGate } from "./RoleGate";
export { RoleRoute } from "./RoleRoute";
export { ModuleRoute } from "./ModuleRoute";
export { normalizePath } from "./normalizePath";
export {
  getConfigCopy,
  getDashboardCopy,
  getStaffCopy,
  type ConfigCopy,
  type DashboardCopy,
  type StaffCopy,
} from "./roleCopy";
export {
  canAccessPath,
  getAllowedRolesForPath,
  type UserRole,
} from "./rolePermissions";
