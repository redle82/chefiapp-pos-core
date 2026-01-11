/**
 * ACTIVATION ADVISOR
 * 
 * Pure intelligence engine that analyzes onboarding answers + blueprint + system state
 * and generates actionable recommendations.
 * 
 * Constitutional Principle:
 * - READS state, NEVER mutates
 * - Suggests actions, NEVER executes them
 * - Fail-closed: Missing data → no recommendations
 * - Deterministic: Same input → same output
 * 
 * Phase 3B — Activation Intelligence
 */

import type { SystemBlueprint } from '../blueprint/SystemBlueprint';
import type { SystemState } from '../state/SystemStateProvider';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ActivationImpact = 'high' | 'medium' | 'low';

export interface ActivationRecommendation {
    id: string;
    title: string;
    reason: string;
    impact: ActivationImpact;
    action?: {
        label: string;
        to: string; // Safe route (navigation only)
    };
    tags?: string[];
}

/**
 * Onboarding answers collected during the Foundation Ritual
 * Maps to ONBOARDING_QUESTIONS_SCHEMA.ts fields
 */
export interface OnboardingAnswers {
    // Identity
    public_name?: string;
    initial_role?: 'owner' | 'manager' | 'tech';
    
    // Authority
    authority_mode?: 'create' | 'join';
    restaurant_name?: string;
    restaurant_city?: string;
    restaurant_type?: 'restaurant' | 'bar' | 'cafe' | 'club' | 'dark_kitchen';
    
    // Topology
    has_tables?: boolean;
    table_count?: number;
    table_count_range?: 'none' | 'small' | 'medium' | 'large';
    qr_enabled?: boolean;
    has_delivery?: boolean;
    
    // Flow
    order_creator?: 'staff' | 'customer' | 'both' | 'hybrid';
    confirmation_mode?: 'kitchen' | 'cashier' | 'auto';
    
    // Cash
    has_physical_cashier?: boolean;
    accepts_cash?: boolean;
    accepts_card?: boolean;
    payment_methods?: 'standard' | 'digital_only' | 'cash_only';
    tips_enabled?: boolean;
    
    // Team
    team_size?: 'solo' | 'small' | 'medium' | 'large' | '1-5' | '6-15' | '15+';
    enable_staff_scheduling?: boolean;
}

