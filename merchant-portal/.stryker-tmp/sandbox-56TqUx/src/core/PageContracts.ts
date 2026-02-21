/**
 * PageContracts — Contratos Imutáveis de Página
 * 
 * Implementação dos contratos PAGE-001 e PAGE-002 do ContractSystem:
 * - PAGE-001: Page Contract (requires, guarantees, allowedPreviewStates)
 * - PAGE-002: Navigation Contract (validatePageContract)
 * 
 * Cada página declara:
 * - O que precisa existir antes de renderizar
 * - O que garante não fazer
 * - Que estados psicológicos aceita
 * 
 * Se o contrato não pode ser cumprido, a página não renderiza
 * ou renderiza estado neutro (nunca "quase").
 * 
 * ⚠️ HIERARQUIA: Página não pode corrigir erro ontológico.
 * Páginas consultam core, nunca inferem.
 */
// @ts-nocheck


import type { PageRequirement, PageGuarantee } from './ContractSystem'

export type PageContract = {
  /** Requisitos ontológicos (CONTRACT_ENTITY_EXISTS, CONTRACT_MENU_EXISTS, CONTRACT_PUBLISHED_EXISTS) */
  requires?: PageRequirement

  /** Garantias (o que esta página NUNCA faz) */
  guarantees?: PageGuarantee & {
    doesNotPromisePreview?: boolean
    doesNotFetchHealth?: boolean
    doesNotInferState?: boolean
    doesNotCreateTruth?: boolean
  }

  /** Estados psicológicos permitidos (CONTRACT_GHOST_INTEGRITY, CONTRACT_LIVE_INTEGRITY) */
  allowedPreviewStates?: Array<'none' | 'ghost' | 'live'>

  /** Descrição humana do contrato */
  description: string
  
  /** ID do contrato no sistema formal (opcional) */
  contractIds?: string[]
}

/**
 * Contratos de todas as páginas do sistema.
 * Isto é auditável e validável no gate.
 */
