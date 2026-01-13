/**
 * OrderProtection Tests - Testes para proteção de pedidos
 * 
 * Testa:
 * - Geração de chave de idempotência
 * - Verificação de duplicatas
 * - Rate limiting
 * - Registro de submissão
 */

import {
    generateIdempotencyKey,
    checkOrderProtection,
    recordOrderSubmission,
    type OrderProtectionResult,
} from '../../../merchant-portal/src/core/services/OrderProtection';

// Mock TabIsolatedStorage
jest.mock('../../../merchant-portal/src/core/storage/TabIsolatedStorage', () => ({
    getTabIsolated: jest.fn(),
    setTabIsolated: jest.fn(),
}));

import { getTabIsolated, setTabIsolated } from '../../../merchant-portal/src/core/storage/TabIsolatedStorage';

const mockGetTabIsolated = getTabIsolated as jest.MockedFunction<typeof getTabIsolated>;
const mockSetTabIsolated = setTabIsolated as jest.MockedFunction<typeof setTabIsolated>;

describe('OrderProtection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetTabIsolated.mockReturnValue(null);
    });

    describe('generateIdempotencyKey', () => {
        it('deve gerar chave consistente para mesmos itens', () => {
            const items = [
                { product_id: 'prod-1', quantity: 2 },
                { product_id: 'prod-2', quantity: 1 },
            ];
            
            const key1 = generateIdempotencyKey('rest-123', items);
            const key2 = generateIdempotencyKey('rest-123', items);
            
            expect(key1).toBe(key2);
        });

        it('deve gerar chaves diferentes para itens diferentes', () => {
            const items1 = [{ product_id: 'prod-1', quantity: 2 }];
            const items2 = [{ product_id: 'prod-2', quantity: 1 }];
            
            const key1 = generateIdempotencyKey('rest-123', items1);
            const key2 = generateIdempotencyKey('rest-123', items2);
            
            expect(key1).not.toBe(key2);
        });

        it('deve incluir tableNumber na chave quando fornecido', () => {
            const items = [{ product_id: 'prod-1', quantity: 1 }];
            
            const key1 = generateIdempotencyKey('rest-123', items, 5);
            const key2 = generateIdempotencyKey('rest-123', items, 10);
            
            expect(key1).not.toBe(key2);
        });

        it('deve gerar chave diferente para restaurantes diferentes', () => {
            const items = [{ product_id: 'prod-1', quantity: 1 }];
            
            const key1 = generateIdempotencyKey('rest-123', items);
            const key2 = generateIdempotencyKey('rest-456', items);
            
            expect(key1).not.toBe(key2);
        });
    });

    describe('checkOrderProtection', () => {
        it('deve permitir pedido quando não há duplicatas', () => {
            mockGetTabIsolated.mockReturnValue(null);
            
            const result = checkOrderProtection('rest-123', [
                { product_id: 'prod-1', quantity: 1 },
            ]);
            
            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('deve bloquear pedido duplicado recente', () => {
            const idempotencyKey = generateIdempotencyKey('rest-123', [
                { product_id: 'prod-1', quantity: 1 },
            ]);
            
            const recentRecord = {
                key: idempotencyKey,
                timestamp: Date.now() - 60000, // 1 minuto atrás
                orderId: 'order-123',
            };
            
            mockGetTabIsolated.mockReturnValue(JSON.stringify([recentRecord]));
            
            const result = checkOrderProtection('rest-123', [
                { product_id: 'prod-1', quantity: 1 },
            ]);
            
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('duplicado');
        });

        it('deve permitir pedido quando duplicata é antiga', () => {
            const idempotencyKey = generateIdempotencyKey('rest-123', [
                { product_id: 'prod-1', quantity: 1 },
            ]);
            
            const oldRecord = {
                key: idempotencyKey,
                timestamp: Date.now() - 10 * 60 * 1000, // 10 minutos atrás
                orderId: 'order-123',
            };
            
            mockGetTabIsolated.mockReturnValue(JSON.stringify([oldRecord]));
            
            const result = checkOrderProtection('rest-123', [
                { product_id: 'prod-1', quantity: 1 },
            ]);
            
            expect(result.allowed).toBe(true);
        });

        it('deve aplicar rate limiting', () => {
            // Simular múltiplos pedidos recentes
            const recentRecords = Array.from({ length: 10 }, (_, i) => ({
                key: `key-${i}`,
                timestamp: Date.now() - i * 1000, // Últimos 10 segundos
            }));
            
            mockGetTabIsolated.mockReturnValue(JSON.stringify(recentRecords));
            
            const result = checkOrderProtection('rest-123', [
                { product_id: 'prod-1', quantity: 1 },
            ]);
            
            // Deve bloquear se exceder limite de taxa
            if (recentRecords.length >= 5) {
                expect(result.allowed).toBe(false);
                expect(result.reason).toContain('muitos pedidos');
            }
        });
    });

    describe('recordOrderSubmission', () => {
        it('deve registrar submissão de pedido', () => {
            const items = [
                { product_id: 'prod-1', quantity: 1 },
            ];
            
            recordOrderSubmission('rest-123', items, undefined, 'order-123');
            
            expect(mockSetTabIsolated).toHaveBeenCalled();
        });

        it('deve limpar registros antigos ao adicionar novo', () => {
            const oldRecords = [
                {
                    key: 'old-key',
                    timestamp: Date.now() - 10 * 60 * 1000, // 10 minutos
                },
            ];
            
            mockGetTabIsolated.mockReturnValue(JSON.stringify(oldRecords));
            
            const items = [
                { product_id: 'prod-1', quantity: 1 },
            ];
            
            recordOrderSubmission('rest-123', items, undefined, 'order-456');
            
            // Verificar que setTabIsolated foi chamado
            expect(mockSetTabIsolated).toHaveBeenCalled();
        });
    });
});
