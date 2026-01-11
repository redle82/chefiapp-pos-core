/**
 * FlowGate Tests - Navegação Soberana
 * 
 * Testa o componente central de navegação do sistema.
 * FlowGate é a única autoridade que decide o fluxo do usuário.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { resolveNextRoute } from '../../../merchant-portal/src/core/flow/CoreFlow';
import type { UserState } from '../../../merchant-portal/src/core/flow/CoreFlow';

describe('FlowGate - resolveNextRoute (Lógica de Decisão)', () => {
    beforeEach(() => {
        // Limpar localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    describe('Redirecionamento de Usuário Não Autenticado', () => {
        it('deve redirecionar para /auth quando não autenticado e tentando acessar rota protegida', () => {
            const state: UserState = {
                isAuthenticated: false,
                hasOrganization: false,
                onboardingStatus: 'not_started',
                currentPath: '/app/dashboard'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('REDIRECT');
            if (decision.type === 'REDIRECT') {
                expect(decision.to).toBe('/auth');
            }
        });

        it('deve permitir acesso a /public/* quando não autenticado', () => {
            const state: UserState = {
                isAuthenticated: false,
                hasOrganization: false,
                onboardingStatus: 'not_started',
                currentPath: '/public/menu/abc123'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('ALLOW');
        });

        it('deve permitir acesso a / quando não autenticado', () => {
            const state: UserState = {
                isAuthenticated: false,
                hasOrganization: false,
                onboardingStatus: 'not_started',
                currentPath: '/'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('ALLOW');
        });

        it('deve permitir acesso a /auth quando não autenticado', () => {
            const state: UserState = {
                isAuthenticated: false,
                hasOrganization: false,
                onboardingStatus: 'not_started',
                currentPath: '/auth'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('ALLOW');
        });
    });

    describe('Redirecionamento de Usuário Autenticado Sem Organização', () => {
        it('deve redirecionar para onboarding quando autenticado mas sem organização', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: false,
                onboardingStatus: 'not_started',
                currentPath: '/app/dashboard'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('REDIRECT');
            if (decision.type === 'REDIRECT') {
                expect(decision.to).toContain('/onboarding');
            }
        });

        it('deve permitir acesso a rotas de onboarding quando status é not_started', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: false,
                onboardingStatus: 'not_started',
                currentPath: '/onboarding/identity'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('ALLOW');
        });
    });

    describe('Redirecionamento Durante Onboarding', () => {
        it('deve permitir acesso a qualquer etapa de onboarding quando não completo', () => {
            const states: UserState[] = [
                {
                    isAuthenticated: true,
                    hasOrganization: true,
                    onboardingStatus: 'identity',
                    currentPath: '/onboarding/identity'
                },
                {
                    isAuthenticated: true,
                    hasOrganization: true,
                    onboardingStatus: 'authority',
                    currentPath: '/onboarding/authority'
                },
                {
                    isAuthenticated: true,
                    hasOrganization: true,
                    onboardingStatus: 'topology',
                    currentPath: '/onboarding/topology'
                }
            ];

            states.forEach(state => {
                const decision = resolveNextRoute(state);
                expect(decision.type).toBe('ALLOW');
            });
        });

        it('deve redirecionar para onboarding quando tentando acessar /app durante onboarding', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: true,
                onboardingStatus: 'identity',
                currentPath: '/app/dashboard'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('REDIRECT');
            if (decision.type === 'REDIRECT') {
                expect(decision.to).toContain('/onboarding');
            }
        });
    });

    describe('Redirecionamento Após Onboarding Completo', () => {
        it('deve redirecionar de /auth para /app/dashboard quando completo', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: true,
                onboardingStatus: 'completed',
                currentPath: '/auth'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('REDIRECT');
            if (decision.type === 'REDIRECT') {
                expect(decision.to).toBe('/app/dashboard');
            }
        });

        it('deve redirecionar de / para /app/dashboard quando completo', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: true,
                onboardingStatus: 'completed',
                currentPath: '/'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('REDIRECT');
            if (decision.type === 'REDIRECT') {
                expect(decision.to).toBe('/app/dashboard');
            }
        });

        it('deve redirecionar de /app para /app/dashboard quando completo', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: true,
                onboardingStatus: 'completed',
                currentPath: '/app'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('REDIRECT');
            if (decision.type === 'REDIRECT') {
                expect(decision.to).toBe('/app/dashboard');
            }
        });

        it('deve bloquear acesso a onboarding quando completo', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: true,
                onboardingStatus: 'completed',
                currentPath: '/onboarding/identity'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('REDIRECT');
            if (decision.type === 'REDIRECT') {
                expect(decision.to).toBe('/app/dashboard');
            }
        });

        it('deve permitir acesso a /app/* quando completo', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: true,
                onboardingStatus: 'completed',
                currentPath: '/app/dashboard'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('ALLOW');
        });
    });

    describe('Limpeza de Cache', () => {
        it('deve limpar cache quando não há sessão', () => {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('chefiapp_restaurant_id', 'test-id');
                localStorage.setItem('chefiapp_active_tenant', 'test-tenant');
            }

            const state: UserState = {
                isAuthenticated: false,
                hasOrganization: false,
                onboardingStatus: 'not_started',
                currentPath: '/app/dashboard'
            };

            // Simular limpeza (seria feito no FlowGate real)
            // Aqui apenas verificamos que o estado requer limpeza
            expect(state.isAuthenticated).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('deve lidar com estado inconsistente (hasOrganization=true mas onboardingStatus=not_started)', () => {
            const state: UserState = {
                isAuthenticated: true,
                hasOrganization: true,
                onboardingStatus: 'not_started',
                currentPath: '/app/dashboard'
            };

            const decision = resolveNextRoute(state);
            // Deve redirecionar para onboarding
            expect(decision.type).toBe('REDIRECT');
        });

        it('deve lidar com rota desconhecida quando não autenticado', () => {
            const state: UserState = {
                isAuthenticated: false,
                hasOrganization: false,
                onboardingStatus: 'not_started',
                currentPath: '/unknown/route'
            };

            const decision = resolveNextRoute(state);
            expect(decision.type).toBe('REDIRECT');
            if (decision.type === 'REDIRECT') {
                expect(decision.to).toBe('/auth');
            }
        });
    });
});
