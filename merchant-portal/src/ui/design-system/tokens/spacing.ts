export const spacing = {
    // Grid System (4px Baseline)
    0: '0px',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px

    // Semantic Spacing
    layout: {
        page: '1.5rem',    // Standard page padding
        card: '1.25rem',   // Standard card padding
        section: '2rem',   // Section separation
    },

    // Touch Targets (Critical for TPV)
    touch: {
        min: '3rem',       // 48px (Minimum touch target)
        comfortable: '4rem', // 64px (Ideal button height)
    }
} as const;
