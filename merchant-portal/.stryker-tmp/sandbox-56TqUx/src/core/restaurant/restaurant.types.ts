/**
 * Restaurant — Config-First, Incompleto por Design
 *
 * Fundação técnica única para:
 * - DB / contratos de Core
 * - TypeScript no frontend
 * - Guards de readiness
 *
 * Lei imutável:
 * O restaurante não “termina onboarding”; ele apenas muda de estado.
 *
 * Um restaurante nasce incompleto e torna-se operacional por estado, não por fluxo.
 * Não existem flags mágicas de onboarding (onboardingCompleted, setupStep, firstLogin, etc.).
 */
// @ts-nocheck


export type ReadinessStatus = "INCOMPLETE" | "READY";

/**
 * Bloco de Identidade
 *
 * 🔴 INCOMPLETE se:
 *   - name ausente
 *
 * 🟢 READY se:
 *   - name preenchido
 *
 * Não exigimos nome legal, email ou telefone aqui.
 */
export interface IdentityConfig {
  status: ReadinessStatus;
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
}

/**
 * Bloco de Local & Moeda
 *
 * 🔴 INCOMPLETE se:
 *   - country ausente OU currency ausente
 *
 * 🟢 READY se:
 *   - country e currency presentes
 *
 * Timezone é recomendável, mas não bloqueante.
 */
export interface LocalConfig {
  status: ReadinessStatus;
  country?: string;
  currency?: string;
  timezone?: string;
}

/**
 * Bloco de Cardápio
 *
 * 🔴 INCOMPLETE se:
 *   - hasItems === false
 *
 * 🟢 READY se:
 *   - hasItems === true
 *
 * Não interessa quantidade de itens nem categorias neste nível.
 */
export interface MenuConfig {
  status: ReadinessStatus;
  hasItems: boolean;
}

/**
 * Bloco de Publicação
 *
 * 🔴 INCOMPLETE se:
 *   - isPublished === false
 *
 * 🟢 READY se:
 *   - isPublished === true
 */
export interface PublicationConfig {
  status: ReadinessStatus;
  isPublished: boolean;
}

/**
 * Estado operacional (dinâmico, não bloqueia configuração).
 *
 * Não entra no cálculo de "configuração incompleta".
 * Apenas influencia o que o TPV pode fazer (vender / fechar turno / preview).
 */
export interface OperationState {
  isTurnOpen: boolean;
  currentTurnId?: string;
}

/**
 * Schema canónico de Restaurant para readiness/config-first.
 *
 * Não contém:
 * - onboardingCompleted
 * - setupStep / currentStep
 * - firstLogin
 * - flags mágicas de onboarding
 *
 * Qualquer tentativa de reintroduzir estes conceitos é violação de arquitetura.
 */
export interface Restaurant {
  /** Identificador único do restaurante. */
  id: string;

  /** Relacionamento com o dono / utilizador principal. */
  ownerUserId: string;
  ownerPhone: string;

  /** Blocos críticos de configuração (incompletos por design). */
  identity: IdentityConfig;
  local: LocalConfig;
  menu: MenuConfig;
  publication: PublicationConfig;

  /**
   * Estado de operação (turnos, etc).
   * Não bloqueia readiness de configuração.
   */
  operation: OperationState;

  /** Metadados de auditoria. */
  createdAt: string;
  updatedAt: string;
}

