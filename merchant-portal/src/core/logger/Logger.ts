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

class LoggerService {
    private static instance: LoggerService;
    private context: LogContext = {};
    private isDev: boolean;
    private sessionId: string;
    private requestCounter: number = 0;

    private constructor() {
        this.isDev = import.meta.env.DEV;
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
        if (['warn', 'error', 'critical'].includes(level)) {
            try {
                const restaurantId = fullContext.tenantId || fullContext.restaurantId || getTabIsolated('chefiapp_restaurant_id');

                // Validate payload size
                const detailsJson = JSON.stringify({ ...payload.data, ...payload.meta });
                let detailsToSave = { ...payload.data, ...payload.meta };

                if (detailsJson.length > 10000) {
                    console.warn('[Logger] Payload too large, truncating');
                    detailsToSave = { ...detailsToSave, truncated: true, originalSize: detailsJson.length };
                }

                await supabase.from('app_logs').insert({
                    level: level === 'critical' ? 'error' : level, // Map critical to error for DB if ENUM doesn't support it, or assume text
                    message,
                    details: detailsToSave,
                    restaurant_id: restaurantId || null,
                    url: fullContext.url || null,
                    user_agent: fullContext.userAgent || null,
                    created_at: payload.timestamp
                });
            } catch (err) {
                // Failsafe: Logger should never crash the app
                console.error('[Logger] Failed to push log:', err);
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
