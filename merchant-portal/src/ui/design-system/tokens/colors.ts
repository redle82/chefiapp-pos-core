import { palette } from './palette';

// Semantic Color Definition
type ColorTheme = {
    surface: {
        base: string;
        layer1: string;
        layer2: string;
        layer3: string;
        highlight: string;
    };
    text: {
        primary: string;
        secondary: string;
        tertiary: string;
        quaternary: string;
        inverse: string;
    };
    action: {
        base: string;
        hover: string;
        text: string;
    };
    warning: {
        base: string;
        hover: string;
        text: string;
    };
    success: {
        base: string;
        hover: string;
        text: string;
    };
    destructive: {
        base: string;
        hover: string;
        text: string;
    };
    info: {
        base: string;
        hover: string;
        text: string;
    };
    border: {
        subtle: string;
        strong: string;
    };
};

// MODE 1: TPV (Dark Cockpit - Operational)
const tpv: ColorTheme = {
    surface: {
        base: palette.black,           // #000000 (Void)
        layer1: palette.zinc[950],     // #09090b (Tunnel)
        layer2: palette.zinc[900],     // #18181b (Card)
        layer3: palette.zinc[800],     // #27272a (Hover)
        highlight: palette.zinc[700],
    },
    text: {
        primary: palette.white,
        secondary: palette.zinc[300],
        tertiary: palette.zinc[500],
        quaternary: palette.zinc[600],
        inverse: palette.black,
    },
    action: {
        base: palette.emerald[600], // Money IN
        hover: palette.emerald[500],
        text: palette.white,
    },
    warning: {
        base: palette.amber[600],      // Action Required
        hover: palette.amber[500],
        text: palette.black,
    },
    success: {
        base: palette.emerald[600],
        hover: palette.emerald[500],
        text: palette.white,
    },
    destructive: {
        base: palette.fire[500], // RED OS
        hover: palette.fire[700],
        text: palette.white,
    },
    info: {
        base: palette.indigo[600],
        hover: palette.indigo[500],
        text: palette.white,
    },
    border: {
        subtle: palette.zinc[800],
        strong: palette.zinc[700],
    }
};

// MODE 2: DASHBOARD (Soft Dark - Management)
// Design Contract v1: dourado como cor de decisão (CTAs, títulos, itens activos).
const dashboard: ColorTheme = {
    surface: {
        base: palette.zinc[950],       // #09090b (Softer than black)
        layer1: palette.zinc[900],     // #18181b
        layer2: palette.zinc[800],     // #27272a
        layer3: palette.zinc[700],     // #3f3f46
        highlight: palette.zinc[600],
    },
    text: {
        primary: palette.zinc[50],
        secondary: palette.zinc[400],
        tertiary: palette.zinc[500],
        quaternary: palette.zinc[700],
        inverse: palette.black,
    },
    action: {
        base: palette.amber[600],   // Dourado (DNA da landing)
        hover: palette.amber[500],
        text: palette.black,
    },
    warning: {
        base: palette.amber[600],
        hover: palette.amber[500],
        text: palette.black,
    },
    success: {
        base: palette.emerald[600],
        hover: palette.emerald[500],
        text: palette.white,
    },
    destructive: {
        base: palette.fire[500],
        hover: palette.fire[700],
        text: palette.white,
    },
    info: {
        base: palette.blue[600],
        hover: palette.blue[500],
        text: palette.white,
    },
    border: {
        subtle: palette.zinc[800],
        strong: palette.zinc[700],
    }
};

export const colors = {
    palette,
    modes: {
        tpv,
        dashboard,
        // marketing: (Future)
    },
    // Default export helper (defaults to TPV for safety)
    ...tpv
} as const;
