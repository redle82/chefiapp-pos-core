export type DiagnosticMetricType = 'error' | 'warning' | 'info' | 'security';

export interface DiagnosticEvent {
    code: string;       // e.g., 'GM-1001-AUTH-FAIL'
    title: string;      // Human-readable title
    metricType: DiagnosticMetricType;
    userMessage?: string; // Friendly message for the UI
    technicalDetails?: Record<string, any>; // Context (sanitized)
    timestamp: string;  // ISO string
    userId?: string;
    tenantId?: string;
}

export type DiagnosticReport = {
    events: DiagnosticEvent[];
    systemStatus: {
        status: 'ok' | 'degraded' | 'critical';
        activeFlags: Record<string, any>;
        version: string;
        userAgent: string;
        memory?: any;
    };
    generatedAt: string;
};
