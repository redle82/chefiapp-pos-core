/**
 * Global Configuration Strategy
 *
 * Centralizes environment variables and defaults.
 * Follows "Fail Loud" for critical missing vars in production.
 */

export const CONFIG = {
    // API (Web Module)
    // API (Web Module)
    API_BASE: process.env.VITE_API_BASE || 'http://localhost:4320',

    // Supabase
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',

    // Stripe
    STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY || '',

    // Environment
    IS_DEV: process.env.NODE_ENV !== 'production',
    MODE: process.env.NODE_ENV || 'development',
};

// Runtime Check
if (process.env.NODE_ENV === 'production') {
    if (!CONFIG.SUPABASE_URL) console.warn('Missing VITE_SUPABASE_URL');
    if (!CONFIG.SUPABASE_ANON_KEY) console.warn('Missing VITE_SUPABASE_ANON_KEY');
}
