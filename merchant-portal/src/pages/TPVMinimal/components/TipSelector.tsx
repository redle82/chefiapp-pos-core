/**
 * TipSelector — Inline tip selection for the payment flow.
 *
 * Appears between the order summary and the payment method selector.
 * Compact, dark theme with amber accents.
 *
 * Features:
 * - Preset percentage buttons: 5%, 10%, 15%, 20%
 * - Round-up button (e.g., 34.20 -> 35.00)
 * - Custom amount input
 * - "No tip" option (default)
 * - Shows: Subtotal + Tip = New Total
 */

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";
import { calculateTipSuggestions } from "../../../core/payment/TipService";

interface TipSelectorProps {
  /** Total after tax & discount (the base for tip calculation). */
  totalCents: number;
  /** Currently selected tip in cents. */
  tipCents: number;
  /** Callback when tip changes. */
  onTipChange: (cents: number) => void;
}

export function TipSelector({ totalCents, tipCents, onTipChange }: TipSelectorProps) {
  const { t } = useTranslation("tpv");
  const { formatAmount } = useCurrency();
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const suggestions = useMemo(
    () => calculateTipSuggestions(totalCents),
    [totalCents],
  );

  const roundUpSuggestion = suggestions.find((s) => s.type === "round_up");
  const percentageSuggestions = suggestions.filter((s) => s.type === "percentage");

  const handlePresetClick = useCallback(
    (amountCents: number) => {
      setCustomMode(false);
      setCustomValue("");
      onTipChange(tipCents === amountCents ? 0 : amountCents);
    },
    [tipCents, onTipChange],
  );

  const handleNoTip = useCallback(() => {
    setCustomMode(false);
    setCustomValue("");
    onTipChange(0);
  }, [onTipChange]);

  const handleCustomToggle = useCallback(() => {
    if (customMode) {
      setCustomMode(false);
      setCustomValue("");
      onTipChange(0);
    } else {
      setCustomMode(true);
    }
  }, [customMode, onTipChange]);

  const handleCustomSubmit = useCallback(() => {
    const parsed = parseFloat(customValue.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      onTipChange(Math.round(parsed * 100));
    }
  }, [customValue, onTipChange]);

  const isNoTipSelected = tipCents === 0 && !customMode;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Section label */}
      <div
        style={{
          color: "#a1a1aa",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {t("posView.tipTitle")}
      </div>

      {/* Preset buttons row */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {/* No tip */}
        <TipButton
          label={t("posView.noTip")}
          isSelected={isNoTipSelected}
          onClick={handleNoTip}
        />

        {/* Percentage presets */}
        {percentageSuggestions.map((s) => (
          <TipButton
            key={s.percentage}
            label={s.label}
            sublabel={formatAmount(s.amountCents)}
            isSelected={tipCents === s.amountCents && !customMode}
            onClick={() => handlePresetClick(s.amountCents)}
          />
        ))}

        {/* Round up */}
        {roundUpSuggestion && (
          <TipButton
            label={t("tip.roundUp")}
            sublabel={formatAmount(roundUpSuggestion.amountCents)}
            isSelected={tipCents === roundUpSuggestion.amountCents && !customMode}
            onClick={() => handlePresetClick(roundUpSuggestion.amountCents)}
            accent
          />
        )}

        {/* Custom */}
        <TipButton
          label={t("tip.custom")}
          isSelected={customMode}
          onClick={handleCustomToggle}
          accent
        />
      </div>

      {/* Custom amount input */}
      {customMode && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            autoFocus
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "#18181b",
              border: "1px solid #f59e0b",
              borderRadius: 10,
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              outline: "none",
              fontFamily: "system-ui, sans-serif",
            }}
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            style={{
              padding: "10px 16px",
              background: "#f59e0b",
              border: "none",
              borderRadius: 10,
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      )}

      {/* Summary: Subtotal + Tip = New Total */}
      {tipCents > 0 && (
        <div
          style={{
            background: "#18181b",
            padding: "10px 14px",
            borderRadius: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: "#71717a", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t("posView.tipLabel")}
            </span>
            <span style={{ color: "#f59e0b", fontSize: 16, fontWeight: 700 }}>
              +{formatAmount(tipCents)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ color: "#71717a", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t("posView.totalWithTip")}
            </span>
            <span style={{ color: "#10b981", fontSize: 18, fontWeight: 800 }}>
              {formatAmount(totalCents + tipCents)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function TipButton({
  label,
  sublabel,
  isSelected,
  onClick,
  accent,
}: {
  label: string;
  sublabel?: string;
  isSelected: boolean;
  onClick: () => void;
  accent?: boolean;
}) {
  const selectedBg = accent ? "#451a03" : "#1e1b4b";
  const selectedBorder = accent ? "#f59e0b" : "#6366f1";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "1 1 0",
        minWidth: 56,
        padding: sublabel ? "8px 4px 6px" : "10px 4px",
        background: isSelected ? selectedBg : "#18181b",
        border: `2px solid ${isSelected ? selectedBorder : "transparent"}`,
        borderRadius: 10,
        color: isSelected ? "#fff" : "#d4d4d8",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        transition: "all 0.15s ease",
      }}
    >
      <span>{label}</span>
      {sublabel && (
        <span style={{ fontSize: 10, color: "#71717a", fontWeight: 400 }}>
          {sublabel}
        </span>
      )}
    </button>
  );
}
