/**
 * Fiscal Backup Service
 * 
 * Gerencia backup e recuperação de documentos fiscais
 * - Export de faturas (CSV/JSON)
 * - Backup automático (diário)
 * - Recuperação de faturas perdidas
 * - Histórico completo de faturas
 */

import { supabase } from '../supabase';
import { Logger } from '../logger/Logger';
import type { TaxDocument } from '../../../../fiscal-modules/types';

export interface FiscalBackupOptions {
    format: 'csv' | 'json';
    startDate?: Date;
    endDate?: Date;
    restaurantId?: string;
    includePending?: boolean;
}

export interface FiscalBackupResult {
    success: boolean;
    data: string; // CSV ou JSON string
    count: number;
    filename: string;
    error?: string;
}

export interface FiscalRecoveryOptions {
    orderId?: string;
    fiscalEventId?: string;
    restaurantId?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface FiscalRecoveryResult {
    success: boolean;
    documents: any[];
    count: number;
    error?: string;
}

export class FiscalBackupService {
    /**
     * Exporta faturas para CSV ou JSON
     */
    static async exportFiscals(options: FiscalBackupOptions): Promise<FiscalBackupResult> {
        try {
            const { format, startDate, endDate, restaurantId, includePending = false } = options;

            // Construir query
            let query = supabase
                .from('fiscal_event_store')
                .select('*')
                .order('created_at', { ascending: false });

            // Filtros
            if (restaurantId) {
                query = query.eq('restaurant_id', restaurantId);
            }

            if (startDate) {
                query = query.gte('created_at', startDate.toISOString());
            }

            if (endDate) {
                query = query.lte('created_at', endDate.toISOString());
            }

            if (!includePending) {
                query = query.neq('fiscal_status', 'PENDING');
            }

            const { data: fiscals, error } = await query;

            if (error) {
                throw new Error(`Failed to fetch fiscals: ${error.message}`);
            }

            if (!fiscals || fiscals.length === 0) {
                return {
                    success: true,
                    data: format === 'csv' ? 'No data' : '[]',
                    count: 0,
                    filename: `fiscals-export-${new Date().toISOString().split('T')[0]}.${format}`,
                };
            }

            // Converter para formato solicitado
            let data: string;
            let filename: string;

            if (format === 'csv') {
                data = this.convertToCSV(fiscals);
                filename = `fiscals-export-${new Date().toISOString().split('T')[0]}.csv`;
            } else {
                data = JSON.stringify(fiscals, null, 2);
                filename = `fiscals-export-${new Date().toISOString().split('T')[0]}.json`;
            }

            Logger.info('[FiscalBackupService] Export completed', {
                format,
                count: fiscals.length,
                filename,
            });

            return {
                success: true,
                data,
                count: fiscals.length,
                filename,
            };
        } catch (error: any) {
            Logger.error('[FiscalBackupService] Export failed', error);
            return {
                success: false,
                data: '',
                count: 0,
                filename: '',
                error: error.message,
            };
        }
    }

