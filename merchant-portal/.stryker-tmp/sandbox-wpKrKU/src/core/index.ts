/**
 * Core — Sistema Imutável de Verdade (4 Cores Fechados)
 * 
 * Este módulo exporta o único source of truth do sistema.
 * Existem exatamente 4 cores. Não mais. Não menos.
 * 
 * Ver CORE_ARCHITECTURE.md para detalhes.
 */

export { WebCoreProvider, useWebCore } from './useWebCore'
export type { WebCoreState } from './WebCoreState'
export { computeWebCoreState, validateStepTransition } from './WebCoreState'
export { PAGE_CONTRACTS, validatePageContract } from './PageContracts'
export type { PageContract } from './PageContracts'
export { validateFourCores, formatValidationReport, detectFifthCoreAttempt } from './CoreWebContract'
export type { CoreValidationReport, CoreViolation } from './CoreWebContract'
