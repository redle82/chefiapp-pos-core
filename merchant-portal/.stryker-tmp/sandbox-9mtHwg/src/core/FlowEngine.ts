/**
 * FLOW ENGINE — Causalidade Formal
 * 
 * Bloco 5 da arquitetura moderna: FLUXOS
 * 
 * ⚠️ CRÍTICO: Fluxo ≠ Navegação
 * 
 * - Fluxo: ordem causal dos acontecimentos (identity antes de menu)
 * - Navegação: movimento entre páginas (pode ir e voltar)
 * 
 * Este sistema valida CAUSALIDADE, não UI.
 */

import type { WebCoreState } from './WebCoreState'

/**
 * Step no fluxo causal
 */
export type FlowStep =
  | 'identity'
  | 'slug'
  | 'menu'
  | 'payments'
  | 'publish'
  | 'tpv-ready'

/**
 * Transição causal entre steps
 */
export type FlowTransition = {
  from: FlowStep
  to: FlowStep
  required: boolean  // se false, pode saltar (e.g., payments opcional)
  reason: string
}

/**
 * Resultado de validação de fluxo
 */
export type FlowValidation = {
  valid: boolean
  currentStep: FlowStep | 'none'
  nextAllowedSteps: FlowStep[]
  blockedSteps: Array<{ step: FlowStep; reason: string }>
  completedSteps: FlowStep[]
  causalityViolations: string[]
}

/**
 * Grafo causal completo (ordem fixa)
 * 
 * Isto não é configurável. É a realidade do produto.
 */
export const CAUSAL_FLOW: FlowTransition[] = [
  {
    from: 'identity',
    to: 'slug',
    required: true,
    reason: 'Identity must exist before slug',
  },
  {
    from: 'slug',
    to: 'menu',
    required: true,
    reason: 'Slug must be defined before menu',
  },
  {
    from: 'menu',
    to: 'payments',
    required: false,  // CRÍTICO: payments opcional
    reason: 'Menu must exist before payments',
  },
  {
    from: 'menu',
    to: 'publish',
    required: true,  // pode saltar payments
    reason: 'Menu must exist before publish',
  },
  {
    from: 'payments',
    to: 'publish',
    required: true,
    reason: 'If payments configured, must complete before publish',
  },
  {
    from: 'publish',
    to: 'tpv-ready',
    required: true,
    reason: 'Must be published before TPV ready',
  },
]

/**
 * Ordem causal estrita (para referência)
 */
export const FLOW_ORDER: FlowStep[] = [
  'identity',
  'slug',
  'menu',
  'payments',  // opcional na prática
  'publish',
  'tpv-ready',
]

/**
 * Mapeia core state para step atual
 */
export function detectCurrentStep(core: WebCoreState): FlowStep | 'none' {
  // TPV ready (final)
  if (core.capabilities.canUseTPV) {
    return 'tpv-ready'
  }

  // Published
  if (core.entity.published) {
    return 'publish'
  }

  // Payments (pode estar incomplete)
  if (core.entity.paymentConfigured) {
    return 'payments'
  }

  // Menu
  if (core.entity.menuDefined) {
    return 'menu'
  }

  // Identity (primeiro step real)
  if (core.entity.identityConfirmed) {
    return 'identity'
  }

  return 'none'
}

/**
 * Lista steps já completados
 */
export function getCompletedSteps(core: WebCoreState): FlowStep[] {
  const completed: FlowStep[] = []

  if (core.entity.identityConfirmed) completed.push('identity')
  if (core.entity.identityConfirmed) completed.push('slug') // assume slug com identity
  if (core.entity.menuDefined) completed.push('menu')
  if (core.entity.paymentConfigured) completed.push('payments')
  if (core.entity.published) completed.push('publish')
  if (core.capabilities.canUseTPV) completed.push('tpv-ready')

  return completed
}

/**
 * Valida se pode avançar para um step (causalidade)
 */
export function canTransitionTo(
  core: WebCoreState,
  targetStep: FlowStep
): { allowed: boolean; reason?: string } {
  const completed = getCompletedSteps(core)

  // Já completado? Pode revisitar
  if (completed.includes(targetStep)) {
    return { allowed: true }
  }

  // Valida pré-requisitos causais
  switch (targetStep) {
    case 'identity':
      return { allowed: true } // sempre permitido

    case 'slug':
      if (!core.entity.identityConfirmed) {
        return { allowed: false, reason: 'Identity required before slug' }
      }
      return { allowed: true }

    case 'menu':
      if (!core.entity.identityConfirmed) {
        return { allowed: false, reason: 'Identity required before menu' }
      }
      return { allowed: true }

    case 'payments':
      if (!core.entity.menuDefined) {
        return { allowed: false, reason: 'Menu required before payments' }
      }
      return { allowed: true }

    case 'publish':
      if (!core.entity.menuDefined) {
        return { allowed: false, reason: 'Menu required before publish' }
      }
      // Payments NÃO é obrigatório aqui
      return { allowed: true }

    case 'tpv-ready':
      if (!core.entity.published) {
        return { allowed: false, reason: 'Must be published before TPV ready' }
      }
      if (!core.entity.menuDefined) {
        return { allowed: false, reason: 'Menu required for TPV' }
      }
      return { allowed: true }

    default:
      return { allowed: true }
  }
}

/**
 * Calcula próximos steps permitidos
 */
