/**
 * TaxCalculator — Cálculo de IVA português por região.
 *
 * Taxas de IVA em vigor (2024):
 *   Continente: 23% (NOR), 13% (INT), 6% (RED), 0% (ISE)
 *   Açores:     18% (NOR), 9% (INT), 4% (RED), 0% (ISE)
 *   Madeira:    22% (NOR), 12% (INT), 5% (RED), 0% (ISE)
 *
 * Referência: Código do IVA, art.º 18.º
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type TaxRateCode = 'NOR' | 'INT' | 'RED' | 'ISE';
export type TaxRegion = 'PT' | 'AZ' | 'MA';

export interface TaxBreakdown {
  /** Taxa aplicada (ex.: 0.23) */
  rate: number;
  /** Código da taxa ('NOR', 'INT', 'RED', 'ISE') */
  rateCode: TaxRateCode;
  /** Valor base (líquido, sem IVA) — 2 casas decimais */
  netAmount: number;
  /** Valor do imposto — 2 casas decimais */
  taxAmount: number;
}

export interface OrderItem {
  /** Código do produto */
  productCode: string;
  /** Descrição */
  description: string;
  /** Quantidade */
  quantity: number;
  /** Preço unitário com IVA incluído (em euros) */
  unitPriceGross: number;
  /** Código da taxa de IVA — se omitido, usa 'NOR' */
  taxRateCode?: TaxRateCode;
  /** Motivo de isenção (obrigatório quando taxRateCode = 'ISE') */
  taxExemptionReason?: string;
  /** Código de isenção AT (M01-M99) */
  taxExemptionCode?: string;
}

export interface SaftTaxTableEntry {
  taxType: 'IVA';
  taxCountryRegion: string; // 'PT', 'PT-AC', 'PT-MA'
  taxCode: TaxRateCode;
  description: string;
  taxPercentage: number; // ex.: 23.00
}

// ---------------------------------------------------------------------------
// Tabela de taxas por região
// ---------------------------------------------------------------------------

type RateTable = Record<TaxRateCode, number>;

const RATES: Record<TaxRegion, RateTable> = {
  PT: { NOR: 0.23, INT: 0.13, RED: 0.06, ISE: 0.00 },
  AZ: { NOR: 0.18, INT: 0.09, RED: 0.04, ISE: 0.00 },
  MA: { NOR: 0.22, INT: 0.12, RED: 0.05, ISE: 0.00 },
};

/** Mapeamento de região para código SAF-T */
const REGION_CODES: Record<TaxRegion, string> = {
  PT: 'PT',
  AZ: 'PT-AC',
  MA: 'PT-MA',
};

/** Descrições das taxas para tabela SAF-T */
const RATE_DESCRIPTIONS: Record<TaxRateCode, string> = {
  NOR: 'Taxa Normal',
  INT: 'Taxa Intermédia',
  RED: 'Taxa Reduzida',
  ISE: 'Isento',
};

// ---------------------------------------------------------------------------
// Categoria de produto -> taxa IVA
// ---------------------------------------------------------------------------

/**
 * Mapeamento simplificado de categorias de restauração para taxas de IVA.
 * Referência: Código do IVA, Lista I (RED) e Lista II (INT).
 *
 * Em restauração:
 *   - Refeições servidas no local: INT (13% continente)
 *   - Bebidas alcoólicas: NOR (23%)
 *   - Bebidas não-alcoólicas (sumos naturais, água): INT (13%)
 *   - Refrigerantes, cafés: INT (13%)
 *   - Take-away / delivery: INT (13%) — mesma taxa que no local desde 2023
 *   - Produtos alimentares embalados: RED (6%)
 */
const CATEGORY_RATE_MAP: Record<string, TaxRateCode> = {
  // Comida
  food: 'INT',
  meal: 'INT',
  starter: 'INT',
  main: 'INT',
  dessert: 'INT',
  side: 'INT',
  soup: 'INT',
  salad: 'INT',
  snack: 'INT',
  bread: 'INT',
  takeaway: 'INT',
  delivery: 'INT',

  // Bebidas
  alcohol: 'NOR',
  beer: 'NOR',
  wine: 'NOR',
  spirits: 'NOR',
  cocktail: 'NOR',
  liquor: 'NOR',

  water: 'INT',
  juice: 'INT',
  coffee: 'INT',
  tea: 'INT',
  soda: 'INT',
  soft_drink: 'INT',

  // Produtos embalados
  packaged_food: 'RED',
  grocery: 'RED',
};

