/**
 * FISCAL COMPLIANCE TEST SUITE
 * 
 * Testa validação de conformidade legal para documentos fiscais
 * Cobre: Portugal (SAF-T) e Espanha (TicketBAI)
 * 
 * Data: 18 Janeiro 2026
 */

import { describe, it, expect } from '@jest/globals';
import { LegalComplianceValidator, ValidationError } from '../../fiscal-modules/validators/LegalComplianceValidator';
import type { TaxDocument } from '../../fiscal-modules/types';

describe('🧾 FISCAL COMPLIANCE VALIDATION', () => {
    describe('1. Validações Comuns', () => {
        it('1.1 - Deve validar total_amount obrigatório', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 0, // Inválido
                taxes: { vat: 0 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 10.00,
                        total: 10.00,
                    },
                ],
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'total_amount')).toBe(true);
        });

        it('1.2 - Deve validar items obrigatórios', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.50,
                taxes: { vat: 0 },
                items: [], // Inválido
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'items')).toBe(true);
        });

        it('1.3 - Deve validar cálculo de total dos itens', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.50,
                taxes: { vat: 0 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item 1',
                        quantity: 2,
                        unit_price: 10.00,
                        total: 20.00,
                    },
                    {
                        code: 'PROD-002',
                        description: 'Item 2',
                        quantity: 1,
                        unit_price: 5.00,
                        total: 5.00,
                    },
                ],
            };

            // Total dos itens = 25.00, mas total_amount = 25.50
            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'total_amount' && e.message.includes('Soma dos itens'))).toBe(true);
        });

        it('1.4 - Deve validar cálculo de total por item', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.00,
                taxes: { vat: 0 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item 1',
                        quantity: 2,
                        unit_price: 10.00,
                        total: 25.00, // Errado: deveria ser 20.00
                    },
                ],
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field.includes('items[0].total'))).toBe(true);
        });
    });

    describe('2. Validações Portugal (SAF-T)', () => {
        it('2.1 - Deve validar IVA obrigatório', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.50,
                taxes: {}, // IVA ausente
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 25.50,
                        total: 25.50,
                    },
                ],
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.errors.some(e => e.field === 'taxes.vat')).toBe(true);
        });

        it('2.2 - Deve validar taxa de IVA padrão (23%)', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 123.00, // 100 + 23% IVA
                taxes: { vat: 23.00 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 123.00,
                        total: 123.00,
                    },
                ],
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            // Deve passar (23% é válido)
            expect(result.errors.filter(e => e.field === 'taxes.vat').length).toBe(0);
        });

        it('2.3 - Deve avisar sobre taxa de IVA não padrão', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 110.00, // 100 + 10% IVA (não padrão)
                taxes: { vat: 10.00 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 110.00,
                        total: 110.00,
                    },
                ],
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.warnings.some(w => w.field === 'taxes.vat' && w.message.includes('não é padrão'))).toBe(true);
        });

        it('2.4 - Deve validar campos obrigatórios SAF-T', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.50,
                taxes: { vat: 5.87 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 25.50,
                        total: 25.50,
                    },
                ],
                raw_payload: {
                    // Campos obrigatórios ausentes
                },
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.errors.some(e => e.field.includes('raw_payload.restaurant_name'))).toBe(true);
            expect(result.errors.some(e => e.field.includes('raw_payload.tax_registration_number'))).toBe(true);
        });

        it('2.5 - Deve validar formato NIF (9 dígitos)', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.50,
                taxes: { vat: 5.87 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 25.50,
                        total: 25.50,
                    },
                ],
                raw_payload: {
                    restaurant_name: 'Restaurante Teste',
                    tax_registration_number: '12345', // Inválido (5 dígitos)
                    address: 'Rua Teste',
                    city: 'Lisboa',
                    postal_code: '1000-000',
                },
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.errors.some(e => e.field.includes('tax_registration_number') && e.message.includes('9 dígitos'))).toBe(true);
        });

        it('2.6 - Deve validar formato código postal (XXXX-XXX)', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'SAF-T',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.50,
                taxes: { vat: 5.87 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 25.50,
                        total: 25.50,
                    },
                ],
                raw_payload: {
                    restaurant_name: 'Restaurante Teste',
                    tax_registration_number: '123456789',
                    address: 'Rua Teste',
                    city: 'Lisboa',
                    postal_code: '1000000', // Inválido (sem hífen)
                },
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'PT');
            expect(result.warnings.some(w => w.field.includes('postal_code') && w.message.includes('XXXX-XXX'))).toBe(true);
        });
    });

    describe('3. Validações Espanha (TicketBAI)', () => {
        it('3.1 - Deve validar IVA obrigatório', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'TICKETBAI',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.50,
                taxes: {}, // IVA ausente
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 25.50,
                        total: 25.50,
                    },
                ],
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'ES');
            expect(result.errors.some(e => e.field === 'taxes.vat')).toBe(true);
        });

        it('3.2 - Deve validar taxa de IVA padrão (21%)', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'TICKETBAI',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 121.00, // 100 + 21% IVA
                taxes: { vat: 21.00 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 121.00,
                        total: 121.00,
                    },
                ],
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'ES');
            // Deve passar (21% é válido)
            expect(result.errors.filter(e => e.field === 'taxes.vat').length).toBe(0);
        });

        it('3.3 - Deve validar campos obrigatórios TicketBAI', () => {
            const taxDoc: TaxDocument = {
                doc_type: 'TICKETBAI',
                ref_event_id: 'EVENT-123',
                ref_seal_id: 'SEAL-123',
                total_amount: 25.50,
                taxes: { vat: 5.36 },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Item Teste',
                        quantity: 1,
                        unit_price: 25.50,
                        total: 25.50,
                    },
                ],
                raw_payload: {
                    // Campos obrigatórios ausentes
                },
            };

            const result = LegalComplianceValidator.validate(taxDoc, 'ES');
            expect(result.errors.some(e => e.field.includes('raw_payload.restaurant_name'))).toBe(true);
            expect(result.errors.some(e => e.field.includes('raw_payload.tax_registration_number'))).toBe(true);
        });
    });

    describe('4. Validações de Data/Hora', () => {
        it('4.1 - Deve validar data válida', () => {
            const validDate = new Date();
            const result = LegalComplianceValidator.validateDateTime(validDate);
            expect(result).toBeNull();
        });

        it('4.2 - Deve rejeitar data inválida', () => {
            const invalidDate = new Date('invalid');
            const result = LegalComplianceValidator.validateDateTime(invalidDate);
            expect(result).not.toBeNull();
            expect(result?.severity).toBe('error');
        });

        it('4.3 - Deve avisar sobre data futura', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const result = LegalComplianceValidator.validateDateTime(futureDate);
            expect(result).not.toBeNull();
            expect(result?.severity).toBe('warning');
        });
    });

    describe('5. Validações de Protocolo Fiscal', () => {
        it('5.1 - Deve validar protocolo obrigatório', () => {
            const result = LegalComplianceValidator.validateFiscalProtocol('');
            expect(result).not.toBeNull();
            expect(result?.severity).toBe('error');
        });

        it('5.2 - Deve validar protocolo muito curto', () => {
            const result = LegalComplianceValidator.validateFiscalProtocol('123');
            expect(result).not.toBeNull();
            expect(result?.severity).toBe('warning');
        });

        it('5.3 - Deve aceitar protocolo válido', () => {
            const result = LegalComplianceValidator.validateFiscalProtocol('123456789');
            expect(result).toBeNull();
        });
    });
});
