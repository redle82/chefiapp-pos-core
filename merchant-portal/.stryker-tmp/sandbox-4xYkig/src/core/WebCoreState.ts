/**
 * WebCoreState — Core Ontológico Imutável
 * 
 * Este é o único source of truth para o estado do sistema.
 * Nenhuma página decide o que existe ou o que é possível.
 * As páginas apenas consultam, nunca inferem.
 */

export type WebCoreState = {
  /** Verdades ontológicas sobre a entidade (restaurante) */
  entity: {
    exists: boolean
    identityConfirmed: boolean
    menuDefined: boolean
    paymentConfigured: boolean
    published: boolean
  }

  /** Capacidades reais disponíveis neste momento */
  capabilities: {
    canPreview: boolean
    canReceiveOrders: boolean
    canUseTPV: boolean
    canAccessPublicPage: boolean
  }

  /** Verdades sobre o estado do sistema */
  truth: {
    previewIsReal: boolean      // preview aponta para dados reais, não mock
    backendIsLive: boolean       // backend está acessível e respondendo
    urlExists: boolean           // slug publicado e acessível via URL
  }

  /** Estado psicológico do preview (nunca inferido) */
  previewState: 'none' | 'ghost' | 'live'
}

/**
 * Calcula o WebCoreState a partir do wizard state existente.
 * Esta é a única função que tem permissão para ler o localStorage
 * e transformá-lo em verdade ontológica.
 * 
 * @param wizardState - Estado do wizard (steps)
 * @param health - Estado do backend ('ok' | 'down' | undefined)
 */
export function computeWebCoreState(
  wizardState: any,
  health?: 'ok' | 'down'
): WebCoreState {
  const { steps } = wizardState || {}

  // Verdades sobre a entidade
  const identityConfirmed = steps?.identity?.completed === true
  const menuDefined = steps?.menu?.completed === true
  const paymentConfigured = steps?.payments?.completed === true
  const published = steps?.published === true

  // Verdades derivadas (mas explícitas)
  const exists = identityConfirmed
  const previewIsReal = published && identityConfirmed && menuDefined
  const urlExists = published && identityConfirmed

  // Capacidades (nunca assumidas)
  const canPreview = identityConfirmed
  const canReceiveOrders = published && menuDefined && paymentConfigured
  const canUseTPV = published && menuDefined  // TPV não depende de payments (cash/offline OK)
  const canAccessPublicPage = published && urlExists

  // Estado psicológico do preview
  let previewState: 'none' | 'ghost' | 'live' = 'none'
  if (canPreview) {
    previewState = previewIsReal ? 'live' : 'ghost'
  }

  return {
    entity: {
      exists,
      identityConfirmed,
      menuDefined,
      paymentConfigured,
      published,
    },

    capabilities: {
      canPreview,
      canReceiveOrders,
      canUseTPV,
      canAccessPublicPage,
    },

    truth: {
      previewIsReal,
      backendIsLive: health === 'ok',
      urlExists,
    },

    previewState,
  }
}

/**
 * Valida se o estado atual permite transição para um step.
 * Usado pelo gate de navegação.
 */
export function validateStepTransition(
  core: WebCoreState,
  targetStep: string
): { allowed: boolean; reason?: string } {
  switch (targetStep) {
    case 'identity':
      return { allowed: true } // sempre permitido

    case 'menu':
      if (!core.entity.identityConfirmed) {
        return { allowed: false, reason: 'Identity must be confirmed first' }
      }
      return { allowed: true }

    case 'payments':
      if (!core.entity.menuDefined) {
        return { allowed: false, reason: 'Menu must be defined first' }
      }
      return { allowed: true }

    case 'publish':
      if (!core.entity.paymentConfigured) {
        return { allowed: false, reason: 'Payment must be configured first' }
      }
      return { allowed: true }

    case 'preview':
      if (!core.capabilities.canPreview) {
        return { allowed: false, reason: 'Preview requires confirmed identity' }
      }
      return { allowed: true }

    case 'tpv-ready':
      if (!core.capabilities.canUseTPV) {
        return { allowed: false, reason: 'TPV requires published state with menu' }
      }
      return { allowed: true }

    default:
      return { allowed: true }
  }
}
