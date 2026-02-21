/**
 * Core Health Module
 *
 * TRUTH LOCK: UI nunca antecipa o Core
 *
 * Este modulo garante que o sistema nunca mente sobre disponibilidade.
 */

export {
  useCoreHealth,
  shouldBlockAction,
  getHealthMessage,
} from './useCoreHealth'

export type {
  CoreHealthStatus,
  CoreHealthState,
  UseCoreHealthOptions,
} from './useCoreHealth'

export { coreGating, type GatingResult, type GatingOptions } from './gating'

export {
  useOperationLock,
  useBusyLock,
  isOperationLocked,
} from './useOperationLock'

export type { UseOperationLockOptions } from './useOperationLock'
