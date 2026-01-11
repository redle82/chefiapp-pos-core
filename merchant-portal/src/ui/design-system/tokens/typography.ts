export const typography = {
    family: {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        mono: 'JetBrains Mono, Menlo, monospace',
    },

    // Font Sizes (Operational Scale)
    size: {
        xs: '0.75rem',    // 12px (Metadata only)
        sm: '0.875rem',   // 14px (Min Readable)
        base: '1rem',     // 16px (Standard)
        md: '1rem',       // 16px (Alias for base - backward compat)
        lg: '1.125rem',   // 18px (Button/Action)
        xl: '1.25rem',    // 20px (Section Header)
        '2xl': '1.5rem',  // 24px (Card ID / Title)
        '3xl': '1.875rem',// 30px (Hero)
        '4xl': '2.25rem', // 36px (Total Value)
    },

    // Font Weights (Heavy Scanning)
    weight: {
        regular: 400,
        medium: 500,
        bold: 700,
        black: 900, // IDs and Totals
    },

    // Line Heights (Tight for density)
    leading: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
    }
} as const;