export interface ActivationAdvisorInput {
    answers: Partial<OnboardingAnswers>;
    blueprint: SystemBlueprint | null;
    systemState: SystemState | null;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVATION ADVISOR ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * ACTIVATION ADVISOR ENGINE
 * 
 * Analyzes business configuration and provides intelligent recommendations.
 * 
 * Rules (15 total):
 * 1. Dark Kitchen (no tables) → Recommend delivery-first setup
 * 2. No cash → Recommend cashless workflow optimization
 * 3. Solo operator (1-5 team) → Skip team management features
 * 4. Large team (15+) → Recommend staff scheduling
 * 5. Delivery enabled → KDS optimization
 * 6. Customer ordering → QR menu setup
 * 7. Staff ordering only → POS training
 * 8. Both ordering modes → Workflow separation
 * 9. Cash enabled → Cash management
 * 10. Tables + delivery → Channel separation
 * 11. Small tables count → Turnover optimization
 * 12. Large tables count → Reservation system
 * 13. Cash only → Cash management training
 * 14. Card only → Terminal setup
 * 15. Scheduling disabled for medium/large team → Manual shift planning
 */
export class ActivationAdvisor {
    /**
     * Get activation recommendations based on business configuration
     * Pure function: deterministic, no side effects
     */
    static getActivationRecommendations(input: ActivationAdvisorInput): ActivationRecommendation[] {
        const { answers, blueprint, systemState } = input;
        const recommendations: ActivationRecommendation[] = [];

        // Guard: Insufficient data → fail-closed
        if (!answers || Object.keys(answers).length === 0) {
            return [];
        }

        // Normalize team size to unified format
        const teamSize = this.normalizeTeamSize(answers.team_size);
        
        // Normalize table info
        const hasTables = this.determineHasTables(answers);
        const tableCount = this.determineTableCount(answers);

        // Rule 1: Dark Kitchen (no tables)
        if (hasTables === false) {
            recommendations.push({
                id: 'dark-kitchen-mode',
                title: 'Modo Dark Kitchen Ativo',
                reason: 'Seu negócio não possui mesas. O sistema está otimizado para delivery e takeaway.',
                impact: 'high',
                action: {
                    label: 'Configurar Fluxo de Delivery',
                    to: '/settings/operations'
                },
                tags: ['topology', 'operations']
            });
        }

        // Rule 2: No cash accepted
        if (this.determineNoCash(answers)) {
            recommendations.push({
                id: 'cashless-operation',
                title: 'Operação 100% Digital',
                reason: 'Você não aceita dinheiro físico. Considere otimizar para pagamentos digitais apenas.',
                impact: 'medium',
                action: {
                    label: 'Configurar Métodos de Pagamento',
                    to: '/settings/payments'
                },
                tags: ['payments', 'finance']
            });
        }

        // Rule 3: Solo operator (small team)
        if (teamSize === 'solo' || teamSize === 'small') {
            recommendations.push({
                id: 'solo-operator',
                title: 'Operação Solo/Pequena Equipe',
                reason: 'Com equipe pequena (1-5 pessoas), você pode pular configurações avançadas de turnos e escalas.',
                impact: 'low',
                tags: ['team', 'operations']
            });
        }

        // Rule 4: Large team → recommend scheduling
        if (teamSize === 'large' && answers.enable_staff_scheduling === false) {
            recommendations.push({
                id: 'enable-scheduling',
                title: 'Ativar Gestão de Turnos',
                reason: 'Com equipe grande (15+ pessoas), turnos e horários facilitam a organização.',
                impact: 'high',
                action: {
                    label: 'Configurar Turnos',
                    to: '/settings/team'
                },
                tags: ['team', 'scheduling']
            });
        }

        // Rule 5: Delivery enabled → KDS optimization
        if (answers.has_delivery === true) {
            recommendations.push({
                id: 'delivery-kds',
                title: 'Otimizar KDS para Delivery',
                reason: 'Com delivery ativo, o Kitchen Display System deve priorizar tempo de preparo e rotas.',
                impact: 'high',
                action: {
                    label: 'Configurar KDS',
                    to: '/settings/kitchen'
                },
                tags: ['delivery', 'kitchen', 'operations']
            });
        }

        // Rule 6: Customer ordering → QR menu
        if (answers.order_creator === 'customer' || answers.order_creator === 'both' || answers.order_creator === 'hybrid') {
            recommendations.push({
                id: 'qr-menu-setup',
                title: 'Configurar QR Menu',
                reason: 'Clientes podem criar pedidos. Configure o menu digital para melhor experiência.',
                impact: 'high',
                action: {
                    label: 'Configurar Menu Digital',
                    to: '/settings/menu'
                },
                tags: ['ordering', 'customer', 'ux']
            });
        }

        // Rule 7: Staff ordering only → POS training
        if (answers.order_creator === 'staff') {
            recommendations.push({
                id: 'pos-training',
                title: 'Treinar Equipe no POS',
                reason: 'Apenas staff cria pedidos. Foque em treinamento do sistema POS para eficiência.',
                impact: 'medium',
                action: {
                    label: 'Ver Guia de Treinamento',
                    to: '/help/pos-training'
                },
                tags: ['training', 'pos', 'staff']
            });
        }

        // Rule 8: Both ordering modes → workflow separation
        if (answers.order_creator === 'both' || answers.order_creator === 'hybrid') {
            recommendations.push({
                id: 'hybrid-workflow',
                title: 'Separar Fluxos de Pedido',
                reason: 'Com pedidos de staff E clientes, considere fluxos separados para evitar confusão.',
                impact: 'medium',
                action: {
                    label: 'Configurar Fluxos',
                    to: '/settings/operations'
                },
                tags: ['workflow', 'operations']
            });
        }

        // Rule 9: Cash enabled → cash management
        if (this.determineCashEnabled(answers)) {
            recommendations.push({
                id: 'cash-management',
                title: 'Gerenciar Caixa Físico',
                reason: 'Você aceita dinheiro. Configure procedimentos de abertura/fechamento de caixa.',
                impact: 'high',
                action: {
                    label: 'Configurar Caixa',
                    to: '/settings/cash'
                },
                tags: ['cash', 'finance', 'operations']
            });
        }

        // Rule 10: Tables + delivery → channel separation
        if (hasTables === true && answers.has_delivery === true) {
            recommendations.push({
                id: 'multi-channel',
                title: 'Separar Canais (Mesas + Delivery)',
                reason: 'Com mesas E delivery, organize a cozinha para gerenciar ambos os canais eficientemente.',
                impact: 'high',
                action: {
                    label: 'Configurar Canais',
                    to: '/settings/operations'
                },
                tags: ['multi-channel', 'operations']
            });
        }

        // Rule 11: Small table count → turnover optimization
        if (hasTables === true && tableCount !== null && tableCount <= 10) {
            recommendations.push({
                id: 'table-turnover',
                title: 'Otimizar Rotatividade de Mesas',
                reason: `Com ${tableCount} mesas, foque em rotatividade rápida para maximizar receita.`,
                impact: 'medium',
                action: {
                    label: 'Ver Estratégias',
                    to: '/help/table-management'
                },
                tags: ['tables', 'operations', 'revenue']
            });
        }

        // Rule 12: Large table count → reservation system
        if (hasTables === true && tableCount !== null && tableCount > 20) {
            recommendations.push({
                id: 'reservation-system',
                title: 'Implementar Sistema de Reservas',
                reason: `Com ${tableCount} mesas, um sistema de reservas pode otimizar ocupação.`,
                impact: 'medium',
                action: {
                    label: 'Configurar Reservas',
                    to: '/settings/reservations'
                },
                tags: ['tables', 'reservations', 'operations']
            });
        }

        // Rule 13: Cash only → cash management training
        if (this.determineCashOnly(answers)) {
            recommendations.push({
                id: 'cash-only-training',
                title: 'Operação 100% em Dinheiro',
                reason: 'Você aceita apenas dinheiro. Reforce procedimentos de segurança e contagem.',
                impact: 'high',
                action: {
                    label: 'Ver Boas Práticas',
                    to: '/help/cash-management'
                },
                tags: ['cash', 'security', 'training']
            });
        }

        // Rule 14: Card only → terminal setup
        if (this.determineCardOnly(answers)) {
            recommendations.push({
                id: 'card-only-terminal',
                title: 'Configurar Terminais de Cartão',
                reason: 'Operação 100% cartão. Configure e teste terminais de pagamento.',
                impact: 'high',
                action: {
                    label: 'Configurar Terminais',
                    to: '/settings/payment-terminals'
                },
                tags: ['payments', 'terminals', 'setup']
            });
        }

        // Rule 15: Scheduling disabled for medium/large team
        if (
            (teamSize === 'medium' || teamSize === 'large') &&
            answers.enable_staff_scheduling === false
        ) {
            recommendations.push({
                id: 'manual-scheduling',
                title: 'Planejamento Manual de Turnos',
                reason: 'Com equipe média/grande sem agendamento automático, organize turnos manualmente.',
                impact: 'medium',
                action: {
                    label: 'Ver Templates de Escala',
                    to: '/help/scheduling'
                },
                tags: ['team', 'scheduling', 'manual']
            });
        }

        return recommendations;
    }

