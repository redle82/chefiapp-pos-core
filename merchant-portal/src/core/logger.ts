
// Redirecting to the enhanced Logger
import { Logger } from './logger/Logger';

// Backwards compatibility layer mapping
export const logger = {
    log: (level: 'info' | 'warn' | 'error', message: string, details?: any) => {
        if (level === 'error') Logger.error(message, details);
        else if (level === 'warn') Logger.warn(message, details);
        else Logger.info(message, details);
    },
    error: (message: string, error?: any) => Logger.error(message, error),
    warn: (message: string, details?: any) => Logger.warn(message, details),
    info: (message: string, details?: any) => Logger.info(message, details),
};
