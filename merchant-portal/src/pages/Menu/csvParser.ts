/**
 * CSV Parser for Menu Import
 * 
 * Parses and validates CSV files for menu import.
 * Supports multiple encodings, separators, and header variations.
 */
import Papa from 'papaparse';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

import type { ParsedMenuItem } from './MenuSharedTypes';
export type { ParsedMenuItem };

export interface ParseError {
    lineNumber: number;
    code: string;
    message: string;
    field?: string;
}

export interface ParseWarning {
    lineNumber: number;
    code: string;
    message: string;
}

export interface ParseResult {
    items: ParsedMenuItem[];
    errors: ParseError[];
    warnings: ParseWarning[];
    categories: string[];
    totalLines: number;
}

// ─────────────────────────────────────────────────────────────
// Header Mapping (accepts variations)
// ─────────────────────────────────────────────────────────────

const HEADER_MAP: Record<string, string[]> = {
    categoria: ['categoria', 'category', 'cat', 'grupo'],
    produto: ['produto', 'product', 'nome', 'name', 'item'],
    preco: ['preco', 'preço', 'price', 'valor', 'value'],
    descricao: ['descricao', 'descrição', 'description', 'desc'],
    ativo: ['ativo', 'active', 'enabled', 'disponivel', 'disponível'],
    iva: ['iva', 'vat', 'tax', 'imposto'],
};

function normalizeHeader(header: string): string | null {
    const normalized = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(HEADER_MAP)) {
        if (aliases.includes(normalized)) {
            return field;
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────────────────────

function validateRow(
    row: Record<string, string>,
    lineNumber: number,
    seenProducts: Set<string>
): { item: ParsedMenuItem | null; errors: ParseError[]; warnings: ParseWarning[] } {
    const errors: ParseError[] = [];
    const warnings: ParseWarning[] = [];

    // E001: Categoria obrigatória
    const categoria = (row.categoria || '').trim();
    if (!categoria) {
        errors.push({
            lineNumber,
            code: 'E001',
            message: 'Categoria é obrigatória',
            field: 'categoria'
        });
    }

    // E002: Produto obrigatório
    const produto = (row.produto || '').trim();
    if (!produto) {
        errors.push({
            lineNumber,
            code: 'E002',
            message: 'Nome do produto é obrigatório',
            field: 'produto'
        });
    }

    // E003/E004: Preço válido
    const precoStr = (row.preco || '').replace(',', '.').trim();
    const preco = parseFloat(precoStr);
    if (isNaN(preco)) {
        errors.push({
            lineNumber,
            code: 'E003',
            message: 'Preço deve ser um número',
            field: 'preco'
        });
    } else if (preco <= 0) {
        errors.push({
            lineNumber,
            code: 'E004',
            message: 'Preço deve ser maior que zero',
            field: 'preco'
        });
    } else if (preco > 10000) {
        errors.push({
            lineNumber,
            code: 'E005',
            message: 'Preço excede o limite (10000€)',
            field: 'preco'
        });
    }

    // W001: Duplicado
    const productKey = `${categoria.toLowerCase()}|${produto.toLowerCase()}`;
    if (seenProducts.has(productKey)) {
        warnings.push({
            lineNumber,
            code: 'W001',
            message: `Produto "${produto}" duplicado na categoria "${categoria}" (será ignorado)`
        });
    } else {
        seenProducts.add(productKey);
    }

    // Descrição (opcional, max 500)
    let descricao = (row.descricao || '').trim();
    if (descricao.length > 500) {
        descricao = descricao.substring(0, 500);
        warnings.push({
            lineNumber,
            code: 'W002',
            message: 'Descrição truncada para 500 caracteres'
        });
    }

    // Ativo (default: true)
    const ativoStr = (row.ativo || 'true').toLowerCase().trim();
    const ativo = ativoStr !== 'false' && ativoStr !== '0' && ativoStr !== 'no';

    // IVA (default: 23)
    const ivaStr = (row.iva || '23').replace(',', '.').trim();
    let iva = parseFloat(ivaStr);
    if (isNaN(iva) || iva < 0 || iva > 100) {
        iva = 23;
    }
    if (iva !== 6 && iva !== 13 && iva !== 23 && iva !== 0) {
        warnings.push({
            lineNumber,
            code: 'W003',
            message: `IVA incomum: ${iva}%`
        });
    }

    if (errors.length > 0) {
        return { item: null, errors, warnings };
    }

    return {
        item: {
            categoria,
            produto,
            preco: Math.round(preco * 100) / 100,
            descricao: descricao || undefined,
            ativo,
            iva,
            lineNumber
        },
        errors,
        warnings
    };
}

// ─────────────────────────────────────────────────────────────
// Main Parser
// ─────────────────────────────────────────────────────────────

export function parseMenuCSV(csvContent: string): ParseResult {
    const result: ParseResult = {
        items: [],
        errors: [],
        warnings: [],
        categories: [],
        totalLines: 0
    };

    // Parse with PapaParse
    const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => normalizeHeader(header) || header.toLowerCase().trim()
    });

    if (parsed.errors.length > 0) {
        for (const err of parsed.errors) {
            result.errors.push({
                lineNumber: (err.row ?? 0) + 2, // +2 for header + 1-indexed
                code: 'E000',
                message: `Erro de parsing: ${err.message}`
            });
        }
    }

    const seenProducts = new Set<string>();
    const categoriesSet = new Set<string>();

    for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i] as Record<string, string>;
        const lineNumber = i + 2; // +2 for header + 1-indexed
        result.totalLines++;

        // Skip empty rows
        if (!row.categoria && !row.produto && !row.preco) {
            continue;
        }

        const { item, errors, warnings } = validateRow(row, lineNumber, seenProducts);

        result.errors.push(...errors);
        result.warnings.push(...warnings);

        if (item && !warnings.some(w => w.code === 'W001')) {
            result.items.push(item);
            categoriesSet.add(item.categoria);
        }
    }

    result.categories = Array.from(categoriesSet).sort();

    return result;
}

// ─────────────────────────────────────────────────────────────
// File Reader Helper
// ─────────────────────────────────────────────────────────────

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file, 'UTF-8');
    });
}

// ─────────────────────────────────────────────────────────────
// Template Generator
// ─────────────────────────────────────────────────────────────

export function generateCSVTemplate(): string {
    return `categoria,produto,preco,descricao,ativo,iva
Entradas,Nome do produto,0.00,Descrição opcional,true,23
`;
}

export function downloadTemplate() {
    const content = generateCSVTemplate();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menu-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
}
