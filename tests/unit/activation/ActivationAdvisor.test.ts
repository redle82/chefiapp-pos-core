/**
 * 🧪 ACTIVATION ADVISOR — UNIT TESTS
 * 
 * Tests the pure intelligence engine that generates activation recommendations.
 */

import { describe, it, expect } from '@jest/globals';
import {
    ActivationAdvisor,
    getActivationRecommendations,
    getHighPriorityRecommendations,
    type ActivationAdvisorInput,
    type ActivationRecommendation,
} from '../../../merchant-portal/src/core/activation/ActivationAdvisor';
// Mock SystemState (simplified for tests - not used in ActivationAdvisor but required by type)
const mockSystemState: any = null; // ActivationAdvisor doesn't use systemState currently

const mockBlueprint: any = null; // ActivationAdvisor doesn't use blueprint currently

describe('ActivationAdvisor', () => {
    describe('getActivationRecommendations', () => {
        it('should return empty array when answers are empty', () => {
            const input: ActivationAdvisorInput = {
                answers: {},
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            expect(result).toEqual([]);
        });

        it('should return empty array when answers is null', () => {
            const input: ActivationAdvisorInput = {
                answers: null as any,
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            expect(result).toEqual([]);
        });

        // Rule 1: Dark Kitchen (no tables)
        it('should recommend dark kitchen mode when has_tables is false', () => {
            const input: ActivationAdvisorInput = {
                answers: { has_tables: false },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const darkKitchen = result.find(r => r.id === 'dark-kitchen-mode');
            
            expect(darkKitchen).toBeDefined();
            expect(darkKitchen?.impact).toBe('high');
            expect(darkKitchen?.action?.to).toBe('/settings/operations');
        });

        it('should recommend dark kitchen when table_count_range is none', () => {
            const input: ActivationAdvisorInput = {
                answers: { table_count_range: 'none' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const darkKitchen = result.find(r => r.id === 'dark-kitchen-mode');
            expect(darkKitchen).toBeDefined();
        });

        it('should recommend dark kitchen when restaurant_type is dark_kitchen', () => {
            const input: ActivationAdvisorInput = {
                answers: { restaurant_type: 'dark_kitchen' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const darkKitchen = result.find(r => r.id === 'dark-kitchen-mode');
            expect(darkKitchen).toBeDefined();
        });

        // Rule 2: No cash accepted
        it('should recommend cashless operation when accepts_cash is false', () => {
            const input: ActivationAdvisorInput = {
                answers: { accepts_cash: false },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const cashless = result.find(r => r.id === 'cashless-operation');
            
            expect(cashless).toBeDefined();
            expect(cashless?.impact).toBe('medium');
        });

        it('should recommend cashless when payment_methods is digital_only', () => {
            const input: ActivationAdvisorInput = {
                answers: { payment_methods: 'digital_only' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const cashless = result.find(r => r.id === 'cashless-operation');
            expect(cashless).toBeDefined();
        });

        // Rule 3: Solo operator
        it('should recommend solo operator mode for solo team', () => {
            const input: ActivationAdvisorInput = {
                answers: { team_size: 'solo' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const solo = result.find(r => r.id === 'solo-operator');
            
            expect(solo).toBeDefined();
            expect(solo?.impact).toBe('low');
        });

        it('should recommend solo operator for small team (1-5)', () => {
            const input: ActivationAdvisorInput = {
                answers: { team_size: '1-5' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const solo = result.find(r => r.id === 'solo-operator');
            expect(solo).toBeDefined();
        });

        // Rule 4: Large team → scheduling
        it('should recommend scheduling for large team without scheduling enabled', () => {
            const input: ActivationAdvisorInput = {
                answers: { team_size: 'large', enable_staff_scheduling: false },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const scheduling = result.find(r => r.id === 'enable-scheduling');
            
            expect(scheduling).toBeDefined();
            expect(scheduling?.impact).toBe('high');
            expect(scheduling?.action?.to).toBe('/settings/team');
        });

        it('should not recommend scheduling if already enabled', () => {
            const input: ActivationAdvisorInput = {
                answers: { team_size: 'large', enable_staff_scheduling: true },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const scheduling = result.find(r => r.id === 'enable-scheduling');
            expect(scheduling).toBeUndefined();
        });

        // Rule 5: Delivery enabled → KDS optimization
        it('should recommend KDS optimization when delivery is enabled', () => {
            const input: ActivationAdvisorInput = {
                answers: { has_delivery: true },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const kds = result.find(r => r.id === 'delivery-kds');
            
            expect(kds).toBeDefined();
            expect(kds?.impact).toBe('high');
            expect(kds?.action?.to).toBe('/settings/kitchen');
        });

        // Rule 6: Customer ordering → QR menu
        it('should recommend QR menu when order_creator is customer', () => {
            const input: ActivationAdvisorInput = {
                answers: { order_creator: 'customer' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const qr = result.find(r => r.id === 'qr-menu-setup');
            
            expect(qr).toBeDefined();
            expect(qr?.impact).toBe('high');
        });

        it('should recommend QR menu when order_creator is both', () => {
            const input: ActivationAdvisorInput = {
                answers: { order_creator: 'both' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const qr = result.find(r => r.id === 'qr-menu-setup');
            expect(qr).toBeDefined();
        });

        it('should recommend QR menu when order_creator is hybrid', () => {
            const input: ActivationAdvisorInput = {
                answers: { order_creator: 'hybrid' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const qr = result.find(r => r.id === 'qr-menu-setup');
            expect(qr).toBeDefined();
        });

        // Rule 7: Staff ordering only → POS training
        it('should recommend POS training when order_creator is staff', () => {
            const input: ActivationAdvisorInput = {
                answers: { order_creator: 'staff' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const pos = result.find(r => r.id === 'pos-training');
            
            expect(pos).toBeDefined();
            expect(pos?.impact).toBe('medium');
        });

        // Rule 8: Both ordering modes → workflow separation
        it('should recommend hybrid workflow when order_creator is both', () => {
            const input: ActivationAdvisorInput = {
                answers: { order_creator: 'both' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const hybrid = result.find(r => r.id === 'hybrid-workflow');
            
            expect(hybrid).toBeDefined();
            expect(hybrid?.impact).toBe('medium');
        });

        // Rule 9: Cash enabled → cash management
        it('should recommend cash management when accepts_cash is true', () => {
            const input: ActivationAdvisorInput = {
                answers: { accepts_cash: true },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const cash = result.find(r => r.id === 'cash-management');
            
            expect(cash).toBeDefined();
            expect(cash?.impact).toBe('high');
        });

        it('should recommend cash management when payment_methods is standard', () => {
            const input: ActivationAdvisorInput = {
                answers: { payment_methods: 'standard' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const cash = result.find(r => r.id === 'cash-management');
            expect(cash).toBeDefined();
        });

        // Rule 10: Tables + delivery → channel separation
        it('should recommend multi-channel when has tables and delivery', () => {
            const input: ActivationAdvisorInput = {
                answers: { has_tables: true, has_delivery: true },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const multi = result.find(r => r.id === 'multi-channel');
            
            expect(multi).toBeDefined();
            expect(multi?.impact).toBe('high');
        });

        // Rule 11: Small table count → turnover optimization
        it('should recommend table turnover for small table count', () => {
            const input: ActivationAdvisorInput = {
                answers: { has_tables: true, table_count: 5 },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const turnover = result.find(r => r.id === 'table-turnover');
            
            expect(turnover).toBeDefined();
            expect(turnover?.impact).toBe('medium');
            expect(turnover?.reason).toContain('5 mesas');
        });

        it('should recommend table turnover for small range', () => {
            const input: ActivationAdvisorInput = {
                answers: { table_count_range: 'small' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const turnover = result.find(r => r.id === 'table-turnover');
            expect(turnover).toBeDefined();
        });

        // Rule 12: Large table count → reservation system
        it('should recommend reservation system for large table count', () => {
            const input: ActivationAdvisorInput = {
                answers: { has_tables: true, table_count: 25 },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const reservation = result.find(r => r.id === 'reservation-system');
            
            expect(reservation).toBeDefined();
            expect(reservation?.impact).toBe('medium');
            expect(reservation?.reason).toContain('25 mesas');
        });

        it('should recommend reservation for large range', () => {
            const input: ActivationAdvisorInput = {
                answers: { table_count_range: 'large' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const reservation = result.find(r => r.id === 'reservation-system');
            expect(reservation).toBeDefined();
        });

        // Rule 13: Cash only → cash management training
        it('should recommend cash-only training when cash only', () => {
            const input: ActivationAdvisorInput = {
                answers: { accepts_cash: true, accepts_card: false },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const cashOnly = result.find(r => r.id === 'cash-only-training');
            
            expect(cashOnly).toBeDefined();
            expect(cashOnly?.impact).toBe('high');
        });

        it('should recommend cash-only when payment_methods is cash_only', () => {
            const input: ActivationAdvisorInput = {
                answers: { payment_methods: 'cash_only' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const cashOnly = result.find(r => r.id === 'cash-only-training');
            expect(cashOnly).toBeDefined();
        });

        // Rule 14: Card only → terminal setup
        it('should recommend terminal setup when card only', () => {
            const input: ActivationAdvisorInput = {
                answers: { accepts_cash: false, accepts_card: true },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const terminal = result.find(r => r.id === 'card-only-terminal');
            
            expect(terminal).toBeDefined();
            expect(terminal?.impact).toBe('high');
        });

        it('should recommend terminal when payment_methods is digital_only', () => {
            const input: ActivationAdvisorInput = {
                answers: { payment_methods: 'digital_only' },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const terminal = result.find(r => r.id === 'card-only-terminal');
            expect(terminal).toBeDefined();
        });

        // Rule 15: Scheduling disabled for medium/large team
        it('should recommend manual scheduling for medium team without scheduling', () => {
            const input: ActivationAdvisorInput = {
                answers: { team_size: 'medium', enable_staff_scheduling: false },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const manual = result.find(r => r.id === 'manual-scheduling');
            
            expect(manual).toBeDefined();
            expect(manual?.impact).toBe('medium');
        });

        it('should recommend manual scheduling for large team without scheduling', () => {
            const input: ActivationAdvisorInput = {
                answers: { team_size: 'large', enable_staff_scheduling: false },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            const manual = result.find(r => r.id === 'manual-scheduling');
            expect(manual).toBeDefined();
        });

        // Multiple rules can apply
        it('should return multiple recommendations when multiple rules apply', () => {
            const input: ActivationAdvisorInput = {
                answers: {
                    has_tables: false,
                    accepts_cash: false,
                    has_delivery: true,
                    order_creator: 'customer',
                },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getActivationRecommendations(input);
            expect(result.length).toBeGreaterThan(1);
            
            expect(result.find(r => r.id === 'dark-kitchen-mode')).toBeDefined();
            expect(result.find(r => r.id === 'cashless-operation')).toBeDefined();
            expect(result.find(r => r.id === 'delivery-kds')).toBeDefined();
            expect(result.find(r => r.id === 'qr-menu-setup')).toBeDefined();
        });
    });

    describe('filterByImpact', () => {
        it('should filter recommendations by impact level', () => {
            const recommendations: ActivationRecommendation[] = [
                { id: '1', title: 'High', reason: 'Test', impact: 'high' },
                { id: '2', title: 'Medium', reason: 'Test', impact: 'medium' },
                { id: '3', title: 'Low', reason: 'Test', impact: 'low' },
                { id: '4', title: 'High 2', reason: 'Test', impact: 'high' },
            ];

            const high = ActivationAdvisor.filterByImpact(recommendations, 'high');
            expect(high.length).toBe(2);
            expect(high.every(r => r.impact === 'high')).toBe(true);
        });
    });

    describe('filterByTags', () => {
        it('should filter recommendations by tags', () => {
            const recommendations: ActivationRecommendation[] = [
                { id: '1', title: 'Test', reason: 'Test', impact: 'high', tags: ['payments', 'finance'] },
                { id: '2', title: 'Test', reason: 'Test', impact: 'medium', tags: ['team', 'operations'] },
                { id: '3', title: 'Test', reason: 'Test', impact: 'low', tags: ['payments'] },
            ];

            const payments = ActivationAdvisor.filterByTags(recommendations, ['payments']);
            expect(payments.length).toBe(2);
            expect(payments.every(r => r.tags?.includes('payments'))).toBe(true);
        });
    });

    describe('getHighPriorityRecommendations', () => {
        it('should return only high impact recommendations', () => {
            const input: ActivationAdvisorInput = {
                answers: {
                    has_tables: false,
                    has_delivery: true,
                    order_creator: 'customer',
                },
                blueprint: null,
                systemState: null,
            };

            const result = ActivationAdvisor.getHighPriorityRecommendations(input);
            expect(result.length).toBeGreaterThan(0);
            expect(result.every(r => r.impact === 'high')).toBe(true);
        });
    });

    describe('getImpactSummary', () => {
        it('should return correct impact summary', () => {
            const recommendations: ActivationRecommendation[] = [
                { id: '1', title: 'High', reason: 'Test', impact: 'high' },
                { id: '2', title: 'High 2', reason: 'Test', impact: 'high' },
                { id: '3', title: 'Medium', reason: 'Test', impact: 'medium' },
                { id: '4', title: 'Low', reason: 'Test', impact: 'low' },
            ];

            const summary = ActivationAdvisor.getImpactSummary(recommendations);
            expect(summary.high).toBe(2);
            expect(summary.medium).toBe(1);
            expect(summary.low).toBe(1);
        });
    });

    describe('Standalone function exports', () => {
        it('getActivationRecommendations should work as standalone function', () => {
            const input: ActivationAdvisorInput = {
                answers: { has_tables: false },
                blueprint: null,
                systemState: null,
            };

            const result = getActivationRecommendations(input);
            expect(result.length).toBeGreaterThan(0);
        });

        it('getHighPriorityRecommendations should work as standalone function', () => {
            const input: ActivationAdvisorInput = {
                answers: { has_delivery: true },
                blueprint: null,
                systemState: null,
            };

            const result = getHighPriorityRecommendations(input);
            expect(result.every(r => r.impact === 'high')).toBe(true);
        });
    });
});