export function getNextAllowedSteps(core: WebCoreState): FlowStep[] {
  const allowed: FlowStep[] = []

  // Testa cada step possível
  for (const step of FLOW_ORDER) {
    const validation = canTransitionTo(core, step)
    if (validation.allowed) {
      allowed.push(step)
    }
  }

  return allowed
}

/**
 * Detecta violações de causalidade
 * 
 * Exemplo: menu completado mas identity não → violação
 */
export function detectCausalityViolations(core: WebCoreState): string[] {
  const violations: string[] = []

  // Menu sem identity
  if (core.entity.menuDefined && !core.entity.identityConfirmed) {
    violations.push('Menu exists but identity not confirmed (causality violation)')
  }

  // Published sem menu
  if (core.entity.published && !core.entity.menuDefined) {
    violations.push('Published but menu not defined (causality violation)')
  }

  // TPV sem published
  if (core.capabilities.canUseTPV && !core.entity.published) {
    violations.push('TPV ready but not published (causality violation)')
  }

  // Preview real sem published
  if (core.truth.previewIsReal && !core.entity.published) {
    violations.push('Preview is real but not published (causality violation)')
  }

  return violations
}

/**
 * Valida fluxo completo
 */
export function validateFlow(core: WebCoreState): FlowValidation {
  const _currentStep = detectCurrentStep(core)
  const completedSteps = getCompletedSteps(core)
  const nextAllowed = getNextAllowedSteps(core)
  const violations = detectCausalityViolations(core)

  // Calcula steps bloqueados
  const blockedSteps: Array<{ step: FlowStep; reason: string }> = []

  for (const step of FLOW_ORDER) {
    if (!nextAllowed.includes(step)) {
      const validation = canTransitionTo(core, step)
      if (!validation.allowed && validation.reason) {
        blockedSteps.push({ step, reason: validation.reason })
      }
    }
  }

  return {
    valid: violations.length === 0,
    currentStep: _currentStep,
    nextAllowedSteps: nextAllowed,
    blockedSteps,
    completedSteps,
    causalityViolations: violations,
  }
}

/**
 * Formata relatório de fluxo
 */
export function formatFlowReport(validation: FlowValidation): string {
  let report = '🔄 FLOW VALIDATION\n\n'

  report += `Current Step: ${validation.currentStep}\n`
  report += `Completed: ${validation.completedSteps.join(' → ')}\n\n`

  if (validation.causalityViolations.length > 0) {
    report += '❌ CAUSALITY VIOLATIONS:\n'
    validation.causalityViolations.forEach(v => {
      report += `  - ${v}\n`
    })
    report += '\n'
  }

  if (validation.nextAllowedSteps.length > 0) {
    report += `✅ Next allowed: ${validation.nextAllowedSteps.join(', ')}\n\n`
  }

  if (validation.blockedSteps.length > 0) {
    report += '🚫 Blocked steps:\n'
    validation.blockedSteps.forEach(b => {
      report += `  - ${b.step}: ${b.reason}\n`
    })
    report += '\n'
  }

  report += validation.valid ? '✅ Flow is valid' : '❌ Flow has violations'

  return report
}

/**
 * Valida se um salto é permitido (skip steps)
 * 
 * Exemplo: identity → publish (saltando menu) → NÃO PERMITIDO
 * Exemplo: menu → publish (saltando payments) → PERMITIDO
 */
export function canSkipTo(
  from: FlowStep,
  to: FlowStep,
  core: WebCoreState
): { allowed: boolean; reason?: string } {
  const fromIndex = FLOW_ORDER.indexOf(from)
  const toIndex = FLOW_ORDER.indexOf(to)

  // Não pode voltar atrás (causalidade)
  if (toIndex <= fromIndex) {
    return { allowed: true } // revisitar é OK
  }

  // Valida cada step intermédio
  for (let i = fromIndex + 1; i < toIndex; i++) {
    const intermediateStep = FLOW_ORDER[i]

    // Payments é único step opcional
    if (intermediateStep === 'payments') {
      continue // pode saltar
    }

    // Outros steps são obrigatórios
    const completed = getCompletedSteps(core)
    if (!completed.includes(intermediateStep)) {
      return {
        allowed: false,
        reason: `Cannot skip ${intermediateStep} (required step)`,
      }
    }
  }

  return { allowed: true }
}

/**
 * Calcula % de progresso no fluxo
 */
export function calculateFlowProgress(core: WebCoreState): number {
  const completed = getCompletedSteps(core)
  const total = FLOW_ORDER.length

  return Math.round((completed.length / total) * 100)
}

/**
 * Retorna próximo step obrigatório (se houver)
 */
export function getNextRequiredStep(core: WebCoreState): FlowStep | null {
  const _currentStep = detectCurrentStep(core)
  const currentIndex = _currentStep === 'none' ? -1 : FLOW_ORDER.indexOf(_currentStep)

  // Percorre ordem, ignora payments (opcional)
  for (let i = currentIndex + 1; i < FLOW_ORDER.length; i++) {
    const step = FLOW_ORDER[i]

    // Payments é opcional, pode saltar
    if (step === 'payments') {
      continue
    }

    return step
  }

  return null // flow completo
}

// Determine next step based on causal rules
export function next(_currentStep: string, _state: any): string | null {
  // Mock logic
  return null;
}

// Determine previous step safely
export function back(_currentStep: string): string | null {
  // Mock logic
  return null;
}
