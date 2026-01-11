/**
 * FAILPOINT INJECTION SYSTEM
 * 
 * Sistema probabilístico de injeção de falhas para testes de resiliência.
 * Controlado por variáveis de ambiente para não afetar produção.
 * 
 * Uso:
 *   FAILPOINT_PROB=0.01  // 1% de chance de falha
 *   FAILPOINT_ENABLED=true
 * 
 * Em testes massivos, use probabilidades baixas (0.001 - 0.01)
 * para não virar caos total.
 */

export class FailpointInjector {
    private static instance: FailpointInjector;
    private enabled: boolean;
    private probability: number;
    private injectedCount: number = 0;
    private totalCheckpoints: number = 0;

    private constructor() {
        this.enabled = process.env.FAILPOINT_ENABLED === 'true';
        this.probability = parseFloat(process.env.FAILPOINT_PROB || '0.0');
    }

    static getInstance(): FailpointInjector {
        if (!FailpointInjector.instance) {
            FailpointInjector.instance = new FailpointInjector();
        }
        return FailpointInjector.instance;
    }

    /**
     * Verifica se deve injetar falha neste ponto.
     * Se sim, lança erro simulando falha de infraestrutura.
     */
    async checkpoint(location: string): Promise<void> {
        this.totalCheckpoints++;

        if (!this.enabled) {
            return;
        }

        if (Math.random() < this.probability) {
            this.injectedCount++;
            const error = new FailpointError(
                `FAILPOINT INJECTED at ${location} (${this.injectedCount}/${this.totalCheckpoints})`,
                location
            );
            throw error;
        }
    }

    /**
     * Retorna estatísticas de failpoints
     */
    getStats() {
        return {
            enabled: this.enabled,
            probability: this.probability,
            injected: this.injectedCount,
            total: this.totalCheckpoints,
            injectionRate: this.totalCheckpoints > 0 
                ? (this.injectedCount / this.totalCheckpoints) 
                : 0,
        };
    }

    /**
     * Reset para testes
     */
    reset() {
        this.injectedCount = 0;
        this.totalCheckpoints = 0;
    }
}

/**
 * Erro personalizado para identificar falhas injetadas
 */
export class FailpointError extends Error {
    public readonly location: string;
    public readonly isFailpoint: boolean = true;

    constructor(message: string, location: string) {
        super(message);
        this.name = 'FailpointError';
        this.location = location;
    }
}

/**
 * Helper para verificar se um erro é um failpoint
 */
export function isFailpointError(error: any): error is FailpointError {
    return error && error.isFailpoint === true;
}

/**
 * Decorator para métodos que devem ter failpoints
 */
export function WithFailpoint(location: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            await FailpointInjector.getInstance().checkpoint(
                `${location}::${propertyKey}`
            );
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}
