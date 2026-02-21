// @ts-nocheck
// The "Hardware Store" of colors.
// Modes pick from here. No component should import this directly.

export const palette = {
    // BASE
    white: '#ffffff',
    black: '#000000',

    // ZINC (Structure / Grayscale)
    zinc: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b',
    },

    // EMERALD (Success / Money)
    emerald: {
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        900: '#064e3b',
    },

    // AMBER (Warning / Action)
    amber: {
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        900: '#78350f',
    },

    // INDIGO (Brand / Info)
    indigo: {
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        900: '#312e81',
    },

    // ROSE (Destructive)
    rose: {
        400: '#fb7185',
        500: '#f43f5e',
        600: '#e11d48',
        900: '#881337',
    },

    // BLUE (Process)
    blue: {
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        900: '#1e3a8a',
    },

    // FIRE (ChefIApp OS)
    fire: {
        500: '#D9381E', // OS Red (Brasa)
        700: '#B91C1C', // Dark Brasa
        900: '#2D0A0A', // Vinho (Deep)
    }
} as const;
