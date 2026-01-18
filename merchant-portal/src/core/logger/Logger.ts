import { supabase } from '../supabase';
import { getTabIsolated } from '../storage/TabIsolatedStorage';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogContext {
    tenantId?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    url?: string;
    userAgent?: string;
    [key: string]: any;
}

/**
 * Helper function to get environment variables
 * Supports both Vite (import.meta.env) and Node.js/Jest (process.env)
 */
function getEnv(): { DEV: boolean; MODE: string } {
    // Try import.meta first (Vite/browser environment)
    try {
        // Use eval to safely check for import.meta in environments where it's not available
        const hasImportMeta = typeof (globalThis as any).import !== 'undefined'
            || (typeof window !== 'undefined' && (window as any).import);

        if (!hasImportMeta) {
            // Check if we can access import.meta directly (Vite environment)
            const meta = (globalThis as any).import?.meta || (typeof window !== 'undefined' ? (window as any).import?.meta : undefined);
            if (meta?.env) {
                return {
                    DEV: meta.env.DEV || meta.env.MODE === 'development',
                    MODE: meta.env.MODE || 'development',
                };
            }
        }
    } catch (e) {
        // import.meta not available, fall through to process.env
    }

    // Fallback to process.env (Node.js/Jest environment)
    if (typeof process !== 'undefined' && process.env) {
        return {
            DEV: process.env.NODE_ENV !== 'production',
            MODE: process.env.NODE_ENV || 'development',
        };
    }

    // Default fallback (tests)
    return { DEV: false, MODE: 'test' };
}

class LoggerService {
    private static instance: LoggerService;
    private context: LogContext = {};
    private isDev: boolean;
    private sessionId: string;
    private requestCounter: number = 0;
    private remoteIngestionDisabled: boolean = false;
    private lastSentLog: string = '';
    private lastSentTime: number = 0;

    private constructor() {
        const env = getEnv();
        this.isDev = env.DEV;
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    /**
     * Define o contexto global para os próximos logs
     */
    public setContext(context: Partial<LogContext>) {
        this.context = { ...this.context, ...context };
    }

    /**
     * Limpa o contexto (ex: logout)
     */
    public clearContext() {
        const keptSession = { sessionId: this.context.sessionId };
        this.context = { sessionId: this.sessionId }; // Keep session ID
    }

    /**
     * Sanitiza dados sensíveis antes de logar
     */
    private sanitize(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie', 'cvv', 'creditCard'];

        if (Array.isArray(data)) {
            return data.map(item => this.sanitize(item));
        }

        const sanitized = { ...data };

        for (const key in sanitized) {
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitize(sanitized[key]);
            }
        }

        return sanitized;
    }

