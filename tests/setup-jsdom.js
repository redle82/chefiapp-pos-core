/**
 * Setup file for jsdom tests (plain JavaScript to avoid Babel issues)
 */

// Mock window for Node.js environment (already exists in jsdom, but ensure it's set)
if (typeof global.window === 'undefined') {
    global.window = {
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
if (typeof global.localStorage === 'undefined') {
    const storage = {};
    global.localStorage = {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = value; },
        removeItem: (key) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); }
    };
}

// Mock import.meta.env for Vite environment variables
// This is needed because Jest runs in Node.js, which doesn't have import.meta
if (typeof global.import === 'undefined') {
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

// PostgresLink: mock via moduleNameMapper em jest.config (gate3-persistence removido)
