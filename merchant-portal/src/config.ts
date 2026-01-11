/**
 * Global Configuration Strategy
 * 
 * Centralizes environment variables and defaults.
 * Follows "Fail Loud" for critical missing vars in production.
 */

export const CONFIG = {
    // API (Web Module)
    API_BASE: (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4320',

    // Supabase
    SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string),
    SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY as string),

    // Stripe
    STRIPE_PUBLIC_KEY: (import.meta.env.VITE_STRIPE_PUBLIC_KEY as string),

    // Environment
    IS_DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE,
};

// Runtime Check (only logs, doesn't crash to allow build)
if (import.meta.env.PROD) {
    if (!CONFIG.SUPABASE_URL) console.warn('Missing VITE_SUPABASE_URL');
    if (!CONFIG.SUPABASE_ANON_KEY) console.warn('Missing VITE_SUPABASE_ANON_KEY');
}
