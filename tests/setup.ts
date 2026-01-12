/**
 * Test Setup
 *
 * Global test configuration and environment setup.
 */

// Set default environment variables for world simulation
process.env.WORLD_SEED = process.env.WORLD_SEED || '1337';
process.env.WORLD_RESTAURANTS = process.env.WORLD_RESTAURANTS || '50';
process.env.WORLD_TABLES_PER_RESTAURANT = process.env.WORLD_TABLES_PER_RESTAURANT || '20';
process.env.WORLD_ORDERS_PER_RESTAURANT = process.env.WORLD_ORDERS_PER_RESTAURANT || '200';
process.env.WORLD_ITEMS_PER_ORDER_MAX = process.env.WORLD_ITEMS_PER_ORDER_MAX || '12';
process.env.WORLD_CONCURRENCY = process.env.WORLD_CONCURRENCY || '20';
process.env.WORLD_TIMEZONES = process.env.WORLD_TIMEZONES || 'Europe/Madrid,America/New_York,America/Sao_Paulo';
process.env.WORLD_CURRENCIES = process.env.WORLD_CURRENCIES || 'EUR,USD,BRL';

// Increase Jest timeout for massive tests
if (process.env.WORLD_STRESS === 'true') {
    jest.setTimeout(600000); // 10 minutes
} else if (process.env.WORLD_FULL === 'true') {
    jest.setTimeout(300000); // 5 minutes
}

// Ensure audit-reports directory exists
import * as fs from 'fs';
import * as path from 'path';

const auditDir = path.join(__dirname, '..', 'audit-reports');
if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║           CHEFIAPP POS CORE - MASSIVE AUDIT SUITE            ║
╠══════════════════════════════════════════════════════════════╣
║  Seed: ${process.env.WORLD_SEED.padEnd(54)}║
║  Mode: ${(process.env.WORLD_STRESS === 'true' ? 'STRESS' : process.env.WORLD_FULL === 'true' ? 'FULL' : 'PILOT').padEnd(54)}║
╚══════════════════════════════════════════════════════════════╝
`);

// Mock window for Node.js environment
if (typeof global !== 'undefined' && typeof (global as any).window === 'undefined') {
    (global as any).window = {
        navigator: {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        innerWidth: 1920,
        innerHeight: 1080,
        location: {
            href: 'http://localhost:3000',
            origin: 'http://localhost:3000',
            pathname: '/'
        }
    };
}

// Mock localStorage
if (typeof (global as any).localStorage === 'undefined') {
    const storage: Record<string, string> = {};
    (global as any).localStorage = {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => { storage[key] = value; },
        removeItem: (key: string) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); }
    };
}

// Mock import.meta.env for Vite environment variables
// This is needed because Jest runs in Node.js, which doesn't have import.meta
if (typeof (global as any).import === 'undefined') {
    Object.defineProperty(global, 'import', {
        value: {
            meta: {
                env: {
                    MODE: 'test',
                    DEV: true,
                    PROD: false,
                    VITE_API_BASE: process.env.VITE_API_BASE || 'http://localhost:4320',
                    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
                    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
                    VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY || 'test-stripe-key',
                    VITE_STRIPE_PK: process.env.VITE_STRIPE_PUBLIC_KEY || 'test-stripe-key',
                }
            }
        },
        writable: true,
        configurable: true
    });
}
