/**
 * CONTRACT SYSTEM — 12 Contratos Fechados
 * 
 * Sistema formal de contratos que impede:
 * - Promessas antes da verdade
 * - Contratos implícitos em componentes
 * - Subida na hierarquia (página não corrige ontológico)
 * - Violações de causalidade (menu antes de identity)
 * 
 * Número fechado: 12 contratos, nem mais, nem menos.
 */
// @ts-nocheck


import type { WebCoreState } from './WebCoreState'
import { validateFlow } from './FlowEngine'

/**
 * Família de contratos (hierarquia fixa)
 */
export type ContractFamily =
  | 'ONTOLOGICAL'    // Core 1: O que existe
  | 'CAPABILITY'     // Core 2: O que pode ser feito
  | 'PSYCHOLOGICAL'  // Core 3: O que o utilizador acredita
  | 'PAGE'           // Core 4: O que cada página pode prometer

/**
 * Resultado de validação de contrato
 */
export type ContractValidation = {
  contract: string
  family: ContractFamily
  satisfied: boolean
  reason?: string
  blockedActions?: string[]
}

/**
 * Definição formal de um contrato
 */
export type Contract = {
  id: string
  family: ContractFamily
  name: string
  description: string
  validate: (core: WebCoreState) => ContractValidation
}

// ============================================================================
// FAMÍLIA 1 — CONTRATOS ONTOLÓGICOS (Core 1)
// "O que existe no sistema"
// ============================================================================

export const CONTRACT_ENTITY_EXISTS: Contract = {
  id: 'ONT-001',
  family: 'ONTOLOGICAL',
  name: 'Entity Exists',
  description: 'Requer identityConfirmed para existência do restaurante no sistema',
  validate: (core) => ({
    contract: 'Entity Exists',
    family: 'ONTOLOGICAL',
    satisfied: core.entity.identityConfirmed,
    reason: core.entity.identityConfirmed
      ? undefined
      : 'Identity must be confirmed first',
    blockedActions: core.entity.identityConfirmed
      ? []
      : ['menu', 'payments', 'publish', 'preview', 'tpv']
  })
}

export const CONTRACT_MENU_EXISTS: Contract = {
  id: 'ONT-002',
  family: 'ONTOLOGICAL',
  name: 'Menu Exists',
  description: 'Requer menuDefined para entidade comercial válida',
  validate: (core) => ({
    contract: 'Menu Exists',
    family: 'ONTOLOGICAL',
    satisfied: core.entity.menuDefined,
    reason: core.entity.menuDefined
      ? undefined
      : 'Menu must be defined first',
    blockedActions: core.entity.menuDefined
      ? []
      : ['publish', 'orders', 'tpv']
  })
}

export const CONTRACT_PUBLISHED_EXISTS: Contract = {
  id: 'ONT-003',
  family: 'ONTOLOGICAL',
  name: 'Published Exists',
  description: 'Requer published para entidade pública',
  validate: (core) => ({
    contract: 'Published Exists',
    family: 'ONTOLOGICAL',
    satisfied: core.entity.published,
    reason: core.entity.published
      ? undefined
      : 'Must be published first',
    blockedActions: core.entity.published
      ? []
      : ['url-access', 'iframe', 'real-orders', 'tpv']
  })
}

// ============================================================================
// FAMÍLIA 2 — CONTRATOS DE CAPACIDADES (Core 2)
// "O que pode ser feito agora"
// ============================================================================

export const CONTRACT_CAN_PREVIEW: Contract = {
  id: 'CAP-001',
  family: 'CAPABILITY',
  name: 'Can Preview',
  description: 'Requer identityConfirmed para preview (ghost ou live)',
  validate: (core) => ({
    contract: 'Can Preview',
    family: 'CAPABILITY',
    satisfied: core.capabilities.canPreview,
    reason: core.capabilities.canPreview
      ? undefined
      : 'Preview requires confirmed identity',
    blockedActions: core.capabilities.canPreview
      ? []
      : ['ghost-preview', 'live-preview']
  })
}

export const CONTRACT_CAN_PUBLISH: Contract = {
  id: 'CAP-002',
  family: 'CAPABILITY',
  name: 'Can Publish',
  description: 'Requer identity + menu para publicação (valida fluxo causal)',
  validate: (core) => {
    const canPublish = core.entity.identityConfirmed && core.entity.menuDefined

    // Valida causalidade também
    const flowValidation = validateFlow(core)
    const hasFlowViolations = flowValidation.causalityViolations.length > 0

    return {
      contract: 'Can Publish',
      family: 'CAPABILITY',
      satisfied: canPublish && !hasFlowViolations,
      reason: canPublish
        ? hasFlowViolations
          ? `Flow violations: ${flowValidation.causalityViolations[0]}`
          : undefined
        : 'Publish requires identity and menu',
      blockedActions: canPublish && !hasFlowViolations
        ? []
        : ['publish-button', 'make-public']
    }
  }
}

