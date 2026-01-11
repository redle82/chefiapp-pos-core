/**
 * WorldConfig - Configuration for World Simulation Tests
 *
 * All parameters are read from environment variables with sensible defaults.
 * This enables reproducible test runs via WORLD_SEED.
 */

export interface WorldConfig {
    // Reproducibility
    seed: number;

    // Scale
    restaurants: number;
    tablesPerRestaurant: number;
    ordersPerRestaurant: number;
    itemsPerOrderMax: number;
    concurrency: number;

    // Geographic diversity
    timezones: string[];
    currencies: string[];

    // Channel simulation
    channels: PaymentChannel[];

    // Performance
    batchSize: number;
    timeoutMs: number;

    // Stress parameters
    duplicateWebhookProbability: number;
    delayedWebhookMaxMs: number;
    fiscalOfflineProbability: number;
}

export type PaymentChannel = 'TABLE_QR' | 'WEB_LINK' | 'WAITER_CASH' | 'TOTEM';

export function loadWorldConfig(): WorldConfig {
    const parseList = (value: string): string[] =>
        value.split(',').map(s => s.trim()).filter(Boolean);

    return {
        seed: parseInt(process.env.WORLD_SEED || '1337', 10),
        restaurants: parseInt(process.env.WORLD_RESTAURANTS || '50', 10),
        tablesPerRestaurant: parseInt(process.env.WORLD_TABLES_PER_RESTAURANT || '20', 10),
        ordersPerRestaurant: parseInt(process.env.WORLD_ORDERS_PER_RESTAURANT || '200', 10),
        itemsPerOrderMax: parseInt(process.env.WORLD_ITEMS_PER_ORDER_MAX || '12', 10),
        concurrency: parseInt(process.env.WORLD_CONCURRENCY || '20', 10),

        timezones: parseList(process.env.WORLD_TIMEZONES || 'Europe/Madrid,America/New_York,America/Sao_Paulo'),
        currencies: parseList(process.env.WORLD_CURRENCIES || 'EUR,USD,BRL'),

        channels: ['TABLE_QR', 'WEB_LINK', 'WAITER_CASH', 'TOTEM'],

        batchSize: parseInt(process.env.WORLD_BATCH_SIZE || '100', 10),
        timeoutMs: parseInt(process.env.WORLD_TIMEOUT_MS || '300000', 10), // 5 minutes

        duplicateWebhookProbability: parseFloat(process.env.WORLD_DUPLICATE_WEBHOOK_PROB || '0.05'),
        delayedWebhookMaxMs: parseInt(process.env.WORLD_DELAYED_WEBHOOK_MAX_MS || '5000', 10),
        fiscalOfflineProbability: parseFloat(process.env.WORLD_FISCAL_OFFLINE_PROB || '0.10'),
    };
}

/**
 * Seeded Random Number Generator (Mulberry32)
 * Produces deterministic sequences for reproducibility.
 */
export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    next(): number {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }

    shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    uuid(): string {
        const hex = () => Math.floor(this.next() * 16).toString(16);
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = c === 'x' ? hex() : ((parseInt(hex(), 16) & 0x3) | 0x8).toString(16);
            return r;
        });
    }

    shouldOccur(probability: number): boolean {
        return this.next() < probability;
    }
}

/**
 * Pilot configuration for initial sanity checks
 */
export function loadPilotConfig(): WorldConfig {
    return {
        ...loadWorldConfig(),
        restaurants: 5,
        tablesPerRestaurant: 10,
        ordersPerRestaurant: 50,
        concurrency: 5,
        duplicateWebhookProbability: 0.1,
        fiscalOfflineProbability: 0.2,
    };
}

/**
 * Stress configuration for aggressive testing
 */
export function loadStressConfig(): WorldConfig {
    return {
        ...loadWorldConfig(),
        restaurants: 100,
        tablesPerRestaurant: 30,
        ordersPerRestaurant: 500,
        concurrency: 50,
        duplicateWebhookProbability: 0.2,
        delayedWebhookMaxMs: 10000,
        fiscalOfflineProbability: 0.3,
        timeoutMs: 600000, // 10 minutes
    };
}
