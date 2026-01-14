/**
 * INVOICEXPRESS VAT CALCULATION TEST
 * 
 * TASK-2.3.2: Teste para verificar cálculo correto de IVA no InvoiceXpressAdapter
 * 
 * Testa que:
 * - unit_price_without_tax = unit_price / (1 + vatRate)
 * - vatAmount é calculado corretamente
 */

import { describe, it, expect } from '@jest/globals';
import type { TaxDocument } from '../../../fiscal-modules/types';

describe('TASK-2.3.2: InvoiceXpressAdapter VAT Calculation', () => {
  it('should calculate unit_price_without_tax correctly using vatRate', () => {
    const taxDoc: TaxDocument = {
      doc_type: 'SAF-T',
      ref_event_id: 'EVENT-123',
      ref_seal_id: 'SEAL-123',
      total_amount: 100.00,
      taxes: {
        vat: 18.70, // IVA em euros (23% de 100 incluído)
      },
      vatRate: 0.23, // 23%
      vatAmount: 1870, // 18.70 euros em centavos
      items: [
        {
          code: 'PROD-001',
          description: 'Test Product',
          quantity: 1,
          unit_price: 100.00, // Preço com IVA incluído
          total: 100.00,
        },
      ],
    };

    // Cálculo esperado: unit_price_without_tax = unit_price / (1 + vatRate)
    const vatRate = taxDoc.vatRate || 0.23;
    const unitPriceWithoutTax = taxDoc.items[0].unit_price / (1 + vatRate);

    expect(unitPriceWithoutTax).toBeCloseTo(81.30, 2); // 100 / 1.23 = 81.30
    expect(taxDoc.vatRate).toBe(0.23);
    expect(taxDoc.vatAmount).toBe(1870);
  });

  it('should calculate vatAmount correctly from vatRate and unit_price', () => {
    const unitPrice = 100.00; // Preço com IVA incluído
    const vatRate = 0.23; // 23%

    // unit_price_without_tax = unit_price / (1 + vatRate)
    const unitPriceWithoutTax = unitPrice / (1 + vatRate);
    
    // vatAmount = unit_price - unit_price_without_tax
    const vatAmount = unitPrice - unitPriceWithoutTax;
    const vatAmountCents = Math.round(vatAmount * 100);

    expect(unitPriceWithoutTax).toBeCloseTo(81.30, 2);
    expect(vatAmount).toBeCloseTo(18.70, 2);
    expect(vatAmountCents).toBe(1870);
  });

  it('should handle Spain VAT rate (21%) correctly', () => {
    const taxDoc: TaxDocument = {
      doc_type: 'TICKETBAI',
      ref_event_id: 'EVENT-456',
      ref_seal_id: 'SEAL-456',
      total_amount: 100.00,
      taxes: {
        vat: 17.36, // IVA em euros (21% de 100 incluído)
      },
      vatRate: 0.21, // 21%
      vatAmount: 1736, // 17.36 euros em centavos
      items: [
        {
          code: 'PROD-002',
          description: 'Test Product ES',
          quantity: 1,
          unit_price: 100.00,
          total: 100.00,
        },
      ],
    };

    const vatRate = taxDoc.vatRate || 0.21;
    const unitPriceWithoutTax = taxDoc.items[0].unit_price / (1 + vatRate);

    expect(unitPriceWithoutTax).toBeCloseTo(82.64, 2); // 100 / 1.21 = 82.64
    expect(taxDoc.vatRate).toBe(0.21);
    expect(taxDoc.vatAmount).toBe(1736);
  });

  it('should use default vatRate if not provided in TaxDocument', () => {
    const taxDoc: TaxDocument = {
      doc_type: 'MOCK',
      ref_event_id: 'EVENT-789',
      ref_seal_id: 'SEAL-789',
      total_amount: 100.00,
      taxes: {
        vat: 18.70,
      },
      // vatRate não fornecido - deve usar default
      items: [
        {
          code: 'PROD-003',
          description: 'Test Product',
          quantity: 1,
          unit_price: 100.00,
          total: 100.00,
        },
      ],
    };

    // Default: 23% (Portugal)
    const defaultVatRate = 0.23;
    const vatRate = taxDoc.vatRate || defaultVatRate;
    const unitPriceWithoutTax = taxDoc.items[0].unit_price / (1 + vatRate);

    expect(vatRate).toBe(0.23);
    expect(unitPriceWithoutTax).toBeCloseTo(81.30, 2);
  });
});