    /**
     * Converte array de objetos para CSV
     */
    private static convertToCSV(data: any[]): string {
        if (data.length === 0) {
            return '';
        }

        // Headers
        const headers = [
            'fiscal_event_id',
            'order_id',
            'restaurant_id',
            'doc_type',
            'fiscal_status',
            'gov_protocol',
            'total_amount',
            'vat_amount',
            'created_at',
            'reported_at',
            'retry_count',
        ];

        // CSV rows
        const rows = data.map(item => {
            const totalAmount = item.payload_sent?.total_amount || 0;
            const vatAmount = item.payload_sent?.vat_amount || 0;

            return [
                item.fiscal_event_id || '',
                item.order_id || '',
                item.restaurant_id || '',
                item.doc_type || '',
                item.fiscal_status || '',
                item.gov_protocol || '',
                totalAmount.toFixed(2),
                vatAmount.toFixed(2),
                item.created_at || '',
                item.reported_at || '',
                item.retry_count || 0,
            ].map(val => {
                // Escape CSV values
                const str = String(val);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
        });

        // Combine headers and rows
        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        return csv;
    }

    /**
     * Recupera faturas perdidas ou específicas
     */
    static async recoverFiscals(options: FiscalRecoveryOptions): Promise<FiscalRecoveryResult> {
        try {
            const { orderId, fiscalEventId, restaurantId, startDate, endDate } = options;

            let query = supabase
                .from('fiscal_event_store')
                .select('*')
                .order('created_at', { ascending: false });

            // Filtros específicos
            if (fiscalEventId) {
                query = query.eq('fiscal_event_id', fiscalEventId);
            } else if (orderId) {
                query = query.eq('order_id', orderId);
            }

            if (restaurantId) {
                query = query.eq('restaurant_id', restaurantId);
            }

            if (startDate) {
                query = query.gte('created_at', startDate.toISOString());
            }

            if (endDate) {
                query = query.lte('created_at', endDate.toISOString());
            }

            const { data: fiscals, error } = await query;

            if (error) {
                throw new Error(`Failed to recover fiscals: ${error.message}`);
            }

            Logger.info('[FiscalBackupService] Recovery completed', {
                count: fiscals?.length || 0,
                filters: options,
            });

            return {
                success: true,
                documents: fiscals || [],
                count: fiscals?.length || 0,
            };
        } catch (error: any) {
            Logger.error('[FiscalBackupService] Recovery failed', error);
            return {
                success: false,
                documents: [],
                count: 0,
                error: error.message,
            };
        }
    }

    /**
     * Cria backup automático (chamado por cron job ou Edge Function)
     */
    static async createAutomaticBackup(restaurantId?: string): Promise<FiscalBackupResult> {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(23, 59, 59, 999);

            const result = await this.exportFiscals({
                format: 'json', // JSON é mais completo para backup
                startDate: yesterday,
                endDate: today,
                restaurantId,
                includePending: true, // Incluir PENDING no backup
            });

            if (result.success) {
                Logger.info('[FiscalBackupService] Automatic backup created', {
                    count: result.count,
                    filename: result.filename,
                });
            }

            return result;
        } catch (error: any) {
            Logger.error('[FiscalBackupService] Automatic backup failed', error);
            return {
                success: false,
                data: '',
                count: 0,
                filename: '',
                error: error.message,
            };
        }
    }

    /**
     * Verifica integridade dos backups (validação)
     */
    static async validateBackup(backupData: string, format: 'csv' | 'json'): Promise<{
        valid: boolean;
        errors: string[];
        count: number;
    }> {
        const errors: string[] = [];

        try {
            let data: any[];

            if (format === 'json') {
                data = JSON.parse(backupData);
                if (!Array.isArray(data)) {
                    errors.push('JSON backup must be an array');
                    return { valid: false, errors, count: 0 };
                }
            } else {
                // CSV parsing básico
                const lines = backupData.split('\n');
                if (lines.length < 2) {
                    errors.push('CSV backup must have at least header and one row');
                    return { valid: false, errors, count: 0 };
                }
                // Contar linhas (menos header)
                data = Array(lines.length - 1).fill(null);
            }

            // Validar estrutura básica
            if (format === 'json') {
                data.forEach((item, index) => {
                    if (!item.fiscal_event_id) {
                        errors.push(`Item ${index + 1}: Missing fiscal_event_id`);
                    }
                    if (!item.order_id) {
                        errors.push(`Item ${index + 1}: Missing order_id`);
                    }
                    if (!item.fiscal_status) {
                        errors.push(`Item ${index + 1}: Missing fiscal_status`);
                    }
                });
            }

            return {
                valid: errors.length === 0,
                errors,
                count: data.length,
            };
        } catch (error: any) {
            errors.push(`Parse error: ${error.message}`);
            return {
                valid: false,
                errors,
                count: 0,
            };
        }
    }

    /**
     * Obtém estatísticas de faturas
     */
    static async getFiscalStats(restaurantId?: string, startDate?: Date, endDate?: Date): Promise<{
        total: number;
        reported: number;
        pending: number;
        rejected: number;
        totalAmount: number;
        totalVat: number;
    }> {
        try {
            let query = supabase
                .from('fiscal_event_store')
                .select('fiscal_status, payload_sent');

            if (restaurantId) {
                query = query.eq('restaurant_id', restaurantId);
            }

            if (startDate) {
                query = query.gte('created_at', startDate.toISOString());
            }

            if (endDate) {
                query = query.lte('created_at', endDate.toISOString());
            }

            const { data: fiscals, error } = await query;

            if (error) {
                throw new Error(`Failed to fetch stats: ${error.message}`);
            }

            const stats = {
                total: fiscals?.length || 0,
                reported: 0,
                pending: 0,
                rejected: 0,
                totalAmount: 0,
                totalVat: 0,
            };

            fiscals?.forEach((fiscal: any) => {
                if (fiscal.fiscal_status === 'REPORTED') stats.reported++;
                else if (fiscal.fiscal_status === 'PENDING') stats.pending++;
                else if (fiscal.fiscal_status === 'REJECTED') stats.rejected++;

                const payload = fiscal.payload_sent || {};
                stats.totalAmount += payload.total_amount || 0;
                stats.totalVat += payload.vat_amount || 0;
            });

            return stats;
        } catch (error: any) {
            Logger.error('[FiscalBackupService] Stats failed', error);
            return {
                total: 0,
                reported: 0,
                pending: 0,
                rejected: 0,
                totalAmount: 0,
                totalVat: 0,
            };
        }
    }
}
