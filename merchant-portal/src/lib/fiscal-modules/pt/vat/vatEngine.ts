export const PT_VAT_RATES = {
  standard: 0.23,
  intermediate: 0.13,
  reduced: 0.06,
  zero: 0,
} as const;

export type VatRate = (typeof PT_VAT_RATES)[keyof typeof PT_VAT_RATES];

export interface VatComputation {
  gross: number;
  net: number;
  vat: number;
  rate: number;
}

export interface VatTotalInput {
  gross: number;
  rate: number;
}

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const computeVatFromGross = (
  gross: number,
  rate: number,
): VatComputation => {
  if (gross < 0) {
    throw new Error("Gross amount must be zero or greater");
  }
  if (rate < 0) {
    throw new Error("VAT rate must be zero or greater");
  }

  if (rate === 0) {
    return {
      gross: roundCurrency(gross),
      net: roundCurrency(gross),
      vat: 0,
      rate,
    };
  }

  const net = gross / (1 + rate);
  const vat = gross - net;

  return {
    gross: roundCurrency(gross),
    net: roundCurrency(net),
    vat: roundCurrency(vat),
    rate,
  };
};

export const computeVatTotals = (items: VatTotalInput[]) => {
  const totals = items.reduce(
    (acc, item) => {
      const result = computeVatFromGross(item.gross, item.rate);
      return {
        gross: acc.gross + result.gross,
        net: acc.net + result.net,
        vat: acc.vat + result.vat,
      };
    },
    { gross: 0, net: 0, vat: 0 },
  );

  return {
    grossTotal: roundCurrency(totals.gross),
    netTotal: roundCurrency(totals.net),
    vatTotal: roundCurrency(totals.vat),
  };
};