    /**
     * Filter recommendations by impact level
     */
    static filterByImpact(
        recommendations: ActivationRecommendation[],
        impact: ActivationImpact
    ): ActivationRecommendation[] {
        return recommendations.filter(rec => rec.impact === impact);
    }

    /**
     * Filter recommendations by tags
     */
    static filterByTags(
        recommendations: ActivationRecommendation[],
        tags: string[]
    ): ActivationRecommendation[] {
        return recommendations.filter(rec =>
            rec.tags?.some(tag => tags.includes(tag))
        );
    }

    /**
     * Get high-priority recommendations only
     */
    static getHighPriorityRecommendations(input: ActivationAdvisorInput): ActivationRecommendation[] {
        const all = this.getActivationRecommendations(input);
        return this.filterByImpact(all, 'high');
    }

    /**
     * Get recommendation count by impact
     */
    static getImpactSummary(recommendations: ActivationRecommendation[]): Record<ActivationImpact, number> {
        return {
            high: recommendations.filter(r => r.impact === 'high').length,
            medium: recommendations.filter(r => r.impact === 'medium').length,
            low: recommendations.filter(r => r.impact === 'low').length
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE HELPERS — Normalize diverse answer formats
    // ═══════════════════════════════════════════════════════════════

    private static normalizeTeamSize(teamSize?: string): 'solo' | 'small' | 'medium' | 'large' | null {
        if (!teamSize) return null;
        switch (teamSize) {
            case 'solo':
            case '1-5':
            case 'small':
                return 'small';
            case '6-15':
            case 'medium':
                return 'medium';
            case '15+':
            case 'large':
                return 'large';
            default:
                return null;
        }
    }

    private static determineHasTables(answers: Partial<OnboardingAnswers>): boolean | null {
        if (typeof answers.has_tables === 'boolean') return answers.has_tables;
        if (answers.table_count_range === 'none') return false;
        if (answers.table_count_range) return true;
        if (answers.restaurant_type === 'dark_kitchen') return false;
        return null;
    }

    private static determineTableCount(answers: Partial<OnboardingAnswers>): number | null {
        if (typeof answers.table_count === 'number') return answers.table_count;
        switch (answers.table_count_range) {
            case 'none': return 0;
            case 'small': return 5; // Estimate for small
            case 'medium': return 20; // Estimate for medium
            case 'large': return 35; // Estimate for large
            default: return null;
        }
    }

    private static determineNoCash(answers: Partial<OnboardingAnswers>): boolean {
        if (answers.accepts_cash === false) return true;
        if (answers.payment_methods === 'digital_only') return true;
        return false;
    }

    private static determineCashEnabled(answers: Partial<OnboardingAnswers>): boolean {
        if (answers.accepts_cash === true) return true;
        if (answers.payment_methods === 'standard' || answers.payment_methods === 'cash_only') return true;
        return false;
    }

    private static determineCashOnly(answers: Partial<OnboardingAnswers>): boolean {
        if (answers.accepts_cash === true && answers.accepts_card === false) return true;
        if (answers.payment_methods === 'cash_only') return true;
        return false;
    }

    private static determineCardOnly(answers: Partial<OnboardingAnswers>): boolean {
        if (answers.accepts_cash === false && answers.accepts_card === true) return true;
        if (answers.payment_methods === 'digital_only') return true;
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// STANDALONE FUNCTION EXPORT (for functional usage)
// ═══════════════════════════════════════════════════════════════

export function getActivationRecommendations(input: ActivationAdvisorInput): ActivationRecommendation[] {
    return ActivationAdvisor.getActivationRecommendations(input);
}

export function getHighPriorityRecommendations(input: ActivationAdvisorInput): ActivationRecommendation[] {
    return ActivationAdvisor.getHighPriorityRecommendations(input);
}
