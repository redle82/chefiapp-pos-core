/**
 * CoreWebContract — Validador dos 4 Cores
 * 
 * Este é o único ficheiro que tem permissão para validar
 * se o sistema de 4 cores está a ser respeitado.
 * 
 * Qualquer violação aqui é um BUG DE ARQUITETURA, não um bug de código.
 */

import { PAGE_CONTRACTS, validatePageContract } from './PageContracts'
import type { WebCoreState } from './WebCoreState'

/**
 * Relatório de validação dos 4 cores
 */
export type CoreValidationReport = {
  valid: boolean
  violations: CoreViolation[]
  warnings: string[]
  summary: {
    totalPages: number
    validPages: number
    violatedPages: number
  }
}

export type CoreViolation = {
  core: 1 | 2 | 3 | 4
  coreName: 'Ontológico' | 'Capacidades' | 'Psicológico' | 'Contratos Web'
  severity: 'error' | 'warning'
  page?: string
  rule: string
  message: string
  fix?: string
}

/**
 * Valida se os 4 cores estão consistentes entre si.
 * Esta é a função que o gate audit:web-e2e deve chamar.
 */
export function validateFourCores(core: WebCoreState): CoreValidationReport {
  const violations: CoreViolation[] = []
  const warnings: string[] = []

  // ========================================
  // CORE 1: Ontológico
  // ========================================
  
  // Regra 1.1: Identidade é pré-requisito de tudo
  if (core.entity.menuDefined && !core.entity.identityConfirmed) {
    violations.push({
      core: 1,
      coreName: 'Ontológico',
      severity: 'error',
      rule: 'Identity precedes menu',
      message: 'Menu cannot be defined before identity is confirmed',
      fix: 'Set identityConfirmed = true before menuDefined = true',
    })
  }

  // Regra 1.2: Pagamentos requerem menu
  if (core.entity.paymentConfigured && !core.entity.menuDefined) {
    violations.push({
      core: 1,
      coreName: 'Ontológico',
      severity: 'error',
      rule: 'Menu precedes payments',
      message: 'Payment cannot be configured before menu is defined',
      fix: 'Set menuDefined = true before paymentConfigured = true',
    })
  }

  // Regra 1.3: Published requer tudo
  if (core.entity.published && !core.entity.paymentConfigured) {
    violations.push({
      core: 1,
      coreName: 'Ontológico',
      severity: 'error',
      rule: 'Complete setup before publish',
      message: 'Cannot publish without payment configured',
      fix: 'Set paymentConfigured = true before published = true',
    })
  }

  // ========================================
  // CORE 2: Capacidades
  // ========================================

  // Regra 2.1: canPreview requer identityConfirmed
  if (core.capabilities.canPreview && !core.entity.identityConfirmed) {
    violations.push({
      core: 2,
      coreName: 'Capacidades',
      severity: 'error',
      rule: 'Preview requires identity',
      message: 'canPreview = true but identityConfirmed = false',
      fix: 'Set identityConfirmed = true before allowing preview',
    })
  }

  // Regra 2.2: canUseTPV requer published + menu (payments opcional)
  if (core.capabilities.canUseTPV) {
    if (!core.entity.published) {
      violations.push({
        core: 2,
        coreName: 'Capacidades',
        severity: 'error',
        rule: 'TPV requires published',
        message: 'canUseTPV = true but published = false',
        fix: 'Set published = true before allowing TPV',
      })
    }
    if (!core.entity.menuDefined) {
      violations.push({
        core: 2,
        coreName: 'Capacidades',
        severity: 'error',
        rule: 'TPV requires menu',
        message: 'canUseTPV = true but menuDefined = false',
        fix: 'Set menuDefined = true before allowing TPV',
      })
    }
    // payments não é obrigatório para TPV (cash/offline OK)
  }

  // Regra 2.3: canReceiveOrders requer published + menu + payments
  if (core.capabilities.canReceiveOrders && !core.entity.published) {
    violations.push({
      core: 2,
      coreName: 'Capacidades',
      severity: 'error',
      rule: 'Orders require published',
      message: 'canReceiveOrders = true but published = false',
      fix: 'Set published = true before allowing orders',
    })
  }

  // ========================================
  // CORE 3: Psicológico
  // ========================================

  // Regra 3.1: previewState 'ghost' requer identityConfirmed
  if (core.previewState === 'ghost' && !core.entity.identityConfirmed) {
    violations.push({
      core: 3,
      coreName: 'Psicológico',
      severity: 'error',
      rule: 'Ghost requires identity',
      message: 'previewState = ghost but identityConfirmed = false',
      fix: 'Set identityConfirmed = true or use previewState = none',
    })
  }

  // Regra 3.2: previewState 'live' requer published
  if (core.previewState === 'live' && !core.entity.published) {
    violations.push({
      core: 3,
      coreName: 'Psicológico',
      severity: 'error',
      rule: 'Live requires published',
      message: 'previewState = live but published = false',
      fix: 'Set published = true or use previewState = ghost',
    })
  }

  // Regra 3.3: truth.urlExists requer published
  if (core.truth.urlExists && !core.entity.published) {
    violations.push({
      core: 3,
      coreName: 'Psicológico',
      severity: 'error',
      rule: 'URL exists requires published',
      message: 'urlExists = true but published = false',
      fix: 'Set published = true or urlExists = false',
    })
  }

  // Regra 3.4: truth.previewIsReal requer published + identity + menu
  if (core.truth.previewIsReal) {
    if (!core.entity.published) {
      violations.push({
        core: 3,
        coreName: 'Psicológico',
        severity: 'error',
        rule: 'Real preview requires published',
        message: 'previewIsReal = true but published = false',
      })
    }
    if (!core.entity.identityConfirmed) {
      violations.push({
        core: 3,
        coreName: 'Psicológico',
        severity: 'error',
        rule: 'Real preview requires identity',
        message: 'previewIsReal = true but identityConfirmed = false',
      })
    }
    if (!core.entity.menuDefined) {
      violations.push({
        core: 3,
        coreName: 'Psicológico',
        severity: 'error',
        rule: 'Real preview requires menu',
        message: 'previewIsReal = true but menuDefined = false',
      })
    }
  }

  // ========================================
  // CORE 4: Contratos Web
  // ========================================

  // Regra 4.1: Todas as páginas respeitam seus contratos
  let validPages = 0
  let violatedPages = 0

  for (const [path] of Object.entries(PAGE_CONTRACTS)) {
    const validation = validatePageContract(path, core)
    
    if (!validation.allowed) {
      violations.push({
        core: 4,
        coreName: 'Contratos Web',
        severity: 'error',
        page: path,
        rule: 'Page contract violated',
        message: validation.reason || 'Unknown violation',
        fix: validation.fallback ? `Redirect to ${validation.fallback}` : undefined,
      })
      violatedPages++
    } else {
      validPages++
    }
  }

  // Warnings (não bloqueiam, mas merecem atenção)
  
  // Warning 1: Backend health não está a ser monitorizado em tempo real
  if (core.truth.backendIsLive === false) {
    warnings.push('Backend is down or health check failed.')
  }

  // Warning 2: Microprogress não está a ser usado
  if (!('microprogress' in core)) {
    warnings.push('Microprogress (8 steps) not implemented in WebCoreState yet.')
  }

  return {
    valid: violations.length === 0,
    violations,
    warnings,
    summary: {
      totalPages: Object.keys(PAGE_CONTRACTS).length,
      validPages,
      violatedPages,
    },
  }
}

