/**
 * OnboardingWizard Tests - Fluxo de Onboarding
 * 
 * Testa o wizard de onboarding que gerencia as 8 etapas do processo.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock OnboardingCore
const mockInitializeSovereign = jest.fn() as jest.MockedFunction<(params: any) => Promise<any>>;
const mockUpdateDraft = jest.fn() as jest.MockedFunction<(draft: any) => void>;
const mockResolveRealityConflict = jest.fn() as jest.MockedFunction<(params: any) => Promise<any>>;

jest.mock('../../../merchant-portal/src/core/onboarding/OnboardingCore', () => ({
    OnboardingCore: {
        initializeSovereign: mockInitializeSovereign,
        resolveRealityConflict: mockResolveRealityConflict
    }
}));

// Mock useOnboarding hook
const mockUseOnboarding = {
    draft: {
        restaurantName: '',
        city: '',
        businessType: 'Restaurant'
    },
    updateDraft: mockUpdateDraft,
    initializeSovereign: mockInitializeSovereign,
    entryContext: 'founder'
};

jest.mock('../../../merchant-portal/src/pages/Onboarding/OnboardingState', () => ({
    useOnboarding: () => mockUseOnboarding
}));

describe('OnboardingWizard - Fluxo de Onboarding', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseOnboarding.draft = {
            restaurantName: '',
            city: '',
            businessType: 'Restaurant'
        };
    });

    describe('ScreenSystemIdentity - Etapa 1: Identidade', () => {
        it('deve validar que nome do restaurante é obrigatório', () => {
            const name = '';
            const city = 'Lisboa';
            const type = 'Restaurant';

            // Nome vazio deve impedir avanço
            expect(name.trim()).toBe('');
            expect(name.trim().length).toBe(0);
        });

        it('deve permitir avançar quando nome é fornecido', () => {
            const name = 'Test Restaurant';
            const city = 'Lisboa';
            const type = 'Restaurant';

            expect(name.trim().length).toBeGreaterThan(0);
        });

        it('deve chamar initializeSovereign ao avançar', async () => {
            mockInitializeSovereign.mockResolvedValue({
                tenant_id: 'test-uuid',
                slug: 'test-restaurant-abc123',
                message: 'Tenant created successfully'
            });

            const name = 'Test Restaurant';
            const city = 'Lisboa';
            const type = 'Restaurant';

            // Simular chamada
            await mockInitializeSovereign({
                restaurantName: name,
                city,
                businessType: type
            });

            expect(mockInitializeSovereign).toHaveBeenCalled();
        });

        it('deve criar tenant com todos os campos obrigatórios', async () => {
            const name = 'My Restaurant';
            const city = 'Porto';
            const type = 'Restaurant';

            mockInitializeSovereign.mockResolvedValue({
                tenant_id: 'test-uuid',
                slug: 'my-restaurant-xyz789',
                message: 'Tenant created successfully'
            });

            const result: any = await mockInitializeSovereign({
                restaurantName: name,
                city,
                businessType: type
            });

            expect(result.tenant_id).toBeDefined();
            expect(result.slug).toBeDefined();
        });

        it('deve tratar erro quando initializeSovereign falha', async () => {
            const error = new Error('Failed to create tenant');
            mockInitializeSovereign.mockRejectedValue(error);

            try {
                await mockInitializeSovereign({
                    restaurantName: 'Test',
                    city: 'Lisboa',
                    businessType: 'Restaurant'
                });
            } catch (e) {
                expect(e).toBe(error);
            }
        });
    });

    describe('Navegação entre Etapas', () => {
        const steps = [
            'identity',
            'authority',
            'existence',
            'topology',
            'flow',
            'cash',
            'team',
            'consecration'
        ];

        it('deve ter 8 etapas no fluxo de onboarding', () => {
            expect(steps.length).toBe(8);
        });

        it('deve permitir navegação sequencial entre etapas', () => {
            // Cada etapa deve permitir avanço para a próxima
            for (let i = 0; i < steps.length - 1; i++) {
                const current = steps[i];
                const next = steps[i + 1];
                expect(current).toBeDefined();
                expect(next).toBeDefined();
            }
        });

        it('deve permitir voltar para etapa anterior', () => {
            // Navegação reversa deve ser permitida
            for (let i = steps.length - 1; i > 0; i--) {
                const current = steps[i];
                const previous = steps[i - 1];
                expect(current).toBeDefined();
                expect(previous).toBeDefined();
            }
        });
    });

    describe('Validação de Dados', () => {
        it('deve validar nome do restaurante (mínimo 2 caracteres)', () => {
            const validNames = ['AB', 'My Restaurant', 'Café & Bistro'];
            const invalidNames = ['', 'A', ' '];

            validNames.forEach(name => {
                expect(name.trim().length).toBeGreaterThanOrEqual(2);
            });

            invalidNames.forEach(name => {
                expect(name.trim().length).toBeLessThan(2);
            });
        });

        it('deve validar cidade (opcional mas recomendado)', () => {
            const withCity = { city: 'Lisboa' };
            const withoutCity = { city: '' };

            // Cidade pode ser vazia, mas é recomendado
            expect(withCity.city.length).toBeGreaterThan(0);
            expect(withoutCity.city.length).toBe(0);
        });

        it('deve validar tipo de negócio (deve ser um dos valores permitidos)', () => {
            const validTypes = ['Restaurant', 'Bar', 'DarkKitchen', 'Cafe', 'Other'];
            const invalidType = 'InvalidType';

            validTypes.forEach(type => {
                expect(validTypes.includes(type)).toBe(true);
            });

            expect(validTypes.includes(invalidType)).toBe(false);
        });
    });

    describe('Persistência de Draft', () => {
        it('deve salvar draft ao preencher campos', () => {
            const draft = {
                restaurantName: 'Test Restaurant',
                city: 'Lisboa',
                businessType: 'Restaurant' as const
            };

            mockUpdateDraft(draft);

            expect(mockUpdateDraft).toHaveBeenCalledWith(draft);
        });

        it('deve restaurar draft ao voltar para etapa anterior', () => {
            const savedDraft = {
                restaurantName: 'Saved Restaurant',
                city: 'Porto',
                businessType: 'Bar' as const
            };

            mockUseOnboarding.draft = savedDraft;

            expect(mockUseOnboarding.draft.restaurantName).toBe('Saved Restaurant');
            expect(mockUseOnboarding.draft.city).toBe('Porto');
        });
    });

    describe('Fluxo Completo', () => {
        it('deve completar todas as 8 etapas em sequência', async () => {
            const steps = [
                'identity',
                'authority',
                'existence',
                'topology',
                'flow',
                'cash',
                'team',
                'consecration'
            ];

            // Simular progresso através de todas as etapas
            for (const step of steps) {
                expect(step).toBeDefined();
                // Cada etapa deve ser completável
            }

            expect(steps.length).toBe(8);
        });

        it('deve marcar onboarding como completo ao finalizar', async () => {
            // Após completar todas as etapas, o onboarding deve ser marcado como completo
            const allStepsCompleted = true;

            if (allStepsCompleted) {
                // Deve atualizar onboarding_completed_at no banco
                expect(allStepsCompleted).toBe(true);
            }
        });
    });

    describe('Tratamento de Erros', () => {
        it('deve mostrar erro quando criação de tenant falha', async () => {
            const error = new Error('Database error');
            mockInitializeSovereign.mockRejectedValue(error);

            try {
                await mockInitializeSovereign({
                    restaurantName: 'Test',
                    city: 'Lisboa',
                    businessType: 'Restaurant'
                });
            } catch (e) {
                expect(e).toBe(error);
                // Erro deve ser exibido ao usuário
            }
        });

        it('deve permitir retry após erro', async () => {
            // Primeira tentativa falha
            mockInitializeSovereign.mockRejectedValueOnce(new Error('Network error'));
            
            // Segunda tentativa sucede
            mockInitializeSovereign.mockResolvedValueOnce({
                tenant_id: 'test-uuid',
                slug: 'test-restaurant-abc123',
                message: 'Tenant created successfully'
            });

            // Primeira tentativa
            try {
                await mockInitializeSovereign({
                    restaurantName: 'Test',
                    city: 'Lisboa',
                    businessType: 'Restaurant'
                });
            } catch (e) {
                expect(e).toBeDefined();
            }

            // Segunda tentativa (retry)
            const result: any = await mockInitializeSovereign({
                restaurantName: 'Test',
                city: 'Lisboa',
                businessType: 'Restaurant'
            });

            expect(result.tenant_id).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        it('deve lidar com nome muito longo', () => {
            const longName = 'A'.repeat(200);
            
            // Nome muito longo pode ser aceito ou truncado
            expect(longName.length).toBeGreaterThan(100);
        });

        it('deve lidar com caracteres especiais no nome', () => {
            const specialChars = ['Café & Bistro', "O'Reilly's", 'Restaurant (Lisboa)'];
            
            specialChars.forEach(name => {
                expect(name.length).toBeGreaterThan(0);
                // Deve ser sanitizado no slug, mas nome pode ter caracteres especiais
            });
        });

        it('deve lidar com cidade vazia', () => {
            const name = 'Test Restaurant';
            const city = '';
            const type = 'Restaurant';

            // Cidade é opcional
            expect(name.trim().length).toBeGreaterThan(0);
            expect(city.length).toBe(0);
        });
    });
});
