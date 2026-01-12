/**
 * P4-6: Advanced Reporting Service
 * 
 * Serviço avançado para geração de relatórios
 */

import { supabase } from '../supabase';
import { Logger } from '../logger/Logger';
import { reportBuilder, type ReportConfig } from './ReportBuilder';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ScheduledReport {
    id: string;
    reportId: string;
    schedule: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:mm
    recipients: string[];
    format: ReportFormat;
    enabled: boolean;
}

class AdvancedReportingService {
    /**
     * Generate report data
     */
    async generateReportData(config: ReportConfig, restaurantId: string, dateRange?: { from: Date; to: Date }): Promise<any[]> {
        try {
            // This would generate data based on the report configuration
            // For now, return placeholder
            const { data, error } = await supabase
                .from('gm_orders')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            return data || [];
        } catch (err) {
            Logger.error('Failed to generate report data', err, { config, restaurantId });
            return [];
        }
    }

    /**
     * Export report to format
     */
    async exportReport(
        config: ReportConfig,
        format: ReportFormat,
        data: any[]
    ): Promise<{
        success: boolean;
        url?: string;
        error?: string;
    }> {
        try {
            switch (format) {
                case 'pdf':
                    return await this.exportToPDF(config, data);
                case 'excel':
                    return await this.exportToExcel(config, data);
                case 'csv':
                    return await this.exportToCSV(config, data);
                case 'json':
                    return await this.exportToJSON(config, data);
                default:
                    return {
                        success: false,
                        error: 'Formato não suportado',
                    };
            }
        } catch (err) {
            Logger.error('Failed to export report', err, { config, format });
            return {
                success: false,
                error: 'Erro ao exportar relatório',
            };
        }
    }

    /**
     * Export to PDF
     */
    private async exportToPDF(config: ReportConfig, data: any[]): Promise<{ success: boolean; url?: string; error?: string }> {
        // TODO: Implement PDF generation using a library like jsPDF or pdfkit
        // For now, use browser print
        return {
            success: true,
            url: 'data:application/pdf;base64,placeholder', // Placeholder
        };
    }

    /**
     * Export to Excel
     */
    private async exportToExcel(config: ReportConfig, data: any[]): Promise<{ success: boolean; url?: string; error?: string }> {
        // TODO: Implement Excel export using a library like xlsx
        const csv = this.convertToCSV(data, config);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        return {
            success: true,
            url,
        };
    }

    /**
     * Export to CSV
     */
    private async exportToCSV(config: ReportConfig, data: any[]): Promise<{ success: boolean; url?: string; error?: string }> {
        const csv = this.convertToCSV(data, config);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        return {
            success: true,
            url,
        };
    }

    /**
     * Export to JSON
     */
    private async exportToJSON(config: ReportConfig, data: any[]): Promise<{ success: boolean; url?: string; error?: string }> {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        return {
            success: true,
            url,
        };
    }

    /**
     * Convert data to CSV
     */
    private convertToCSV(data: any[], config: ReportConfig): string {
        if (data.length === 0) return '';

        const headers = config.fields.map(f => f.label);
        const rows = data.map(item => {
            return config.fields.map(f => {
                const value = this.getNestedValue(item, f.source);
                return `"${String(value || '').replace(/"/g, '""')}"`;
            }).join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Get nested value from object
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Schedule report
     */
    async scheduleReport(schedule: ScheduledReport): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('scheduled_reports')
                .insert({
                    id: schedule.id,
                    report_id: schedule.reportId,
                    schedule: schedule.schedule,
                    day_of_week: schedule.dayOfWeek,
                    day_of_month: schedule.dayOfMonth,
                    time: schedule.time,
                    recipients: schedule.recipients,
                    format: schedule.format,
                    enabled: schedule.enabled,
                });

            if (error) throw error;

            return { success: true };
        } catch (err) {
            Logger.error('Failed to schedule report', err, { schedule });
            return {
                success: false,
                error: 'Erro ao agendar relatório',
            };
        }
    }

    /**
     * Get scheduled reports
     */
    async getScheduledReports(restaurantId: string): Promise<ScheduledReport[]> {
        try {
            const { data, error } = await supabase
                .from('scheduled_reports')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (error) throw error;

            return (data || []).map(r => ({
                id: r.id,
                reportId: r.report_id,
                schedule: r.schedule,
                dayOfWeek: r.day_of_week,
                dayOfMonth: r.day_of_month,
                time: r.time,
                recipients: r.recipients,
                format: r.format,
                enabled: r.enabled,
            }));
        } catch (err) {
            Logger.error('Failed to get scheduled reports', err, { restaurantId });
            return [];
        }
    }
}

export const advancedReportingService = new AdvancedReportingService();
