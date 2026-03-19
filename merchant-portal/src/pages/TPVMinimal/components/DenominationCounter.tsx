/**
 * DenominationCounter — Professional cash counting by denomination.
 *
 * Lets operators count cash by denomination (e.g., "3 x €50 = €150")
 * instead of entering a single total. Supports EUR, BRL, and USD.
 */

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";

/* ── Types ───────────────────────────────────────────────────────── */

interface DenominationCounterProps {
  currency: string; // "EUR", "BRL", "USD"
  onChange: (totalCents: number) => void;
  expectedCents?: number; // to show difference
}

interface Denomination {
  /** Face value in major currency units (e.g. 50 means €50, 0.50 means €0.50) */
  value: number;
  type: "note" | "coin";
}

/* ── Denomination definitions per currency ───────────────────────── */

const DENOMINATIONS: Record<string, Denomination[]> = {
  EUR: [
    // Notes
    { value: 500, type: "note" },
    { value: 200, type: "note" },
    { value: 100, type: "note" },
    { value: 50, type: "note" },
    { value: 20, type: "note" },
    { value: 10, type: "note" },
    { value: 5, type: "note" },
    // Coins
    { value: 2, type: "coin" },
    { value: 1, type: "coin" },
    { value: 0.5, type: "coin" },
    { value: 0.2, type: "coin" },
    { value: 0.1, type: "coin" },
    { value: 0.05, type: "coin" },
    { value: 0.02, type: "coin" },
    { value: 0.01, type: "coin" },
  ],
  BRL: [
    // Notes
    { value: 200, type: "note" },
    { value: 100, type: "note" },
    { value: 50, type: "note" },
    { value: 20, type: "note" },
    { value: 10, type: "note" },
    { value: 5, type: "note" },
    { value: 2, type: "note" },
    // Coins
    { value: 1, type: "coin" },
    { value: 0.5, type: "coin" },
    { value: 0.25, type: "coin" },
    { value: 0.1, type: "coin" },
    { value: 0.05, type: "coin" },
  ],
  USD: [
    // Notes
    { value: 100, type: "note" },
    { value: 50, type: "note" },
    { value: 20, type: "note" },
    { value: 10, type: "note" },
    { value: 5, type: "note" },
    { value: 2, type: "note" },
    { value: 1, type: "note" },
    // Coins
    { value: 1, type: "coin" },
    { value: 0.5, type: "coin" },
    { value: 0.25, type: "coin" },
    { value: 0.1, type: "coin" },
    { value: 0.05, type: "coin" },
    { value: 0.01, type: "coin" },
  ],
};

/* ── Styles ───────────────────────────────────────────────────────── */

const s = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  } as React.CSSProperties,

  sectionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  } as React.CSSProperties,

  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: "var(--text-secondary, #9ca3af)",
    paddingBottom: 6,
    borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
    marginBottom: 2,
  } as React.CSSProperties,

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 60px 1fr",
    alignItems: "center",
    gap: 8,
    padding: "3px 0",
  } as React.CSSProperties,

  denomLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary, #fafafa)",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  qtyInput: {
    width: 60,
    background: "var(--surface-base, #0f0f0f)",
    border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
    borderRadius: 6,
    padding: "6px 8px",
    color: "var(--text-primary, #fafafa)",
    fontSize: 14,
    textAlign: "center" as const,
    outline: "none",
    transition: "border-color 0.15s ease",
  } as React.CSSProperties,

  subtotal: {
    fontSize: 13,
    color: "var(--text-secondary, #9ca3af)",
    textAlign: "right" as const,
  } as React.CSSProperties,

  subtotalActive: {
    fontSize: 13,
    color: "var(--text-primary, #fafafa)",
    fontWeight: 600,
    textAlign: "right" as const,
  } as React.CSSProperties,

  footer: {
    borderTop: "2px solid var(--border-subtle, rgba(255,255,255,0.12))",
    paddingTop: 12,
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  } as React.CSSProperties,

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  } as React.CSSProperties,

  totalLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-secondary, #9ca3af)",
  } as React.CSSProperties,

  totalValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary, #fafafa)",
  } as React.CSSProperties,

  diffRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  } as React.CSSProperties,

  diffLabel: {
    fontSize: 13,
    color: "var(--text-secondary, #9ca3af)",
  } as React.CSSProperties,

  diffMatch: {
    fontSize: 14,
    fontWeight: 600,
    color: "#4ade80",
  } as React.CSSProperties,

  diffOver: {
    fontSize: 14,
    fontWeight: 600,
    color: "#facc15",
  } as React.CSSProperties,

  diffUnder: {
    fontSize: 14,
    fontWeight: 600,
    color: "#f87171",
  } as React.CSSProperties,
} as const;

