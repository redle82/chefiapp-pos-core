/**
 * 🧬 ChefIApp Design System Tokens (Phase 16)
 * "The Visual Genetics of the Organism"
 */

export const Colors = {
    // BACKGROUNDS (VOID)
    void: {
        deep: '#000000',      // The infinite void
        base: '#1C1C1E',      // Standard interface background (iOS Gray 6)
        surface: '#2C2C2E',   // Cards / Elevated elements
        overlay: 'rgba(0,0,0,0.6)',
    },

    // NERVOUS SYSTEM STATES (FUNCTIONAL)
    state: {
        flow: '#32D74B',      // Green: Healthy, Operational (iOS Green)
        tension: '#FFD60A',   // Yellow: Stress, Warning (iOS Yellow)
        critical: '#FF453A',  // Red: Failure, Immediate Action (iOS Red)
        neutral: '#8E8E93',   // Gray: Dormant, Inactive
        intelligence: '#0A84FF', // Blue: Prediction, Brain Activity (iOS Blue)
    },

    // BRAND (GOLDMONKEY)
    brand: {
        gold: '#FFD700',      // The classic Gold
        accent: '#0A84FF',
    },

    // TEXT
    text: {
        primary: '#FFFFFF',
        secondary: 'rgba(235, 235, 245, 0.60)', // Apple Human Interface Guidelines
        tertiary: 'rgba(235, 235, 245, 0.30)',
    },

    // BORDERS
    border: {
        subtle: 'rgba(255, 255, 255, 0.1)',
        focused: 'rgba(255, 255, 255, 0.2)',
    }
} as const;

export const Typography = {
    family: {
        sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        mono: 'SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    size: {
        xs: '11px', // Labels
        sm: '13px', // Secondary text
        base: '15px', // Body text
        lg: '17px', // Headings
        xl: '20px', // Titles
        xxl: '28px', // Display
        giant: '34px' // Hero
    },
    weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700
    }
} as const;

export const Spacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
} as const;

export const Radius = {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
} as const;

export const Effects = {
    blur: {
        sm: 'backdrop-filter: blur(10px)',
        md: 'backdrop-filter: blur(20px)',
    },
    shadow: {
        glow: (color: string) => `0 0 20px ${color}40`, // 40 = 25% opacity
    }
} as const;
