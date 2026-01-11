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
 */

export class ReconnectManager {
    private attempts = 0;
    private maxAttempts = 10;
    private baseDelay = 1000; // 1 segundo
    private maxDelay = 30000; // 30 segundos

    /**
     * Calcula delay para próxima tentativa (exponential backoff)
     */
    getDelay(): number {
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
