/**
 * ReconnectManager - Exponential Backoff para Realtime Reconnect
 * 
 * Gerencia tentativas de reconexão com exponential backoff:
 * - Tentativa 1: 1s
 * - Tentativa 2: 2s
 * - Tentativa 3: 4s
 * - Tentativa 4: 8s
 * - Tentativa 5: 16s
 * - Tentativa 6+: 30s (max)
 * 
 * Reset automático após sucesso.
 * 
 * STEP 6: DEV_STABLE_MODE - disabled (no reconnect attempts, no timers)
 */

import { isDevStableMode } from '../runtime/devStableMode';

export class ReconnectManager {
    private attempts = 0;
    private maxAttempts = 10;
    private baseDelay = 1000; // 1 segundo
    private maxDelay = 30000; // 30 segundos

    /**
     * STEP 6: Check if ReconnectManager is disabled (DEV_STABLE_MODE)
     */
    private static isDisabled(): boolean {
        return isDevStableMode();
    }

    /**
     * Calcula delay para próxima tentativa (exponential backoff)
     */
    getDelay(): number {
        // STEP 6: If disabled, return 0 (no delay, no reconnect)
        if (ReconnectManager.isDisabled()) return 0;
        const delay = Math.min(
            this.baseDelay * Math.pow(2, this.attempts),
            this.maxDelay
        );
        return delay;
    }

    /**
     * Incrementa contador de tentativas
     */
    increment(): void {
        // STEP 6: If disabled, do nothing
        if (ReconnectManager.isDisabled()) return;
        this.attempts = Math.min(this.attempts + 1, this.maxAttempts);
    }

    /**
     * Reseta contador (chamado após sucesso)
     */
    reset(): void {
        this.attempts = 0;
    }

    /**
     * Verifica se deve tentar reconectar
     */
    shouldRetry(): boolean {
        // STEP 6: If disabled, never retry
        if (ReconnectManager.isDisabled()) return false;
        return this.attempts < this.maxAttempts;
    }

    /**
     * Retorna número atual de tentativas
     */
    getAttempts(): number {
        return this.attempts;
    }

    /**
     * Retorna delay formatado para log
     */
    getDelayFormatted(): string {
        const delay = this.getDelay();
        if (delay < 1000) {
            return `${delay}ms`;
        }
        return `${(delay / 1000).toFixed(1)}s`;
    }
}
