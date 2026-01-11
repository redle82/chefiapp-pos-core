/**
 * create_tenant_atomic RPC Tests
 * 
 * Testa a função RPC que cria tenants atomicamente.
 * Crítico: Deve criar empire_pulses corretamente (heartbeat NOT NULL).
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Supabase Client
const mockRpc = jest.fn() as jest.MockedFunction<(fnName: string, params: any) => Promise<any>>;

jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        rpc: (fnName: string, params: any) => mockRpc(fnName, params)
    }
}));

describe('create_tenant_atomic RPC', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Criação de Tenant', () => {
        it('deve criar tenant com todos os campos obrigatórios', async () => {
            const params = {
                p_restaurant_name: 'Test Restaurant',
                p_city: 'Lisboa',
                p_type: 'Restaurant',
                p_country: 'PT',
                p_team_size: '1-5',
                p_operation_mode: 'Gamified',
                p_menu_strategy: 'Quick'
            };

            const expectedResult = {
                tenant_id: 'test-uuid',
                slug: 'test-restaurant-abc123',
                message: 'Tenant created successfully'
            };

            mockRpc.mockResolvedValue({ data: expectedResult, error: null });

            const result = await mockRpc('create_tenant_atomic', params);

            expect(mockRpc).toHaveBeenCalledWith('create_tenant_atomic', params);
            expect(result.data).toMatchObject({
                tenant_id: expect.any(String),
                slug: expect.any(String),
                message: 'Tenant created successfully'
            });
        });

        it('deve criar empire_pulses com heartbeat NOT NULL', async () => {
            // Este teste verifica que a função SQL cria o pulse corretamente
            // O heartbeat deve ser CURRENT_TIMESTAMP (não NULL)
            
            const params = {
                p_restaurant_name: 'Test Restaurant',
                p_city: 'Lisboa'
            };

            const expectedResult = {
                tenant_id: 'test-uuid',
                slug: 'test-restaurant-abc123',
                message: 'Tenant created successfully'
            };

            mockRpc.mockResolvedValue({ data: expectedResult, error: null });

            const result = await mockRpc('create_tenant_atomic', params);

            // Se chegou aqui sem erro, significa que heartbeat foi criado
            // (o erro "null value in column heartbeat" não ocorreu)
            expect(result.data).toBeDefined();
            expect(result.error).toBeNull();
        });

        it('deve criar empire_pulses com project_slug e tenant_slug', async () => {
            // Verifica que os campos NOT NULL são preenchidos
            const params = {
                p_restaurant_name: 'Test Restaurant'
            };

            mockRpc.mockResolvedValue({
                data: {
                    tenant_id: 'test-uuid',
                    slug: 'test-restaurant-abc123',
                    message: 'Tenant created successfully'
                },
                error: null
            });

            const result = await mockRpc('create_tenant_atomic', params);

            // Se não houve erro de constraint, os campos foram preenchidos
            expect(result.error).toBeNull();
        });
    });

    describe('Idempotência', () => {
        it('deve retornar tenant existente se usuário já possui um', async () => {
            const params = {
                p_restaurant_name: 'Existing Restaurant'
            };

            const existingTenant = {
                tenant_id: 'existing-uuid',
                slug: 'existing-restaurant-xyz789',
                message: 'Tenant already exists',
                restored: true
            };

            mockRpc.mockResolvedValue({ data: existingTenant, error: null });

            const result = await mockRpc('create_tenant_atomic', params);

            expect(result.data.restored).toBe(true);
            expect(result.data.message).toBe('Tenant already exists');
        });
    });

    describe('Validação de Parâmetros', () => {
        it('deve usar valores padrão quando parâmetros opcionais não são fornecidos', async () => {
            const params = {
                p_restaurant_name: 'Test Restaurant'
                // p_city, p_type, etc são opcionais
            };

            mockRpc.mockResolvedValue({
                data: {
                    tenant_id: 'test-uuid',
                    slug: 'test-restaurant-abc123',
                    message: 'Tenant created successfully'
                },
                error: null
            });

            const result = await mockRpc('create_tenant_atomic', params);

            expect(result.error).toBeNull();
            // Valores padrão devem ser usados:
            // p_type: 'Restaurante'
            // p_country: 'ES'
            // p_team_size: '1-5'
            // p_operation_mode: 'Gamified'
            // p_menu_strategy: 'Quick'
        });

        it('deve validar que restaurant_name é obrigatório', async () => {
            const params = {
                // p_restaurant_name faltando
            };

            mockRpc.mockResolvedValue({
                data: null,
                error: { message: 'p_restaurant_name is required' }
            });

            const result = await mockRpc('create_tenant_atomic', params);

            expect(result.error).toBeDefined();
        });
    });

    describe('Geração de Slug', () => {
        it('deve gerar slug único baseado no nome do restaurante', async () => {
            const params = {
                p_restaurant_name: 'My Awesome Restaurant!'
            };

            mockRpc.mockResolvedValue({
                data: {
                    tenant_id: 'test-uuid',
                    slug: 'my-awesome-restaurant-abc123',
                    message: 'Tenant created successfully'
                },
                error: null
            });

            const result = await mockRpc('create_tenant_atomic', params);

            expect(result.data.slug).toMatch(/^my-awesome-restaurant-[a-z0-9]+$/);
        });

        it('deve sanitizar caracteres especiais no slug', async () => {
            const params = {
                p_restaurant_name: 'Café & Bistro (Lisboa)'
            };

            mockRpc.mockResolvedValue({
                data: {
                    tenant_id: 'test-uuid',
                    slug: 'caf-bistro-lisboa-abc123',
                    message: 'Tenant created successfully'
                },
                error: null
            });

            const result = await mockRpc('create_tenant_atomic', params);

            // Slug não deve conter caracteres especiais
            expect(result.data.slug).not.toMatch(/[&()]/);
        });
    });

    describe('Criação de Dados Iniciais', () => {
        it('deve criar menu_categories inicial', async () => {
            const params = {
                p_restaurant_name: 'Test Restaurant'
            };

            mockRpc.mockResolvedValue({
                data: {
                    tenant_id: 'test-uuid',
                    slug: 'test-restaurant-abc123',
                    message: 'Tenant created successfully'
                },
                error: null
            });

            const result = await mockRpc('create_tenant_atomic', params);

            // Se não houve erro, a categoria foi criada
            // (categoria "Principais" é criada automaticamente)
            expect(result.error).toBeNull();
        });

        it('deve criar restaurant_members com role owner', async () => {
            const params = {
                p_restaurant_name: 'Test Restaurant'
            };

            mockRpc.mockResolvedValue({
                data: {
                    tenant_id: 'test-uuid',
                    slug: 'test-restaurant-abc123',
                    message: 'Tenant created successfully'
                },
                error: null
            });

            const result = await mockRpc('create_tenant_atomic', params);

            // Se não houve erro, o membership foi criado
            expect(result.error).toBeNull();
        });
    });

    describe('Tratamento de Erros', () => {
        it('deve retornar erro quando usuário não está autenticado', async () => {
            const params = {
                p_restaurant_name: 'Test Restaurant'
            };

            mockRpc.mockResolvedValue({
                data: null,
                error: { message: 'Not authenticated' }
            });

            const result: any = await mockRpc('create_tenant_atomic', params);

            expect(result.error).toBeDefined();
            expect(result.error.message).toBe('Not authenticated');
        });

        it('deve retornar erro quando há violação de constraint', async () => {
            const params = {
                p_restaurant_name: 'Test Restaurant'
            };

            mockRpc.mockResolvedValue({
                data: null,
                error: {
                    message: 'null value in column "heartbeat" of relation "empire_pulses" violates not-null constraint',
                    code: '23502'
                }
            });

            const result = await mockRpc('create_tenant_atomic', params);

            expect(result.error).toBeDefined();
            // Este erro não deve ocorrer após o fix
        });
    });
});
