/**
 * Legal Compliance Validator
 * 
 * Valida conformidade legal de documentos fiscais para Portugal e Espanha
 * Garante que todos os campos obrigatórios estão presentes e corretos
 */

import type { TaxDocument } from '../types';

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

export class LegalComplianceValidator {
    /**
     * Valida documento fiscal baseado no tipo e país
     */
    static validate(taxDoc: TaxDocument, country: 'PT' | 'ES'): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Validações comuns
        this.validateCommonFields(taxDoc, errors, warnings);

        // Validações específicas por país
        if (country === 'PT') {
            this.validatePortugal(taxDoc, errors, warnings);
        } else if (country === 'ES') {
            this.validateSpain(taxDoc, errors, warnings);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Validações comuns para todos os países
     */
    private static validateCommonFields(
        taxDoc: TaxDocument,
        errors: ValidationError[],
        warnings: ValidationError[]
    ): void {
        // Total amount obrigatório
        if (!taxDoc.total_amount || taxDoc.total_amount <= 0) {
            errors.push({
                field: 'total_amount',
                message: 'Valor total deve ser maior que zero',
                severity: 'error',
            });
        }

        // Items obrigatórios
        if (!taxDoc.items || taxDoc.items.length === 0) {
            errors.push({
                field: 'items',
                message: 'Documento deve conter pelo menos um item',
                severity: 'error',
            });
        }

        // Validar cada item
        taxDoc.items?.forEach((item, index) => {
            if (!item.description || item.description.trim().length === 0) {
                errors.push({
                    field: `items[${index}].description`,
                    message: `Item ${index + 1}: Descrição é obrigatória`,
                    severity: 'error',
                });
            }

            if (!item.code || item.code.trim().length === 0) {
                warnings.push({
                    field: `items[${index}].code`,
                    message: `Item ${index + 1}: Código do produto recomendado`,
                    severity: 'warning',
                });
            }

            if (item.quantity <= 0) {
                errors.push({
                    field: `items[${index}].quantity`,
                    message: `Item ${index + 1}: Quantidade deve ser maior que zero`,
                    severity: 'error',
                });
            }

            if (item.unit_price <= 0) {
                errors.push({
                    field: `items[${index}].unit_price`,
                    message: `Item ${index + 1}: Preço unitário deve ser maior que zero`,
                    severity: 'error',
                });
            }

            // Validar cálculo do total
            const expectedTotal = item.quantity * item.unit_price;
            const tolerance = 0.01; // Tolerância para arredondamento
            if (Math.abs(item.total - expectedTotal) > tolerance) {
                errors.push({
                    field: `items[${index}].total`,
                    message: `Item ${index + 1}: Total calculado incorretamente (esperado: ${expectedTotal.toFixed(2)}, obtido: ${item.total.toFixed(2)})`,
                    severity: 'error',
                });
            }
        });

        // Validar soma dos itens vs total
        const itemsTotal = taxDoc.items?.reduce((sum, item) => sum + item.total, 0) || 0;
        const tolerance = 0.01;
        if (Math.abs(itemsTotal - taxDoc.total_amount) > tolerance) {
            errors.push({
                field: 'total_amount',
                message: `Soma dos itens (${itemsTotal.toFixed(2)}) não corresponde ao total (${taxDoc.total_amount.toFixed(2)})`,
                severity: 'error',
            });
        }
    }

    /**
     * Validações específicas para Portugal (SAF-T)
     */
    private static validatePortugal(
        taxDoc: TaxDocument,
        errors: ValidationError[],
        warnings: ValidationError[]
    ): void {
        // IVA obrigatório em Portugal
        if (!taxDoc.taxes.vat && taxDoc.taxes.vat !== 0) {
            errors.push({
                field: 'taxes.vat',
                message: 'IVA é obrigatório em Portugal',
                severity: 'error',
            });
        }

        // Validar taxa de IVA (Portugal: 23%, 13%, 6%, 0%)
        const validVatRates = [23, 13, 6, 0];
        const vatRate = this.calculateVatRate(taxDoc);
        if (vatRate !== null && !validVatRates.includes(vatRate)) {
            warnings.push({
                field: 'taxes.vat',
                message: `Taxa de IVA (${vatRate}%) não é padrão em Portugal. Taxas válidas: 23%, 13%, 6%, 0%`,
                severity: 'warning',
            });
        }

        // Validar cálculo de IVA (23% padrão)
        const expectedVat = taxDoc.total_amount * 0.23 / 1.23; // IVA incluído
        const actualVat = taxDoc.taxes.vat || 0;
        const tolerance = 0.01;
        if (Math.abs(actualVat - expectedVat) > tolerance && vatRate === 23) {
            warnings.push({
                field: 'taxes.vat',
                message: `IVA calculado pode estar incorreto (esperado: ${expectedVat.toFixed(2)}, obtido: ${actualVat.toFixed(2)})`,
                severity: 'warning',
            });
        }

        // Validar tipo de documento
        if (taxDoc.doc_type !== 'SAF-T' && taxDoc.doc_type !== 'MOCK') {
            warnings.push({
                field: 'doc_type',
                message: `Tipo de documento (${taxDoc.doc_type}) não é padrão para Portugal. Esperado: SAF-T`,
                severity: 'warning',
            });
        }

        // Validar campos obrigatórios no raw_payload para SAF-T
        if (taxDoc.doc_type === 'SAF-T' && taxDoc.raw_payload) {
            const requiredFields = [
                'restaurant_name',
                'tax_registration_number',
                'address',
                'city',
                'postal_code',
            ];

            requiredFields.forEach(field => {
                if (!taxDoc.raw_payload[field]) {
                    errors.push({
                        field: `raw_payload.${field}`,
                        message: `Campo obrigatório para SAF-T: ${field}`,
                        severity: 'error',
                    });
                }
            });

            // Validar NIF (9 dígitos)
            const nif = taxDoc.raw_payload.tax_registration_number;
            if (nif && !/^\d{9}$/.test(nif)) {
                errors.push({
                    field: 'raw_payload.tax_registration_number',
                    message: 'NIF deve conter exatamente 9 dígitos',
                    severity: 'error',
                });
            }

            // Validar código postal (formato PT: XXXX-XXX)
            const postalCode = taxDoc.raw_payload.postal_code;
            if (postalCode && !/^\d{4}-\d{3}$/.test(postalCode)) {
                warnings.push({
                    field: 'raw_payload.postal_code',
                    message: 'Código postal deve estar no formato XXXX-XXX (ex: 1000-000)',
                    severity: 'warning',
                });
            }
        }
    }

    /**
     * Validações específicas para Espanha (TicketBAI)
     */
    private static validateSpain(
        taxDoc: TaxDocument,
        errors: ValidationError[],
        warnings: ValidationError[]
    ): void {
        // IVA obrigatório em Espanha
        if (!taxDoc.taxes.vat && taxDoc.taxes.vat !== 0) {
            errors.push({
                field: 'taxes.vat',
                message: 'IVA é obrigatório em Espanha',
                severity: 'error',
            });
        }

        // Validar taxa de IVA (Espanha: 21%, 10%, 4%, 0%)
        const validVatRates = [21, 10, 4, 0];
        const vatRate = this.calculateVatRate(taxDoc);
        if (vatRate !== null && !validVatRates.includes(vatRate)) {
            warnings.push({
                field: 'taxes.vat',
                message: `Taxa de IVA (${vatRate}%) não é padrão em Espanha. Taxas válidas: 21%, 10%, 4%, 0%`,
                severity: 'warning',
            });
        }

        // Validar cálculo de IVA (21% padrão)
        const expectedVat = taxDoc.total_amount * 0.21 / 1.21; // IVA incluído
        const actualVat = taxDoc.taxes.vat || 0;
        const tolerance = 0.01;
        if (Math.abs(actualVat - expectedVat) > tolerance && vatRate === 21) {
            warnings.push({
                field: 'taxes.vat',
                message: `IVA calculado pode estar incorreto (esperado: ${expectedVat.toFixed(2)}, obtido: ${actualVat.toFixed(2)})`,
                severity: 'warning',
            });
        }

        // Validar tipo de documento
        if (taxDoc.doc_type !== 'TICKETBAI') {
            warnings.push({
                field: 'doc_type',
                message: `Tipo de documento (${taxDoc.doc_type}) não é padrão para Espanha. Esperado: TICKETBAI`,
                severity: 'warning',
            });
        }

        // Validar campos obrigatórios no raw_payload para TicketBAI
        if (taxDoc.doc_type === 'TICKETBAI' && taxDoc.raw_payload) {
            const requiredFields = [
                'restaurant_name',
                'tax_registration_number',
            ];

            requiredFields.forEach(field => {
                if (!taxDoc.raw_payload[field]) {
                    errors.push({
                        field: `raw_payload.${field}`,
                        message: `Campo obrigatório para TicketBAI: ${field}`,
                        severity: 'error',
                    });
                }
            });

            // Validar NIF (9 dígitos, formato ES)
            const nif = taxDoc.raw_payload.tax_registration_number;
            if (nif && !/^[A-Z]\d{8}$/.test(nif) && !/^\d{9}$/.test(nif)) {
                warnings.push({
                    field: 'raw_payload.tax_registration_number',
                    message: 'NIF deve conter 9 caracteres (formato: X12345678 ou 123456789)',
                    severity: 'warning',
                });
            }
        }
    }

    /**
     * Calcula taxa de IVA baseada no valor total e IVA
     */
    private static calculateVatRate(taxDoc: TaxDocument): number | null {
        if (!taxDoc.taxes.vat || taxDoc.taxes.vat === 0) {
            return 0;
        }

        const subtotal = taxDoc.total_amount - taxDoc.taxes.vat;
        if (subtotal <= 0) {
            return null;
        }

        const vatRate = (taxDoc.taxes.vat / subtotal) * 100;
        return Math.round(vatRate * 100) / 100; // Arredondar para 2 casas decimais
    }

    /**
     * Valida formato de data/hora
     */
    static validateDateTime(dateTime: Date | string): ValidationError | null {
        const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
        
        if (isNaN(date.getTime())) {
            return {
                field: 'date',
                message: 'Data/hora inválida',
                severity: 'error',
            };
        }

        // Verificar se data não é futura
        if (date > new Date()) {
            return {
                field: 'date',
                message: 'Data/hora não pode ser futura',
                severity: 'warning',
            };
        }

        return null;
    }

    /**
     * Valida protocolo fiscal (formato básico)
     */
    static validateFiscalProtocol(protocol: string): ValidationError | null {
        if (!protocol || protocol.trim().length === 0) {
            return {
                field: 'gov_protocol',
                message: 'Protocolo fiscal é obrigatório',
                severity: 'error',
            };
        }

        // Protocolo deve ter pelo menos 5 caracteres
        if (protocol.length < 5) {
            return {
                field: 'gov_protocol',
                message: 'Protocolo fiscal muito curto (mínimo 5 caracteres)',
                severity: 'warning',
            };
        }

        return null;
    }
}
