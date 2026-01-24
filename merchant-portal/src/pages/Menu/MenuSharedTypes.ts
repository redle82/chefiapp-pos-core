export interface ParsedMenuItem {
    categoria: string;
    produto: string;
    preco: number;
    descricao?: string;
    ativo: boolean;
    iva?: number;       // Optional: only required for CSV import
    imageUrl?: string;  // Visual Polish
    lineNumber?: number; // Optional: only used for error reporting
}

export interface MenuPrompt {
    cuisine: string;
    vibe: 'CHEAP' | 'STANDARD' | 'PREMIUM';
    language: 'pt' | 'en';
}

// Runtime value to ensure module emits code
export const MENU_SHARED_TYPES_VERSION = '1.0.1';
