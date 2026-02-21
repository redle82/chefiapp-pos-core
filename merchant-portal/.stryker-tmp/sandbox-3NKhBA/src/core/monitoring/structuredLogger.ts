/**
 * Structured Logger - Wrapper for Logger
 * 
 * Provides a structured logging interface that logs to Supabase app_logs table.
 * This is a compatibility layer that wraps the main Logger service.
 * 
 * @deprecated Consider using Logger directly for new code
 */
// @ts-nocheck


import { Logger } from '../logger';

export interface StructuredLogData {
    [key: string]: any;
}

/**
 * Structured Logger API
 * 
 * All methods are async to match the original API, but they don't need to be awaited
 * as Logger handles async operations internally.
 */
export const structuredLogger = {
    /**
     * Log an info message
     */
    async info(message: string, data?: StructuredLogData): Promise<void> {
        Logger.info(message, data);
    },

    /**
     * Log a warning message
     */
    async warn(message: string, data?: StructuredLogData): Promise<void> {
        Logger.warn(message, data);
    },

    /**
     * Log an error message
     * 
     * Note: Original API accepted (message, data), but Logger accepts (message, error, data).
     * We'll extract error from data if it exists, otherwise pass data as context.
     */
    async error(message: string, errorOrData?: Error | StructuredLogData, data?: StructuredLogData): Promise<void> {
        if (errorOrData instanceof Error) {
            Logger.error(message, errorOrData, data);
        } else {
            // If first param is not Error, treat it as data
            Logger.error(message, undefined, errorOrData);
        }
    },

    /**
     * Log a debug message
     */
    async debug(message: string, data?: StructuredLogData): Promise<void> {
        Logger.debug(message, data);
    },
};