export const CONTRACT_CAN_RECEIVE_ORDERS: Contract = {
  id: 'CAP-003',
  family: 'CAPABILITY',
  name: 'Can Receive Orders',
  description: 'Requer published + menu para criação de pedidos',
  validate: (core) => ({
    contract: 'Can Receive Orders',
    family: 'CAPABILITY',
    satisfied: core.capabilities.canReceiveOrders,
    reason: core.capabilities.canReceiveOrders
      ? undefined
      : 'Orders require published state with menu and payment',
    blockedActions: core.capabilities.canReceiveOrders
      ? []
      : ['create-order', 'accept-order']
  })
}

export const CONTRACT_CAN_USE_TPV: Contract = {
  id: 'CAP-004',
  family: 'CAPABILITY',
  name: 'Can Use TPV',
  description: 'Requer published + menu (payments opcional — cash/offline OK)',
  validate: (core) => ({
    contract: 'Can Use TPV',
    family: 'CAPABILITY',
    satisfied: core.capabilities.canUseTPV,
    reason: core.capabilities.canUseTPV
      ? undefined
      : 'TPV requires published state with menu',
    blockedActions: core.capabilities.canUseTPV
      ? []
      : ['access-tpv', 'tpv-ready-page']
  })
}

// ============================================================================
// FAMÍLIA 3 — CONTRATOS PSICOLÓGICOS (Core 3)
// "O que o utilizador acredita que está a acontecer"
// ============================================================================

export const CONTRACT_GHOST_INTEGRITY: Contract = {
  id: 'PSY-001',
  family: 'PSYCHOLOGICAL',
  name: 'Ghost Integrity',
  description: 'Requer identityConfirmed para ghost preview coerente',
  validate: (core) => {
    const isGhost = core.previewState === 'ghost'
    const hasIdentity = core.entity.identityConfirmed
    const isValid = !isGhost || (isGhost && hasIdentity)

    return {
      contract: 'Ghost Integrity',
      family: 'PSYCHOLOGICAL',
      satisfied: isValid,
      reason: isValid
        ? undefined
        : 'Ghost preview requires identity',
      blockedActions: isValid
        ? []
        : ['show-ghost-preview']
    }
  }
}

export const CONTRACT_LIVE_INTEGRITY: Contract = {
  id: 'PSY-002',
  family: 'PSYCHOLOGICAL',
  name: 'Live Integrity',
  description: 'Requer published + backendIsLive para iframe real',
  validate: (core) => {
    const isLive = core.previewState === 'live'
    const isPublished = core.entity.published
    const backendUp = core.truth.backendIsLive
    const isValid = !isLive || (isLive && isPublished && backendUp)

    return {
      contract: 'Live Integrity',
      family: 'PSYCHOLOGICAL',
      satisfied: isValid,
      reason: isValid
        ? undefined
        : isLive && !isPublished
          ? 'Live preview requires published state'
          : 'Backend is down, cannot show live preview',
      blockedActions: isValid
        ? []
        : ['show-live-iframe']
    }
  }
}

export const CONTRACT_URL_PROMISE: Contract = {
  id: 'PSY-003',
  family: 'PSYCHOLOGICAL',
  name: 'URL Promise',
  description: 'Requer published para mostrar URL válida',
  validate: (core) => ({
    contract: 'URL Promise',
    family: 'PSYCHOLOGICAL',
    satisfied: !core.truth.urlExists || core.entity.published,
    reason: core.entity.published
      ? undefined
      : 'Cannot show URL before published',
    blockedActions: core.entity.published
      ? []
      : ['show-public-url', 'copy-link']
  })
}

// ============================================================================
// FAMÍLIA 4 — CONTRATOS DE PÁGINA (Core 4)
// "O que cada página pode prometer"
// ============================================================================

/**
 * Requisitos para uma página existir
 */
export type PageRequirement = {
  identityConfirmed?: boolean
  menuDefined?: boolean
  paymentConfigured?: boolean
  published?: boolean
}

/**
 * Garantias que uma página oferece quando renderiza
 */
export type PageGuarantee = {
  showsRealData?: boolean
  allowsNavigation?: boolean
  createsEntities?: boolean
}

/**
 * Contrato de página (usado por PAGE_CONTRACTS)
 */
export type PageContractDef = {
  path: string
  requires: PageRequirement
  guarantees: PageGuarantee
  allowedPreviewStates: Array<'none' | 'ghost' | 'live'>
}

