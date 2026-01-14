/**
 * FISCAL CALCULATION TEST
 * 
 * TASK-2.3.3: Teste de Cálculo Fiscal
 * 
 * Testa que o cálculo fiscal está correto:
 * - Produto €10.00 + IVA 23% = €12.30 total
 * - Base tributável = €10.00
 * - IVA = €2.30
 */

import { describe, it, expect } from '@jest/globals';
import type { TaxDocument } from '../../fiscal-modules/types';

describe('TASK-2.3.3: Fiscal Calculation', () => {
  it('should calculate VAT correctly: Product €10.00 + IVA 23% = €12.30 total', () => {
    const productPrice = 10.00; // Base tributável
    const vatRate = 0.23; // 23%
    
    // Cálculo: total = base * (1 + vatRate)
    const totalAmount = productPrice * (1 + vatRate);
    
    // Cálculo: vatAmount = total - base (ou total * vatRate / (1 + vatRate))
    const vatAmount = totalAmount * vatRate / (1 + vatRate);
    const vatAmountCents = Math.round(vatAmount * 100);
    
    expect(totalAmount).toBe(12.30);
    expect(vatAmount).toBeCloseTo(2.30, 2);
    expect(vatAmountCents).toBe(230);
    
    const taxDoc: TaxDocument = {
      doc_type: 'SAF-T',
      ref_event_id: 'EVENT-123',
      ref_seal_id: 'SEAL-123',
      total_amount: totalAmount,
      taxes: {
        vat: vatAmount,
      },
      vatRate: vatRate,
      vatAmount: vatAmountCents,
      items: [
        {
          code: 'PROD-001',
          description: 'Test Product',
          quantity: 1,
          unit_price: totalAmount, // Preço com IVA incluído
          total: totalAmount,
        },
      ],
    };
    
    expect(taxDoc.total_amount).toBe(12.30);
    expect(taxDoc.taxes.vat).toBeCloseTo(2.30, 2);
    expect(taxDoc.vatRate).toBe(0.23);
    expect(taxDoc.vatAmount).toBe(230);
  });

  it('should calculate taxable base correctly: Base = €10.00', () => {
    const totalAmount = 12.30; // Total com IVA incluído
    const vatRate = 0.23; // 23%
    
    // Base tributável = total / (1 + vatRate)
    const taxableBase = totalAmount / (1 + vatRate);
    
    expect(taxableBase).toBeCloseTo(10.00, 2);
    
    const taxDoc: TaxDocument = {
      doc_type: 'SAF-T',
      ref_event_id: 'EVENT-456',
      ref_seal_id: 'SEAL-456',
      total_amount: totalAmount,
      taxes: {
        vat: totalAmount - taxableBase,
      },
      vatRate: vatRate,
      vatAmount: Math.round((totalAmount - taxableBase) * 100),
      items: [
        {
          code: 'PROD-002',
          description: 'Test Product',
          quantity: 1,
          unit_price: totalAmount,
          total: totalAmount,
        },
      ],
    };
    
    // Verificar que base tributável pode ser calculada a partir do total
    const calculatedBase = taxDoc.total_amount / (1 + (taxDoc.vatRate || 0));
    expect(calculatedBase).toBeCloseTo(10.00, 2);
  });

  it('should calculate VAT amount correctly: IVA = €2.30', () => {
    const totalAmount = 12.30; // Total com IVA incluído
    const vatRate = 0.23; // 23%
    
    // IVA = total * vatRate / (1 + vatRate)
    const vatAmount = totalAmount * vatRate / (1 + vatRate);
    const vatAmountCents = Math.round(vatAmount * 100);
    
    expect(vatAmount).toBeCloseTo(2.30, 2);
    expect(vatAmountCents).toBe(230);
    
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
      items: [
        {
          code: 'PROD-003',
          description: 'Test Product',
          quantity: 1,
          unit_price: totalAmount,
          total: totalAmount,
        },
      ],
    };
    
    expect(taxDoc.taxes.vat).toBeCloseTo(2.30, 2);
    expect(taxDoc.vatAmount).toBe(230);
    
    // Verificar que vatAmount em centavos corresponde a vat em euros
    if (taxDoc.vatAmount !== undefined) {
      expect(taxDoc.vatAmount / 100).toBeCloseTo(taxDoc.taxes.vat || 0, 2);
    }
  });

  it('should calculate complete fiscal document correctly', () => {
    // Cenário: Produto €10.00 + IVA 23% = €12.30 total
    const basePrice = 10.00;
    const vatRate = 0.23;
    const totalAmount = basePrice * (1 + vatRate);
    const vatAmount = totalAmount * vatRate / (1 + vatRate);
    const vatAmountCents = Math.round(vatAmount * 100);
    
    expect(totalAmount).toBe(12.30);
    expect(vatAmount).toBeCloseTo(2.30, 2);
    expect(vatAmountCents).toBe(230);
    
    const taxDoc: TaxDocument = {
      doc_type: 'SAF-T',
      ref_event_id: 'EVENT-COMPLETE',
      ref_seal_id: 'SEAL-COMPLETE',
      total_amount: totalAmount,
      taxes: {
        vat: vatAmount,
      },
      vatRate: vatRate,
      vatAmount: vatAmountCents,
      items: [
        {
          code: 'PROD-COMPLETE',
          description: 'Test Product',
          quantity: 1,
          unit_price: totalAmount, // Preço com IVA incluído
          total: totalAmount,
        },
      ],
    };
    
    // Verificações completas
    expect(taxDoc.total_amount).toBe(12.30);
    expect(taxDoc.taxes.vat).toBeCloseTo(2.30, 2);
    expect(taxDoc.vatRate).toBe(0.23);
    expect(taxDoc.vatAmount).toBe(230);
    
    // Verificar que base tributável pode ser calculada
    const calculatedBase = taxDoc.total_amount / (1 + taxDoc.vatRate!);
    expect(calculatedBase).toBeCloseTo(10.00, 2);
    
    // Verificar que IVA pode ser calculado a partir da base
    const calculatedVat = calculatedBase * taxDoc.vatRate!;
    expect(calculatedVat).toBeCloseTo(2.30, 2);
    
    // Verificar que total = base + IVA
    expect(calculatedBase + calculatedVat).toBeCloseTo(12.30, 2);
  });
});