/* ── Component ───────────────────────────────────────────────────── */

export function DenominationCounter({
  currency,
  onChange,
  expectedCents,
}: DenominationCounterProps) {
  const { t } = useTranslation("shift");
  const { formatAmount } = useCurrency();

  const denominations = DENOMINATIONS[currency] ?? DENOMINATIONS.EUR;
  const notes = useMemo(
    () => denominations.filter((d) => d.type === "note"),
    [denominations],
  );
  const coins = useMemo(
    () => denominations.filter((d) => d.type === "coin"),
    [denominations],
  );

  // Map denomination value to quantity string (keep as string for input control)
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const handleQtyChange = useCallback(
    (denomValue: number, raw: string) => {
      const next = { ...quantities, [String(denomValue)]: raw };
      setQuantities(next);

      // Compute total in cents
      let totalCents = 0;
      for (const d of denominations) {
        const qty = Number.parseInt(next[String(d.value)] ?? "0", 10);
        if (!Number.isNaN(qty) && qty > 0) {
          totalCents += Math.round(qty * d.value * 100);
        }
      }
      onChange(totalCents);
    },
    [quantities, denominations, onChange],
  );

  const totalCents = useMemo(() => {
    let total = 0;
    for (const d of denominations) {
      const qty = Number.parseInt(quantities[String(d.value)] ?? "0", 10);
      if (!Number.isNaN(qty) && qty > 0) {
        total += Math.round(qty * d.value * 100);
      }
    }
    return total;
  }, [quantities, denominations]);

  const diffCents =
    expectedCents !== undefined ? totalCents - expectedCents : undefined;

  const formatDenomLabel = (value: number): string => {
    if (value >= 1) return String(value);
    // For sub-unit coins, show with decimals (e.g. "0.50", "0.05")
    return value.toFixed(2);
  };

  const renderDenomRow = (denom: Denomination) => {
    const key = String(denom.value);
    const rawQty = quantities[key] ?? "";
    const qty = Number.parseInt(rawQty || "0", 10);
    const subCents =
      !Number.isNaN(qty) && qty > 0 ? Math.round(qty * denom.value * 100) : 0;

    return (
      <div key={`${denom.type}-${key}`} style={s.row}>
        <span style={s.denomLabel}>{formatDenomLabel(denom.value)}</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={rawQty}
          placeholder="0"
          onChange={(e) => handleQtyChange(denom.value, e.target.value)}
          onFocus={(e) => {
            e.target.style.borderColor = "#f97316";
            if (e.target.value === "0") e.target.select();
          }}
          onBlur={(e) => {
            e.target.style.borderColor =
              "var(--border-subtle, rgba(255,255,255,0.12))";
          }}
          style={s.qtyInput}
        />
        <span style={subCents > 0 ? s.subtotalActive : s.subtotal}>
          {subCents > 0 ? formatAmount(subCents) : "--"}
        </span>
      </div>
    );
  };

  return (
    <div style={s.container}>
      {/* Notes + Coins side by side */}
      <div style={s.sectionsGrid}>
        {/* Notes */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            {t("denomination.notes", "Notas")}
          </div>
          {notes.map(renderDenomRow)}
        </div>

        {/* Coins */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            {t("denomination.coins", "Moedas")}
          </div>
          {coins.map(renderDenomRow)}
        </div>
      </div>

      {/* Footer: Total + Difference */}
      <div style={s.footer}>
        <div style={s.totalRow}>
          <span style={s.totalLabel}>
            {t("denomination.total", "Total")}
          </span>
          <span style={s.totalValue}>{formatAmount(totalCents)}</span>
        </div>

        {diffCents !== undefined && (
          <div style={s.diffRow}>
            <span style={s.diffLabel}>
              {t("denomination.difference", "Diferenca")}
            </span>
            {diffCents === 0 ? (
              <span style={s.diffMatch}>
                {t("denomination.match", "Saldo correto!")}
              </span>
            ) : diffCents > 0 ? (
              <span style={s.diffOver}>
                {t("denomination.over", "Excesso de {{amount}}", {
                  amount: formatAmount(diffCents),
                })}
              </span>
            ) : (
              <span style={s.diffUnder}>
                {t("denomination.under", "Falta {{amount}}", {
                  amount: formatAmount(Math.abs(diffCents)),
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