export const PAGE_CONTRACTS: Record<string, PageContract> = {
  // ========================================
  // Entry & Onboarding
  // ========================================
  '/app': {
    description: 'Entry point — não promete nada, apenas apresenta caminho',
    contractIds: ['PAGE-001'],
    guarantees: {
      doesNotPromisePreview: true,
      doesNotFetchHealth: true,
      doesNotInferState: true,
    },
    allowedPreviewStates: ['none'],
  },

  '/app/creating': {
    description: 'Animação de criação — não interage com backend',
    guarantees: {
      doesNotPromisePreview: true,
      doesNotFetchHealth: true,
      doesNotCreateTruth: true,
    },
    allowedPreviewStates: ['none'],
  },

  '/app/start': {
    description: 'Redirect para /app (legacy)',
    guarantees: {
      doesNotPromisePreview: true,
    },
    allowedPreviewStates: ['none'],
  },

  // ========================================
  // Wizard Steps
  // ========================================
  '/start/identity': {
    description: 'Step 1 — define identidade, cria verdade ontológica',
    contractIds: ['ONT-001', 'PAGE-001'],
    guarantees: {
      doesNotPromisePreview: true, // preview vem DEPOIS
    },
    allowedPreviewStates: ['none'],
  },

  '/start/slug': {
    description: 'Step 2 — escolhe slug, ainda não publicado',
    requires: {
      identityConfirmed: true,
    },
    guarantees: {
      doesNotPromisePreview: true,
    },
    allowedPreviewStates: ['none'],
  },

  '/start/menu': {
    description: 'Step 3 — define menu, cria verdade sobre produtos',
    contractIds: ['ONT-001', 'ONT-002', 'CAP-001', 'PAGE-001'],
    requires: {
      identityConfirmed: true,
    },
    guarantees: {
      doesNotPromisePreview: true, // preview vem DEPOIS
    },
    allowedPreviewStates: ['none', 'ghost'], // ghost OK após identity
  },

  '/start/payments': {
    description: 'Step 4 — configura pagamentos',
    requires: {
      identityConfirmed: true,
      menuDefined: true,
    },
    allowedPreviewStates: ['ghost'], // menu já existe
  },

  '/start/publish': {
    description: 'Step 5 — publica, cria URL pública',
    requires: {
      identityConfirmed: true,
      menuDefined: true,
      paymentConfigured: true,
    },
    allowedPreviewStates: ['ghost'], // ainda não publicado
  },

  '/start/success': {
    description: 'Step 6 — confirmação, mostra preview LIVE',
    requires: {
      published: true,
    },
    allowedPreviewStates: ['live'], // agora é real
  },

  // ========================================
  // Post-Onboarding
  // ========================================
  '/app/preview': {
    description: 'Preview page — só renderiza se canPreview',
    contractIds: ['CAP-001', 'PSY-001', 'PSY-002', 'PAGE-001'],
    requires: {
      identityConfirmed: true,
    },
    guarantees: {
      doesNotInferState: true, // consulta core.previewState
    },
    allowedPreviewStates: ['ghost', 'live'],
  },

  '/app/tpv-ready': {
    description: 'TPV ready — só se published + menu (payments opcional)',
    contractIds: ['ONT-003', 'CAP-004', 'PAGE-001'],
    requires: {
      published: true,
      menuDefined: true,
    },
    allowedPreviewStates: ['live'],
  },

  '/app/bootstrap': {
    description: 'Bootstrap — carrega estado do backend',
    guarantees: {
      doesNotPromisePreview: true,
    },
    allowedPreviewStates: ['none', 'ghost', 'live'],
  },

  // ========================================
  // Setup (Advanced Editing)
  // ========================================
  '/app/setup/identity': {
    description: 'Advanced identity editing',
    requires: {
      identityConfirmed: true,
    },
    allowedPreviewStates: ['ghost', 'live'],
  },

  '/app/setup/menu': {
    description: 'Advanced menu editing',
    requires: {
      identityConfirmed: true,
      menuDefined: true,
    },
    allowedPreviewStates: ['ghost', 'live'],
  },

  '/app/setup/payments': {
    description: 'Advanced payment editing',
    requires: {
      identityConfirmed: true,
      paymentConfigured: true,
    },
    allowedPreviewStates: ['ghost', 'live'],
  },

  '/app/setup/design': {
    description: 'Design customization',
    requires: {
      identityConfirmed: true,
    },
    allowedPreviewStates: ['ghost', 'live'],
  },

  '/app/setup/publish': {
    description: 'Publish management',
    requires: {
      identityConfirmed: true,
    },
    allowedPreviewStates: ['ghost', 'live'],
  },
}

/**
 * Valida se uma página pode renderizar dado o core atual.
 */
export function validatePageContract(
  path: string,
  core: {
    entity: { identityConfirmed: boolean; menuDefined: boolean; paymentConfigured: boolean; published: boolean }
    previewState: 'none' | 'ghost' | 'live'
  }
): { allowed: boolean; reason?: string; fallback?: string } {
  const contract = PAGE_CONTRACTS[path]
  if (!contract) {
    // Páginas sem contrato são permitidas (opt-in gradual)
    return { allowed: true }
  }

  // Valida requisitos ontológicos
  if (contract.requires) {
    if (contract.requires.identityConfirmed && !core.entity.identityConfirmed) {
      return { allowed: false, reason: 'Identity not confirmed', fallback: '/app' }
    }
    if (contract.requires.menuDefined && !core.entity.menuDefined) {
      return { allowed: false, reason: 'Menu not defined', fallback: '/start/menu' }
    }
    if (contract.requires.paymentConfigured && !core.entity.paymentConfigured) {
      return { allowed: false, reason: 'Payment not configured', fallback: '/start/payments' }
    }
    if (contract.requires.published && !core.entity.published) {
      return { allowed: false, reason: 'Not published yet', fallback: '/start/publish' }
    }
  }

  // Valida estado psicológico
  if (contract.allowedPreviewStates && !contract.allowedPreviewStates.includes(core.previewState)) {
    return {
      allowed: false,
      reason: `Preview state '${core.previewState}' not allowed (expected: ${contract.allowedPreviewStates.join(', ')})`,
    }
  }

  return { allowed: true }
}
