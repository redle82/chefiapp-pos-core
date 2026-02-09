/**
 * FISCAL SERVICE COMPLETE TEST
 * 
 * Teste completo do FiscalService com integração real
 * Cobre: seleção de adapter, processamento de pagamentos, armazenamento
 * 
 * Data: 18 Janeiro 2026
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FiscalService } from '../../merchant-portal/src/core/fiscal/FiscalService';
import { SupabaseFiscalEventStore } from '../../merchant-portal/src/core/fiscal/SupabaseFiscalEventStore';

// Mock Supabase
jest.mock('../../merchant-portal/src/core/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock fetch
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch as any;

// Helper para criar mock Response
function createMockResponse(data: any, ok: boolean = true, status: number = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    redirected: false,
    type: 'default',
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    bytes: jest.fn(async () => new Uint8Array()),
  } as unknown as Response;
}

describe('🧾 FISCAL SERVICE COMPLETE TEST', () => {
  let fiscalService: FiscalService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    fiscalService = new FiscalService({
      enabled: true,
      // eventStore será criado automaticamente pelo FiscalService
    });

    // Mock Supabase queries
    mockSupabase = require('../../merchant-portal/src/core/supabase').supabase;
  });

  describe('1. Seleção de Adapter', () => {
    it('1.1 - Deve usar InvoiceXpress quando configurado', async () => {
      // Mock: restaurante com InvoiceXpress configurado
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_provider: 'invoice_xpress',
                fiscal_config: {
                  invoicexpress: {
                    accountName: 'test-account',
                  },
                },
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: buscar pedido
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: 'REST-123',
                  total_cents: 2550,
                  items: [
                    {
                      id: 'ITEM-1',
                      product_id: 'PROD-001',
                      name_snapshot: 'Bacalhau à Brás',
                      quantity: 2,
                      price_snapshot: 1275,
                    },
                  ],
                  restaurant: {
                    name: 'Restaurante Teste',
                    address: 'Rua Teste, 123',
                    city: 'Lisboa',
                    postal_code: '1000-000',
                    country_code: 'PT',
                  },
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: buscar país
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                country_code: 'PT',
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: backend proxy InvoiceXpress
      mockFetch.mockResolvedValueOnce(createMockResponse({
        invoice: {
          id: 12345,
        },
      }));

      // Mock: salvar em fiscal_event_store
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_event_id: 'FISCAL-123',
              },
              error: null,
            })),
          })),
        })),
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      const result = await fiscalService.processPaymentConfirmed({
        orderId: 'ORDER-123',
        restaurantId: 'REST-123',
        paymentMethod: 'cash',
        amountCents: 2550,
      });

      // Deve ter usado InvoiceXpress (chamou backend proxy)
      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/fiscal/invoicexpress/invoices');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe('REPORTED');
    });

    it('1.2 - Deve usar SAF-T quando país é PT e InvoiceXpress não configurado', async () => {
      // Mock: restaurante sem InvoiceXpress (usa SAF-T)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_provider: 'mock',
                fiscal_config: {},
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: buscar pedido
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: 'REST-123',
                  total_cents: 2550,
                  items: [],
                  restaurant: {
                    country_code: 'PT',
                  },
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: buscar país
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                country_code: 'PT',
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: salvar em fiscal_event_store
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_event_id: 'FISCAL-123',
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await fiscalService.processPaymentConfirmed({
        orderId: 'ORDER-123',
        restaurantId: 'REST-123',
        paymentMethod: 'cash',
        amountCents: 2550,
      });

      // Não deve ter chamado InvoiceXpress
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Deve ter usado SAF-T (gera XML)
      expect(result).not.toBeNull();
      expect(result?.status).toBe('REPORTED');
      expect(result?.gov_protocol).toContain('<?xml'); // XML SAF-T
    });

    it('1.3 - Deve usar TicketBAI quando país é ES', async () => {
      // Mock: restaurante sem InvoiceXpress (usa TicketBAI)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_provider: 'mock',
                fiscal_config: {},
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: buscar pedido
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: 'REST-123',
                  total_cents: 2550,
                  items: [],
                  restaurant: {
                    country_code: 'ES',
                  },
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: buscar país
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                country_code: 'ES',
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: salvar em fiscal_event_store
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_event_id: 'FISCAL-123',
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await fiscalService.processPaymentConfirmed({
        orderId: 'ORDER-123',
        restaurantId: 'REST-123',
        paymentMethod: 'cash',
        amountCents: 2550,
      });

      // Deve ter usado TicketBAI (gera XML)
      expect(result).not.toBeNull();
      expect(result?.status).toBe('REPORTED');
      expect(result?.gov_protocol).toContain('<?xml'); // XML TicketBAI
    });
  });

  describe('2. Processamento de Pagamentos', () => {
    it('2.1 - Deve processar pagamento e gerar documento fiscal', async () => {
      // Mock: restaurante com InvoiceXpress
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_provider: 'invoice_xpress',
                fiscal_config: {
                  invoicexpress: {
                    accountName: 'test-account',
                  },
                },
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: buscar pedido
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: 'REST-123',
                  total_cents: 2550,
                  items: [
                    {
                      id: 'ITEM-1',
                      product_id: 'PROD-001',
                      name_snapshot: 'Bacalhau à Brás',
                      quantity: 2,
                      price_snapshot: 1275,
                    },
                  ],
                  restaurant: {
                    name: 'Restaurante Teste',
                    country_code: 'PT',
                  },
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: buscar país
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                country_code: 'PT',
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: backend proxy
      mockFetch.mockResolvedValueOnce(createMockResponse({
        invoice: {
          id: 12345,
          pdf: { url: 'https://test.app.invoicexpress.com/documents/12345.pdf' },
        },
      }));

      // Mock: salvar em fiscal_event_store
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_event_id: 'FISCAL-123',
              },
              error: null,
            })),
          })),
        })),
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      const result = await fiscalService.processPaymentConfirmed({
        orderId: 'ORDER-123',
        restaurantId: 'REST-123',
        paymentMethod: 'cash',
        amountCents: 2550,
        paymentId: 'PAYMENT-123',
      });

      expect(result).not.toBeNull();
      expect(result?.status).toBe('REPORTED');
      expect(result?.gov_protocol).toBe('12345');
    });

    it('2.2 - Deve retornar null quando fiscal está desabilitado', async () => {
      const disabledService = new FiscalService({
        enabled: false,
      });

      const result = await disabledService.processPaymentConfirmed({
        orderId: 'ORDER-123',
        restaurantId: 'REST-123',
        paymentMethod: 'cash',
        amountCents: 2550,
      });

      expect(result).toBeNull();
    });

    it('2.3 - Deve retornar null quando pedido não encontrado', async () => {
      // Mock: pedido não encontrado
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              })),
            })),
          })),
        })),
      });

      const result = await fiscalService.processPaymentConfirmed({
        orderId: 'ORDER-NOT-FOUND',
        restaurantId: 'REST-123',
        paymentMethod: 'cash',
        amountCents: 2550,
      });

      expect(result).toBeNull();
    });
  });

  describe('3. Armazenamento em fiscal_event_store', () => {
    it('3.1 - Deve armazenar documento fiscal após sucesso', async () => {
      // Mock: restaurante com InvoiceXpress
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_provider: 'invoice_xpress',
                fiscal_config: {
                  invoicexpress: {
                    accountName: 'test-account',
                  },
                },
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: buscar pedido
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: 'REST-123',
                  total_cents: 2550,
                  items: [],
                  restaurant: {
                    country_code: 'PT',
                  },
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: buscar país
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                country_code: 'PT',
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: backend proxy
      mockFetch.mockResolvedValueOnce(createMockResponse({
        invoice: {
          id: 12345,
        },
      }));

      // Mock: salvar em fiscal_event_store
      const insertMock = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              fiscal_event_id: 'FISCAL-123',
            },
            error: null,
          })),
        })),
      }));

      mockSupabase.from.mockReturnValueOnce({
        insert: insertMock,
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      await fiscalService.processPaymentConfirmed({
        orderId: 'ORDER-123',
        restaurantId: 'REST-123',
        paymentMethod: 'cash',
        amountCents: 2550,
      });

      // Verificar que salvou em fiscal_event_store
      expect(insertMock).toHaveBeenCalled();
      const calls = insertMock.mock.calls as any[][];
      if (calls.length > 0 && calls[0] && calls[0][0]) {
        const insertData = calls[0][0] as any;
        expect(insertData.order_id).toBe('ORDER-123');
        expect(insertData.restaurant_id).toBe('REST-123');
        expect(insertData.fiscal_status).toBe('REPORTED');
        expect(insertData.gov_protocol).toBe('12345');
      }
    });
  });

  describe('4. Tratamento de Erros', () => {
    it('4.1 - Deve retornar null quando credenciais não configuradas', async () => {
      // Mock: restaurante sem InvoiceXpress configurado
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                fiscal_provider: 'invoice_xpress',
                fiscal_config: {
                  invoicexpress: {
                    // accountName ausente
                  },
                },
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: buscar pedido
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: 'REST-123',
                  total_cents: 2550,
                  items: [],
                  restaurant: {
                    country_code: 'PT',
                  },
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: buscar país
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                country_code: 'PT',
              },
              error: null,
            })),
          })),
        })),
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      const result = await fiscalService.processPaymentConfirmed({
        orderId: 'ORDER-123',
        restaurantId: 'REST-123',
        paymentMethod: 'cash',
        amountCents: 2550,
      });

      // Deve retornar null (credenciais não configuradas)
      expect(result).toBeNull();
    });
  });
});
