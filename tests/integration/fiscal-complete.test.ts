/**
 * FISCAL COMPLETE TEST SUITE
 * 
 * Teste completo e detalhado do sistema fiscal
 * Cobre: adapters, integração, segurança, retry, validação
 * 
 * Data: 18 Janeiro 2026
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InvoiceXpressAdapter } from '../../fiscal-modules/adapters/InvoiceXpressAdapter';
import { SAFTAdapter } from '../../fiscal-modules/adapters/SAFTAdapter';
import { TicketBAIAdapter } from '../../fiscal-modules/adapters/TicketBAIAdapter';
import { ConsoleFiscalAdapter } from '../../fiscal-modules/ConsoleFiscalAdapter';
import type { TaxDocument, FiscalResult } from '../../fiscal-modules/types';
import type { LegalSeal } from '../../legal-boundary/types';
import type { CoreEvent } from '../../event-log/types';

// Mock fetch global
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

describe('🧾 FISCAL COMPLETE TEST SUITE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  // ============================================================
  // 1. TESTES DE ADAPTERS (UNITÁRIOS)
  // ============================================================

  describe('1. InvoiceXpressAdapter', () => {
    const mockTaxDoc: TaxDocument = {
      doc_type: 'MOCK',
      ref_event_id: 'EVENT-123',
      ref_seal_id: 'SEAL-123',
      total_amount: 25.50,
      taxes: {
        vat: 5.36, // 23% IVA Portugal
      },
      items: [
        {
          code: 'PROD-001',
          description: 'Bacalhau à Brás',
          quantity: 2,
          unit_price: 12.75,
          total: 25.50,
        },
      ],
      raw_payload: {
        order_id: 'ORDER-123',
        restaurant_id: 'REST-123',
      },
    };

    const mockSeal: LegalSeal = {
      seal_id: 'SEAL-123',
      entity_type: 'ORDER',
      entity_id: 'ORDER-123',
      seal_event_id: 'EVENT-123',
      stream_hash: 'HASH-123',
      sealed_at: new Date(),
      sequence: 1,
      legal_state: 'PAYMENT_SEALED',
      financial_state: JSON.stringify({ amount: 2550 }),
    };

    const mockEvent: CoreEvent = {
      event_id: 'EVENT-123',
      stream_id: 'ORDER:ORDER-123',
      stream_version: 0,
      type: 'PAYMENT_CONFIRMED',
      payload: {
        order_id: 'ORDER-123',
        amount_cents: 2550,
        tax_document: mockTaxDoc,
      },
      occurred_at: new Date(),
      idempotency_key: 'fiscal:ORDER-123',
    };

    it('1.1 - Deve criar adapter sem config (fallback)', () => {
      const adapter = new InvoiceXpressAdapter();
      expect(adapter).toBeInstanceOf(InvoiceXpressAdapter);
    });

    it('1.2 - Deve criar adapter com accountName apenas (P0-1 fix)', () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
        // apiKey não é necessária - backend busca
      });
      expect(adapter).toBeInstanceOf(InvoiceXpressAdapter);
    });

    it('1.3 - Deve rejeitar quando accountName não configurado', async () => {
      const adapter = new InvoiceXpressAdapter();
      const result = await adapter.onSealed(mockSeal, {
        ...mockEvent,
        payload: {
          ...mockEvent.payload,
          tax_document: mockTaxDoc,
        },
      });

      expect(result.status).toBe('REJECTED');
      expect(result.error_details).toContain('Fiscal credentials not configured');
    });

    it('1.4 - Deve usar backend proxy (não expor API key)', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn(() => 'test-token'),
      };
      (global as any).localStorage = mockLocalStorage;
      (global as any).window = { localStorage: mockLocalStorage };

      // Mock fetch para backend proxy
      mockFetch.mockResolvedValueOnce(createMockResponse({
        invoice: {
          id: 12345,
          pdf: { url: 'https://test.app.invoicexpress.com/documents/12345.pdf' },
          qr_code: 'QR-CODE-123',
          fiscal_signature: 'SIGNATURE-123',
        },
      }));

      const result = await adapter.onSealed(mockSeal, {
        ...mockEvent,
        payload: {
          ...mockEvent.payload,
          tax_document: mockTaxDoc,
        },
      });

      // Verificar que chamou backend proxy (não InvoiceXpress diretamente)
      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/fiscal/invoicexpress/invoices');
      expect(callUrl).not.toContain('api_key='); // P0-1: API key nunca na URL

      expect(result.status).toBe('REPORTED');
      expect(result.gov_protocol).toBe('12345');
    });

    it('1.5 - Deve fazer retry com backoff exponencial em erro de rede', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      // Mock: 2 falhas de rede, depois sucesso
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse({ invoice: { id: 12345 } }));

      const result = await adapter.onSealed(mockSeal, {
        ...mockEvent,
        payload: {
          ...mockEvent.payload,
          tax_document: mockTaxDoc,
        },
      });

      // Deve ter tentado 3 vezes (2 falhas + 1 sucesso)
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.status).toBe('REPORTED');
    });

    it('1.6 - Deve retornar PENDING após max retries', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      // Mock: sempre falha
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await adapter.onSealed(mockSeal, {
        ...mockEvent,
        payload: {
          ...mockEvent.payload,
          tax_document: mockTaxDoc,
        },
      });

      // Deve ter tentado 3 vezes (MAX_RETRIES)
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.status).toBe('PENDING');
      expect(result.error_details).toBeDefined();
    });

    it('1.7 - Deve mapear TaxDocument corretamente para InvoiceXpress', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      let capturedBody: any = null;
      mockFetch.mockImplementationOnce(async (url: any, options: any): Promise<Response> => {
        capturedBody = JSON.parse(options.body as string);
        return createMockResponse({ invoice: { id: 12345 } });
      });

      await adapter.onSealed(mockSeal, {
        ...mockEvent,
        payload: {
          ...mockEvent.payload,
          tax_document: mockTaxDoc,
        },
      });

      // Verificar estrutura do invoice enviado
      expect(capturedBody).toBeDefined();
      expect(capturedBody.invoice).toBeDefined();
      expect(capturedBody.invoice.items).toHaveLength(1);
      expect(capturedBody.invoice.items[0].name).toBe('Bacalhau à Brás');
      expect(capturedBody.invoice.items[0].quantity).toBe(2);
      expect(capturedBody.invoice.items[0].unit_price).toBe(12.75);
      expect(capturedBody.invoice.items[0].tax.value).toBe(23); // 23% IVA
      expect(capturedBody.accountName).toBe('test-account');
      expect(capturedBody.invoice).not.toHaveProperty('api_key'); // P0-1: nunca enviar API key
    });
  });

  // ============================================================
  // 2. TESTES DE ADAPTERS REGIONAIS
  // ============================================================

  describe('2. SAFTAdapter (Portugal)', () => {
    const mockTaxDoc: TaxDocument = {
      doc_type: 'SAF-T',
      ref_event_id: 'EVENT-123',
      ref_seal_id: 'SEAL-123',
      total_amount: 25.50,
      taxes: {
        vat: 5.87, // 23% IVA
      },
      items: [
        {
          code: 'PROD-001',
          description: 'Bacalhau à Brás',
          quantity: 2,
          unit_price: 12.75,
          total: 25.50,
        },
      ],
      raw_payload: {
        order_id: 'ORDER-123',
        restaurant_id: 'REST-123',
        restaurant_name: 'Restaurante Teste',
        address: 'Rua Teste, 123',
        city: 'Lisboa',
        postal_code: '1000-000',
        tax_registration_number: '123456789',
      },
    };

    it('2.1 - Deve gerar XML SAF-T válido', async () => {
      const adapter = new SAFTAdapter();
      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      expect(result.status).toBe('REPORTED');
      expect(result.gov_protocol).toBeDefined();
      
      // Verificar que XML foi gerado
      const xml = result.gov_protocol || '';
      expect(xml).toContain('<?xml');
      expect(xml).toContain('SAF-T');
      expect(xml).toContain('Bacalhau à Brás');
      expect(xml).toContain('25.50');
    });

    it('2.2 - Deve incluir campos obrigatórios no XML', async () => {
      const adapter = new SAFTAdapter();
      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      const xml = result.gov_protocol || '';
      
      // Campos obrigatórios SAF-T
      expect(xml).toContain('TaxRegistrationNumber'); // NIF
      expect(xml).toContain('CompanyName'); // Nome restaurante
      expect(xml).toContain('Address'); // Endereço
      expect(xml).toContain('City'); // Cidade
      expect(xml).toContain('PostalCode'); // Código postal
      expect(xml).toContain('Tax'); // IVA
      expect(xml).toContain('23'); // 23% IVA Portugal
    });
  });

  describe('3. TicketBAIAdapter (Espanha)', () => {
    const mockTaxDoc: TaxDocument = {
      doc_type: 'TICKETBAI',
      ref_event_id: 'EVENT-123',
      ref_seal_id: 'SEAL-123',
      total_amount: 25.50,
      taxes: {
        vat: 5.36, // 21% IVA Espanha
      },
      items: [
        {
          code: 'PROD-001',
          description: 'Paella Valenciana',
          quantity: 1,
          unit_price: 25.50,
          total: 25.50,
        },
      ],
      raw_payload: {
        order_id: 'ORDER-123',
        restaurant_id: 'REST-123',
      },
    };

    it('3.1 - Deve gerar XML TicketBAI válido', async () => {
      const adapter = new TicketBAIAdapter();
      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      expect(result.status).toBe('REPORTED');
      expect(result.gov_protocol).toBeDefined();
      
      const xml = result.gov_protocol || '';
      expect(xml).toContain('<?xml');
      expect(xml).toContain('TicketBAI');
      expect(xml).toContain('21'); // 21% IVA Espanha
    });
  });

  // ============================================================
  // 3. TESTES DE SEGURANÇA (P0-1)
  // ============================================================

  describe('4. Segurança Fiscal (P0-1 Fix)', () => {
    it('4.1 - API key NUNCA deve ser enviada do cliente', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      mockFetch.mockResolvedValueOnce(createMockResponse({ invoice: { id: 12345 } }));

      const mockTaxDoc: TaxDocument = {
        doc_type: 'MOCK',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: { vat: 0 },
        items: [],
        raw_payload: {},
      };

      await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Verificar que URL não contém api_key
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).not.toContain('api_key=');
      expect(callUrl).not.toContain('apiKey');
      
      // Verificar que body não contém api_key
      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(callBody).not.toHaveProperty('apiKey');
      expect(callBody).not.toHaveProperty('api_key');
    });

    it('4.2 - Deve usar backend proxy para InvoiceXpress', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      mockFetch.mockResolvedValueOnce(createMockResponse({ invoice: { id: 12345 } }));

      const mockTaxDoc: TaxDocument = {
        doc_type: 'MOCK',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: { vat: 0 },
        items: [],
        raw_payload: {},
      };

      await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Verificar que chamou backend proxy
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/fiscal/invoicexpress/invoices');
      expect(callUrl).not.toContain('invoicexpress.com'); // Não chama diretamente
    });
  });

  // ============================================================
  // 5. TESTES DE RETRY E RESILIÊNCIA
  // ============================================================

  describe('5. Retry e Resiliência (P0-4 Fix)', () => {
    it('5.1 - Deve retornar PENDING para retry em background', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      // Mock: erro 500 (retriable)
      mockFetch.mockResolvedValueOnce(createMockResponse(
        { error: 'Internal Server Error' },
        false,
        500
      ));

      const mockTaxDoc: TaxDocument = {
        doc_type: 'MOCK',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: { vat: 0 },
        items: [],
        raw_payload: {},
      };

      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Deve retornar PENDING para retry em background
      expect(result.status).toBe('PENDING');
      expect(result.error_details).toBeDefined();
    });

    it('5.2 - Deve fazer retry com backoff exponencial', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      // Mock: falhas de rede (retriable)
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network error');
        }
        return {
          ok: true,
          json: async () => ({ invoice: { id: 12345 } }),
        };
      });

      const mockTaxDoc: TaxDocument = {
        doc_type: 'MOCK',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: { vat: 0 },
        items: [],
        raw_payload: {},
      };

      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Deve ter tentado 3 vezes
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result.status).toBe('REPORTED');
    });
  });

  // ============================================================
  // 6. TESTES DE VALIDAÇÃO DE DADOS
  // ============================================================

  describe('6. Validação de Dados', () => {
    it('6.1 - Deve validar TaxDocument completo', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      let capturedBody: any = null;
      mockFetch.mockImplementationOnce(async (url: any, options: any): Promise<Response> => {
        capturedBody = JSON.parse(options.body as string);
        return createMockResponse({ invoice: { id: 12345 } });
      });

      const mockTaxDoc: TaxDocument = {
        doc_type: 'MOCK',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: {
          vat: 5.87,
        },
        items: [
          {
            code: 'PROD-001',
            description: 'Bacalhau à Brás',
            quantity: 2,
            unit_price: 12.75,
            total: 25.50,
          },
        ],
        raw_payload: {
          order_id: 'ORDER-123',
        },
      };

      await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Verificar que todos os campos foram mapeados
      expect(capturedBody.invoice.items).toHaveLength(1);
      expect(capturedBody.invoice.items[0].name).toBe('Bacalhau à Brás');
      expect(capturedBody.invoice.items[0].quantity).toBe(2);
      expect(capturedBody.invoice.items[0].unit_price).toBe(12.75);
      expect(capturedBody.invoice.items[0].tax.value).toBe(23); // 23% IVA
    });

    it('6.2 - Deve calcular IVA corretamente', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      let capturedBody: any = null;
      mockFetch.mockImplementationOnce(async (url: any, options: any): Promise<Response> => {
        capturedBody = JSON.parse(options.body as string);
        return createMockResponse({ invoice: { id: 12345 } });
      });

      const mockTaxDoc: TaxDocument = {
        doc_type: 'MOCK',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 100.00,
        taxes: {
          vat: 23.00, // 23% IVA Portugal
        },
        items: [
          {
            code: 'PROD-001',
            description: 'Item Teste',
            quantity: 1,
            unit_price: 100.00,
            total: 100.00,
          },
        ],
        raw_payload: {},
      };

      await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 10000 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Verificar cálculo de IVA
      expect(capturedBody.invoice.items[0].tax.value).toBe(23); // 23%
      expect(capturedBody.invoice.items[0].unit_price_without_tax).toBeCloseTo(81.30, 2); // 100 / 1.23
    });
  });

  // ============================================================
  // 7. TESTES DE EDGE CASES
  // ============================================================

  describe('7. Edge Cases', () => {
    it('7.1 - Deve lidar com TaxDocument ausente (fallback)', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      mockFetch.mockResolvedValueOnce(createMockResponse({ invoice: { id: 12345 } }));

      // Event sem tax_document
      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            amount_cents: 2550,
            // tax_document ausente
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Deve criar fallback TaxDocument
      expect(result.status).toBe('REPORTED');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('7.2 - Deve lidar com timeout', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      // Mock: timeout
      mockFetch.mockImplementationOnce(async (): Promise<Response> => {
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20s (mais que timeout de 15s)
        return createMockResponse({ invoice: { id: 12345 } });
      });

      const mockTaxDoc: TaxDocument = {
        doc_type: 'MOCK',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: { vat: 0 },
        items: [],
        raw_payload: {},
      };

      // Usar AbortController para timeout
      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Deve retornar PENDING após timeout
      expect(result.status).toBe('PENDING');
    });

    it('7.3 - Deve lidar com erro 400 (não retriable)', async () => {
      const adapter = new InvoiceXpressAdapter({
        accountName: 'test-account',
      });

      (global as any).localStorage = { getItem: () => 'test-token' };
      (global as any).window = { localStorage: (global as any).localStorage };

      // Mock: erro 400 (client error - não retriable)
      mockFetch.mockResolvedValueOnce(createMockResponse(
        { error: 'Bad Request' },
        false,
        400
      ));

      const mockTaxDoc: TaxDocument = {
        doc_type: 'MOCK',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: { vat: 0 },
        items: [],
        raw_payload: {},
      };

      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      // Não deve fazer retry em erro 400
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('PENDING');
    });
  });

  // ============================================================
  // 8. TESTES DE CONFORMIDADE LEGAL
  // ============================================================

  describe('8. Conformidade Legal', () => {
    it('8.1 - SAF-T deve incluir todos os campos obrigatórios', async () => {
      const adapter = new SAFTAdapter();
      const mockTaxDoc: TaxDocument = {
        doc_type: 'SAF-T',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: {
          vat: 5.87,
        },
        items: [
          {
            code: 'PROD-001',
            description: 'Bacalhau à Brás',
            quantity: 2,
            unit_price: 12.75,
            total: 25.50,
          },
        ],
        raw_payload: {
          order_id: 'ORDER-123',
          restaurant_id: 'REST-123',
          restaurant_name: 'Restaurante Teste',
          address: 'Rua Teste, 123',
          city: 'Lisboa',
          postal_code: '1000-000',
          tax_registration_number: '123456789',
        },
      };

      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      const xml = result.gov_protocol || '';
      
      // Campos obrigatórios SAF-T Portugal
      expect(xml).toContain('TaxRegistrationNumber'); // NIF
      expect(xml).toContain('CompanyName'); // Nome
      expect(xml).toContain('Address'); // Endereço
      expect(xml).toContain('City'); // Cidade
      expect(xml).toContain('PostalCode'); // Código postal
      expect(xml).toContain('Tax'); // IVA
      expect(xml).toContain('23'); // 23% IVA
    });

    it('8.2 - TicketBAI deve incluir campos obrigatórios', async () => {
      const adapter = new TicketBAIAdapter();
      const mockTaxDoc: TaxDocument = {
        doc_type: 'TICKETBAI',
        ref_event_id: 'EVENT-123',
        ref_seal_id: 'SEAL-123',
        total_amount: 25.50,
        taxes: {
          vat: 5.36, // 21% IVA
        },
        items: [
          {
            code: 'PROD-001',
            description: 'Paella Valenciana',
            quantity: 1,
            unit_price: 25.50,
            total: 25.50,
          },
        ],
        raw_payload: {
          order_id: 'ORDER-123',
        },
      };

      const result = await adapter.onSealed(
        {
          seal_id: 'SEAL-123',
          entity_type: 'ORDER',
          entity_id: 'ORDER-123',
          legal_state: 'PAYMENT_SEALED',
          financial_state: JSON.stringify({ amount: 2550 }),
          created_at: new Date(),
        } as any as LegalSeal,
        {
          event_id: 'EVENT-123',
          stream_id: 'ORDER:ORDER-123',
          stream_version: 0,
          type: 'PAYMENT_CONFIRMED',
          payload: {
            order_id: 'ORDER-123',
            tax_document: mockTaxDoc,
          },
          occurred_at: new Date(),
          idempotency_key: 'fiscal:ORDER-123',
        } as CoreEvent
      );

      const xml = result.gov_protocol || '';
      
      // Campos obrigatórios TicketBAI Espanha
      expect(xml).toContain('TicketBAI');
      expect(xml).toContain('21'); // 21% IVA
    });
  });
});
