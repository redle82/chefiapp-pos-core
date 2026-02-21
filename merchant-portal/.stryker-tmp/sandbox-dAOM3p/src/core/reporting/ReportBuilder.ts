/**
 * P5-6: Report Builder
 * 
 * Builder visual de relatórios customizados
 */
// @ts-nocheck


export type ReportField = {
    id: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'date' | 'percentage';
    source: string; // e.g., 'orders.total', 'products.name'
};

export type ReportFilter = {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
    value: string | number | [number, number];
};

export type ReportGroupBy = {
    field: string;
    interval?: 'day' | 'week' | 'month' | 'year';
};

export interface ReportConfig {
    id: string;
    name: string;
    fields: ReportField[];
    filters?: ReportFilter[];
    groupBy?: ReportGroupBy;
    sortBy?: { field: string; direction: 'asc' | 'desc' };
    format: 'table' | 'chart' | 'summary';
    chartType?: 'line' | 'bar' | 'pie';
}

class ReportBuilder {
    private reports: Map<string, ReportConfig> = new Map();

    /**
     * Create a new report configuration
     */
    createReport(config: ReportConfig): void {
        this.reports.set(config.id, config);
        this.saveReport(config);
    }

    /**
     * Get report configuration
     */
    getReport(id: string): ReportConfig | undefined {
        return this.reports.get(id);
    }

    /**
     * List all reports
     */
    listReports(): ReportConfig[] {
        return Array.from(this.reports.values());
    }

    /**
     * Delete report
     */
    deleteReport(id: string): void {
        this.reports.delete(id);
        this.removeReport(id);
    }

    /**
     * Save report to localStorage
     */
    private saveReport(config: ReportConfig): void {
        const saved = this.loadReports();
        saved.push(config);
        localStorage.setItem('chefiapp_custom_reports', JSON.stringify(saved));
    }

    /**
     * Load reports from localStorage
     */
    private loadReports(): ReportConfig[] {
        const saved = localStorage.getItem('chefiapp_custom_reports');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Remove report from localStorage
     */
    private removeReport(id: string): void {
        const saved = this.loadReports();
        const filtered = saved.filter((r: ReportConfig) => r.id !== id);
        localStorage.setItem('chefiapp_custom_reports', JSON.stringify(filtered));
    }

    /**
     * Initialize - load saved reports
     */
    initialize(): void {
        const saved = this.loadReports();
        for (const report of saved) {
            this.reports.set(report.id, report);
        }
    }
}

export const reportBuilder = new ReportBuilder();
