/**
 * Sistema de papéis — exports
 */

export {
  RoleProvider,
  useRole,
  useRoleOptional,
  type RoleContextValue,
  type RoleProviderProps,
} from "./RoleContext";
export { RoleGate } from "./RoleGate";
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