// ---------------------------------------------------------------------------
// Utilitários de arredondamento
// ---------------------------------------------------------------------------

/** Arredondamento bancário a 2 casas decimais */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ---------------------------------------------------------------------------
// TaxCalculator
// ---------------------------------------------------------------------------

export class TaxCalculator {
  /** Taxas de IVA português por região */
  static PT_RATES = {
    // Continente
    NOR: 0.23,
    INT: 0.13,
    RED: 0.06,
    ISE: 0.00,
    // Açores
    NOR_AZ: 0.18,
    INT_AZ: 0.09,
    RED_AZ: 0.04,
    // Madeira
    NOR_MA: 0.22,
    INT_MA: 0.12,
    RED_MA: 0.05,
  } as const;

  /**
   * Calcula o desdobramento de impostos para um conjunto de itens de pedido.
   *
   * Os preços dos itens são assumidos como valores com IVA incluído (bruto),
   * como é prática corrente na restauração portuguesa.
   *
   * @param items - Itens do pedido
   * @param region - Região fiscal (PT = continente, AZ = Açores, MA = Madeira)
   * @returns Array de TaxBreakdown agrupado por taxa
   */
  calculateOrderTax(
    items: OrderItem[],
    region: TaxRegion = 'PT',
  ): TaxBreakdown[] {
    const rateTable = RATES[region];
    const breakdownMap = new Map<TaxRateCode, { net: number; tax: number }>();

    for (const item of items) {
      const rateCode = item.taxRateCode ?? 'NOR';
      const rate = rateTable[rateCode];
      const lineGross = round2(item.unitPriceGross * item.quantity);

      // Extrair IVA do preço bruto: base = bruto / (1 + taxa)
      const lineNet = rate > 0 ? round2(lineGross / (1 + rate)) : lineGross;
      const lineTax = round2(lineGross - lineNet);

      const existing = breakdownMap.get(rateCode);
      if (existing) {
        existing.net = round2(existing.net + lineNet);
        existing.tax = round2(existing.tax + lineTax);
      } else {
        breakdownMap.set(rateCode, { net: lineNet, tax: lineTax });
      }
    }

    const result: TaxBreakdown[] = [];
    for (const [rateCode, amounts] of breakdownMap) {
      result.push({
        rate: rateTable[rateCode],
        rateCode,
        netAmount: amounts.net,
        taxAmount: amounts.tax,
      });
    }

    // Ordenar por taxa decrescente (NOR primeiro)
    result.sort((a, b) => b.rate - a.rate);
    return result;
  }

  /**
   * Obtém a taxa de IVA para uma categoria de produto.
   *
   * @param category - Categoria do produto (ex.: 'food', 'alcohol', 'water')
   * @param region - Região fiscal
   * @returns Taxa de IVA como decimal (ex.: 0.23)
   */
  getRate(category: string, region: TaxRegion = 'PT'): number {
    const rateCode = CATEGORY_RATE_MAP[category.toLowerCase()] ?? 'NOR';
    return RATES[region][rateCode];
  }

  /**
   * Obtém o código da taxa para uma categoria de produto.
   */
  getRateCode(category: string): TaxRateCode {
    return CATEGORY_RATE_MAP[category.toLowerCase()] ?? 'NOR';
  }

  /**
   * Gera a tabela de impostos SAF-T a partir dos breakdowns calculados.
   *
   * @param breakdowns - Breakdowns calculados por calculateOrderTax
   * @param region - Região fiscal
   * @returns Entradas para TaxTable do SAF-T
   */
  toSaftTaxTable(
    breakdowns: TaxBreakdown[],
    region: TaxRegion = 'PT',
  ): SaftTaxTableEntry[] {
    const countryRegion = REGION_CODES[region];

    return breakdowns.map((b) => ({
      taxType: 'IVA' as const,
      taxCountryRegion: countryRegion,
      taxCode: b.rateCode,
      description: RATE_DESCRIPTIONS[b.rateCode],
      taxPercentage: round2(b.rate * 100),
    }));
  }

  /**
   * Calcula totais do documento a partir dos breakdowns.
   */
  calculateDocumentTotals(breakdowns: TaxBreakdown[]): {
    netTotal: number;
    taxPayable: number;
    grossTotal: number;
  } {
    let netTotal = 0;
    let taxPayable = 0;

    for (const b of breakdowns) {
      netTotal = round2(netTotal + b.netAmount);
      taxPayable = round2(taxPayable + b.taxAmount);
    }

    return {
      netTotal,
      taxPayable,
      grossTotal: round2(netTotal + taxPayable),
    };
  }
}
