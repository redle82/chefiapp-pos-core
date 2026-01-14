/**
 * TAX DOCUMENT VAT RATE/AMOUNT TEST
 * 
 * TASK-2.3.1: Teste para verificar separação de vatRate e vatAmount
 * 
 * Testa que TaxDocument tem vatRate (percentual) e vatAmount (valor absoluto) separados
 */

import { describe, it, expect } from '@jest/globals';
import type { TaxDocument } from '../../../fiscal-modules/types';

describe('TASK-2.3.1: TaxDocument vatRate and vatAmount', () => {
  it('should create TaxDocument with both vatRate and vatAmount', () => {
    const taxDoc: TaxDocument = {
      doc_type: 'SAF-T',
      ref_event_id: 'EVENT-123',
      ref_seal_id: 'SEAL-123',
      total_amount: 100.00, // 100 euros
      taxes: {
        vat: 18.70, // IVA em euros (23% de 100 incluído)
      },
      vatRate: 0.23, // 23% (Portugal)
      vatAmount: 1870, // 18.70 euros em centavos
      items: [
        {
          code: 'PROD-001',
          description: 'Test Product',
          quantity: 1,
          unit_price: 100.00,
          total: 100.00,
        },
      ],
    };

    expect(taxDoc.vatRate).toBe(0.23);
    expect(taxDoc.vatAmount).toBe(1870);
    expect(taxDoc.taxes.vat).toBe(18.70);
  });

  it('should create TaxDocument for Spain with 21% VAT', () => {
    const taxDoc: TaxDocument = {
      doc_type: 'TICKETBAI',
      ref_event_id: 'EVENT-456',
      ref_seal_id: 'SEAL-456',
      total_amount: 100.00, // 100 euros
      taxes: {
        vat: 17.36, // IVA em euros (21% de 100 incluído)
      },
      vatRate: 0.21, // 21% (Espanha)
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

    expect(taxDoc.vatRate).toBe(0.21);
    expect(taxDoc.vatAmount).toBe(1736);
    expect(taxDoc.taxes.vat).toBe(17.36);
  });

  it('should calculate vatAmount correctly from vatRate and total_amount', () => {
    const totalAmount = 100.00; // 100 euros
    const vatRate = 0.23; // 23%
    
    // IVA incluído no total: vatAmount = totalAmount * vatRate / (1 + vatRate)
    const vatAmount = totalAmount * vatRate / (1 + vatRate);
    const vatAmountCents = Math.round(vatAmount * 100);

    expect(vatAmount).toBeCloseTo(18.70, 2);
    expect(vatAmountCents).toBe(1870);

    const taxDoc: TaxDocument = {
      doc_type: 'SAF-T',
      ref_event_id: 'EVENT-789',
      ref_seal_id: 'SEAL-789',
      total_amount: totalAmount,
      taxes: {
        vat: vatAmount,
      },
      vatRate: vatRate,
      vatAmount: vatAmountCents,
      items: [],
    };

    expect(taxDoc.vatRate).toBe(0.23);
    expect(taxDoc.vatAmount).toBe(1870);
    expect(taxDoc.taxes.vat).toBeCloseTo(18.70, 2);
  });

  it('should allow TaxDocument without vatRate and vatAmount (backward compatibility)', () => {
    const taxDoc: TaxDocument = {
      doc_type: 'MOCK',
      ref_event_id: 'EVENT-999',
      ref_seal_id: 'SEAL-999',
      total_amount: 50.00,
      taxes: {
        vat: 10.00,
      },
      items: [],
    };

    // vatRate e vatAmount são opcionais
    expect(taxDoc.vatRate).toBeUndefined();
    expect(taxDoc.vatAmount).toBeUndefined();
    expect(taxDoc.taxes.vat).toBe(10.00);
  });
});