export const CONTRACT_PAGE_CONTRACT: Contract = {
  id: 'PAGE-001',
  family: 'PAGE',
  name: 'Page Contract',
  description: 'Cada página declara requires, guarantees, allowedPreviewStates',
  validate: (_core) => ({
    contract: 'Page Contract',
    family: 'PAGE',
    satisfied: true, // validado por validatePageContract()
    reason: undefined
  })
}

export const CONTRACT_NAVIGATION_CONTRACT: Contract = {
  id: 'PAGE-002',
  family: 'PAGE',
  name: 'Navigation Contract',
  description: 'Navegação bloqueada se fluxo causal violado',
  validate: (core) => {
    const flowValidation = validateFlow(core)

    return {
      contract: 'Navigation Contract',
      family: 'PAGE',
      satisfied: flowValidation.valid,
      reason: flowValidation.valid
        ? undefined
        : `Flow violations: ${flowValidation.causalityViolations.join(', ')}`,
    }
  }
}

// ============================================================================
// SISTEMA COMPLETO (12 CONTRATOS)
// ============================================================================

export const ALL_CONTRACTS: Contract[] = [
  // Ontológicos (3)
  CONTRACT_ENTITY_EXISTS,
  CONTRACT_MENU_EXISTS,
  CONTRACT_PUBLISHED_EXISTS,

  // Capacidades (4)
  CONTRACT_CAN_PREVIEW,
  CONTRACT_CAN_PUBLISH,
  CONTRACT_CAN_RECEIVE_ORDERS,
  CONTRACT_CAN_USE_TPV,

  // Psicológicos (3)
  CONTRACT_GHOST_INTEGRITY,
  CONTRACT_LIVE_INTEGRITY,
  CONTRACT_URL_PROMISE,

  // Página (2)
  CONTRACT_PAGE_CONTRACT,
  CONTRACT_NAVIGATION_CONTRACT,
]

/**
 * Valida todos os 12 contratos
 */
export function validateAllContracts(core: WebCoreState): ContractValidation[] {
  return ALL_CONTRACTS.map(contract => contract.validate(core))
}

/**
 * Verifica se algum contrato foi violado
 */
export function hasContractViolations(validations: ContractValidation[]): boolean {
  return validations.some(v => !v.satisfied)
}

/**
 * Formata relatório de violações
 */
export function formatContractReport(validations: ContractValidation[]): string {
  const violations = validations.filter(v => !v.satisfied)

  if (violations.length === 0) {
    return '✅ All 12 contracts satisfied'
  }

  let report = `❌ ${violations.length} contract violation(s):\n\n`

  violations.forEach(v => {
    report += `[${v.family}] ${v.contract}\n`
    report += `  Reason: ${v.reason}\n`
    if (v.blockedActions && v.blockedActions.length > 0) {
      report += `  Blocked: ${v.blockedActions.join(', ')}\n`
    }
    report += '\n'
  })

  return report
}

/**
 * Detecta contratos implícitos em código (anti-pattern)
 * 
 * Exemplos de contratos implícitos:
 * - if (!published) hideIframe
 * - if (menu.length > 0) showPreview
 * - if (health === 'ok') assume live
 */
export function detectImplicitContract(code: string): string[] {
  const patterns = [
    /if\s*\(\s*!?published\s*\)/g,
    /if\s*\(\s*menu\.length\s*>/g,
    /if\s*\(\s*health\s*===/g,
    /if\s*\(\s*!?identityConfirmed\s*\)/g,
    /if\s*\(\s*!?menuDefined\s*\)/g,
    /wizardState\./g,  // acesso direto a wizardState
    /localStorage\.getItem/g,  // leitura direta
  ]

  const violations: string[] = []

  patterns.forEach((pattern, i) => {
    if (pattern.test(code)) {
      violations.push(`Implicit contract detected: pattern ${i + 1}`)
    }
  })

  return violations
}

/**
 * Valida hierarquia: página não pode "subir"
 * 
 * ❌ Proibido:
 * - Página corrigir erro ontológico
 * - Psicológico criar capacidade
 * - Capacidade declarar existência
 */
export function validateContractHierarchy(
  sourceFamily: ContractFamily,
  targetFamily: ContractFamily
): { valid: boolean; reason?: string } {
  const hierarchy: ContractFamily[] = [
    'ONTOLOGICAL',
    'CAPABILITY',
    'PSYCHOLOGICAL',
    'PAGE'
  ]

  const sourceLevel = hierarchy.indexOf(sourceFamily)
  const targetLevel = hierarchy.indexOf(targetFamily)

  if (targetLevel < sourceLevel) {
    return {
      valid: false,
      reason: `${sourceFamily} cannot fix ${targetFamily} (hierarchy violation)`
    }
  }

  return { valid: true }
}