    /**
     * Internal Log Driver
     */
    private hashString(input: string): string {
        // Simple deterministic hash (djb2). Enough for idempotency keys.
        let hash = 5381;
        for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) + hash) + input.charCodeAt(i);
            hash = hash >>> 0; // force uint32
        }
        return hash.toString(16);
    }

    private async emit(level: LogLevel, message: string, data?: Record<string, any>) {
        // 1. Enrich Context
        const fullContext = {
            ...this.context,
            requestId: `req_${++this.requestCounter}`,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            sessionId: this.sessionId, // Ensure session ID is always present
        };

        const payload = {
            level,
            timestamp: new Date().toISOString(),
            message,
            data: this.sanitize(data || {}),
            meta: this.sanitize(fullContext)
        };

        // 2. Local Output (Dev or Console Fallback)
        const consoleMethod = level === 'critical' ? console.error :
            level === 'error' ? console.error :
                level === 'warn' ? console.warn :
                    level === 'info' ? console.info :
                        console.debug;

        if (this.isDev) {
            const prefix = `[${level.toUpperCase()}]${fullContext.tenantId ? ` [${fullContext.tenantId.substring(0, 8)}]` : ''}`;
            consoleMethod(prefix, message, payload.data);
        } else {
            consoleMethod(JSON.stringify(payload));
        }

        // 3. Remote Ingestion (Production or Critical/Error/Warn)
        // Log 'warn', 'error', 'critical' to Supabase
        // Optional: Log 'info' if a flag is set? Keeping strict for now to save quota.
        // DEV_STABLE_MODE: disable remote ingestion (fail-closed, quiet)
        if (['warn', 'error', 'critical'].includes(level)) {
            // DEV_STABLE_MODE: no remote ingestion
            const { isDevStableMode } = await import('../runtime/devStableMode');
            if (isDevStableMode()) return;
            // DEDUPLICATION: Prevent Log Storms (409s)
            const dedupeKey = `${level}:${message}`;
            if (this.lastSentLog === dedupeKey && Date.now() - this.lastSentTime < 5000) {
                return; // Skip identical log within 5 seconds
            }

            if (this.remoteIngestionDisabled) return;
            try {
                // 🚨 ALERTING: Send to Discord if Critical
                if (level === 'critical') {
                    // Lazy import to avoid circular dependency issues if any
                    import('../monitoring/AlertService').then(({ Alerts }) => {
                        Alerts.sendCritical(message, fullContext);
                    });
                }

                const restaurantId = fullContext.tenantId || getTabIsolated('chefiapp_restaurant_id');

                // Validate payload size
                const detailsJson = JSON.stringify({ ...payload.data, ...payload.meta });
                let detailsToSave = { ...payload.data, ...payload.meta };

                if (detailsJson.length > 10000) {
                    console.warn('[Logger] Payload too large, truncating');
                    detailsToSave = { ...detailsToSave, truncated: true, originalSize: detailsJson.length };
                }

                // CRITICAL: Prevent duplicate logs (idempotency)
                // Use stable idempotency_key + upsert(ignoreDuplicates) to avoid 409 storms.
                const idemSource = JSON.stringify({
                    level,
                    message,
                    restaurantId: restaurantId || null,
                    url: fullContext.url || null,
                    userId: fullContext.userId || null,
                });
                const idempotency_key = `log_${this.hashString(idemSource)}`;

                await supabase.from('app_logs').upsert({
                    level: level === 'critical' ? 'error' : level, // Map critical to error for DB if ENUM doesn't support it, or assume text
                    message,
                    details: detailsToSave,
                    restaurant_id: restaurantId || null,
                    url: fullContext.url || null,
                    user_agent: fullContext.userAgent || null,
                    created_at: payload.timestamp,
                    idempotency_key,
                }, { onConflict: 'idempotency_key', ignoreDuplicates: true });

                // Mark as sent AFTER successful attempt
                this.lastSentLog = `${level}:${message}`;
                this.lastSentTime = Date.now();
            } catch (err: any) {
                // Silently ignore 409 conflicts (duplicate log)
                if (err?.status === 409 || err?.message?.includes('409') || err?.code === '23505') {
                    this.lastSentLog = `${level}:${message}`;
                    this.lastSentTime = Date.now();
                    return;
                }
                // If idempotency_key isn't present in this DB yet, disable remote ingestion for this session.
                if (err?.status === 400 || err?.message?.includes('idempotency_key')) {
                    this.remoteIngestionDisabled = true;
                    console.warn('[Logger] Remote ingestion disabled (missing idempotency_key).');
                    return;
                }
                // Log other errors but don't crash
                console.error('[Logger] Failed to push log (non-409):', err);
            }
        }
    }
    public debug(message: string, data?: Record<string, any>) {
        this.emit('debug', message, data);
    }

    public info(message: string, data?: Record<string, any>) {
        this.emit('info', message, data);
    }

    public warn(message: string, data?: Record<string, any>) {
        this.emit('warn', message, data);
    }

    public error(message: string, error?: any, data?: Record<string, any>) {
        this.emit('error', message, {
            ...data,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : error
        });
    }

    public critical(message: string, error?: any, data?: Record<string, any>) {
        this.emit('critical', message, {
            ...data,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : error
        });
    }
}

export const Logger = LoggerService.getInstance();
