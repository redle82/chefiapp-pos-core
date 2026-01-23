import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogContext {
    tenantId?: string;
    userId?: string;
    sessionId?: string;
    screen?: string;
    [key: string]: any;
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
        this.isDev = __DEV__;
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    public setContext(context: Partial<LogContext>) {
        this.context = { ...this.context, ...context };
    }

    public clearContext() {
        this.context = { sessionId: this.sessionId };
    }

    private sanitize(data: any): any {
        if (!data || typeof data !== 'object') return data;
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cvv', 'creditCard'];

        if (Array.isArray(data)) return data.map(item => this.sanitize(item));

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

    private hashString(input: string): string {
        let hash = 5381;
        for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) + hash) + input.charCodeAt(i);
            hash = hash >>> 0;
        }
        return hash.toString(16);
    }

    private async emit(level: LogLevel, message: string, data?: Record<string, any>) {
        const fullContext = {
            ...this.context,
            requestId: `req_${++this.requestCounter}`,
            platform: Platform.OS,
            version: Constants.expoConfig?.version,
            sessionId: this.sessionId,
        };

        const payload = {
            level,
            timestamp: new Date().toISOString(),
            message,
            data: this.sanitize(data || {}),
            meta: this.sanitize(fullContext)
        };

        if (this.isDev) {
            const prefix = `[${level.toUpperCase()}]`;
            console.log(prefix, message, payload.data);
        } else {
            // In prod, basic console log just in case (e.g. for Expo logs)
            if (level === 'error' || level === 'critical') console.error(JSON.stringify(payload));
        }

        if (['warn', 'error', 'critical'].includes(level)) {
            if (this.remoteIngestionDisabled) return;

            // DEDUPLICATION
            const dedupeKey = `${level}:${message}`;
            if (this.lastSentLog === dedupeKey && Date.now() - this.lastSentTime < 5000) {
                return;
            }

            try {
                const restaurantId = fullContext.tenantId;

                // Idempotency
                const idemSource = JSON.stringify({
                    level,
                    message,
                    restaurantId: restaurantId || null,
                    platform: fullContext.platform,
                    userId: fullContext.userId || null,
                });
                const idempotency_key = `log_mobile_${this.hashString(idemSource)}`;

                const detailsToSave = { ...payload.data, ...payload.meta };

                await supabase.from('app_logs').upsert({
                    level: level === 'critical' ? 'error' : level,
                    message,
                    details: detailsToSave,
                    restaurant_id: restaurantId || null,
                    url: `mobile://${fullContext.screen || 'root'}`, // Virtual URL for mobile
                    user_agent: `ChefIApp/${Constants.expoConfig?.version} (${Platform.OS})`,
                    created_at: payload.timestamp,
                    idempotency_key,
                }, { onConflict: 'idempotency_key', ignoreDuplicates: true });

                this.lastSentLog = `${level}:${message}`;
                this.lastSentTime = Date.now();

            } catch (err: any) {
                if (err?.status === 409 || err?.code === '23505') {
                    this.lastSentLog = `${level}:${message}`;
                    this.lastSentTime = Date.now();
                    return;
                }
                if (err?.status === 400 || err?.message?.includes('idempotency_key')) {
                    this.remoteIngestionDisabled = true;
                    return;
                }
                console.warn('[Logger] Failed to push log:', err);
            }
        }
    }

    public debug(message: string, data?: Record<string, any>) { this.emit('debug', message, data); }
    public info(message: string, data?: Record<string, any>) { this.emit('info', message, data); }
    public warn(message: string, data?: Record<string, any>) { this.emit('warn', message, data); }
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