/**
 * Formata o relatório para output legível (gate ou CLI)
 */
export function formatValidationReport(report: CoreValidationReport): string {
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('  CORE VALIDATION REPORT — Sistema de 4 Cores')
  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('')

  if (report.valid) {
    lines.push('✅ TODOS OS 4 CORES ESTÃO CONSISTENTES')
    lines.push('')
    lines.push(`   Pages validated: ${report.summary.totalPages}`)
    lines.push(`   All contracts respected: ${report.summary.validPages}`)
  } else {
    lines.push('❌ VIOLAÇÕES DETECTADAS NOS CORES')
    lines.push('')
    lines.push(`   Total violations: ${report.violations.length}`)
    lines.push(`   Valid pages: ${report.summary.validPages}/${report.summary.totalPages}`)
    lines.push(`   Violated pages: ${report.summary.violatedPages}`)
    lines.push('')

    // Group by core
    for (let coreNum = 1; coreNum <= 4; coreNum++) {
      const coreViolations = report.violations.filter(v => v.core === coreNum)
      if (coreViolations.length === 0) continue

      const coreName = coreViolations[0].coreName
      lines.push(`───────────────────────────────────────────────────────────`)
      lines.push(`  CORE ${coreNum}: ${coreName}`)
      lines.push(`───────────────────────────────────────────────────────────`)

      for (const v of coreViolations) {
        lines.push(`  ${v.severity === 'error' ? '❌' : '⚠️'} ${v.rule}`)
        if (v.page) lines.push(`     Page: ${v.page}`)
        lines.push(`     ${v.message}`)
        if (v.fix) lines.push(`     Fix: ${v.fix}`)
        lines.push('')
      }
    }
  }

  if (report.warnings.length > 0) {
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('  WARNINGS (não bloqueiam)')
    lines.push('───────────────────────────────────────────────────────────')
    for (const warning of report.warnings) {
      lines.push(`  ⚠️  ${warning}`)
    }
    lines.push('')
  }

  lines.push('═══════════════════════════════════════════════════════════')

  return lines.join('\n')
}

/**
 * Protege contra criação de um 5º core.
 * Esta função deve ser chamada em code review automatizado.
 */
export function detectFifthCoreAttempt(code: string): { detected: boolean; reason?: string } {
  // Padrões suspeitos de criação de novo core
  const suspiciousPatterns = [
    /const\s+\w*[Cc]ore\w*\s*=\s*{/,  // const myCore = {
    /createContext<\w*[Cc]ore\w*>/,    // createContext<MyCore>
    /localStorage\.getItem\(/,          // inferência directa
    /new\s+\w*State\w*Manager/,        // novo state manager
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(code)) {
      return {
        detected: true,
        reason: `Detected pattern: ${pattern.source}. This may be an attempt to create a 5th core.`,
      }
    }
  }

  return { detected: false }
}
