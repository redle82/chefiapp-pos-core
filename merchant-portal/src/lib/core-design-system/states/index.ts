/**
 * Estados visuais definidos pelo CORE_DESIGN_SYSTEM_CONTRACT.
 *
 * Implementação: merchant-portal/src/ui/design-system e mobile-app
 * devem fornecer LoadingState, EmptyState, ErrorState, OfflineState
 * usando tokens de @chefiapp/core-design-system.
 *
 * Estados operacionais obrigatórios: Normal, Loading, Blocked, Warning, Critical, Offline.
 */

export const CONTRACT_STATES = [
  'LoadingState',
  'EmptyState',
  'ErrorState',
  'OfflineState',
] as const;

export type ContractStateName = (typeof CONTRACT_STATES)[number];

export const OPERATIONAL_STATES = [
  'normal',
  'loading',
  'blocked',
  'warning',
  'critical',
  'offline',
  'success',
] as const;

export type OperationalStateName = (typeof OPERATIONAL_STATES)[number];
