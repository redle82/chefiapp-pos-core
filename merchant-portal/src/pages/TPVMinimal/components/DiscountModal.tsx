/**
 * DiscountModal — Modal for applying percentage or fixed-amount discounts.
 *
 * Features:
 * - Percentage presets (5%, 10%, 15%, 20%) + custom %
 * - Fixed amount input (in cents)
 * - Live preview of discount amount
 * - Optional reason field
 * - Dark theme matching the POS palette
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";

type DiscountMode = "percentage" | "fixed";

export interface DiscountModalProps {
  subtotalCents: number;
  currentDiscountCents: number;
  onApply: (discountCents: number, reason?: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

const PERCENTAGE_PRESETS = [5, 10, 15, 20];

export function DiscountModal({
  subtotalCents,
  currentDiscountCents,
  onApply,
  onRemove,
  onClose,
}: DiscountModalProps) {
  const { t } = useTranslation("tpv");
  const { formatAmount } = useCurrency();

  const [mode, setMode] = useState<DiscountMode>("percentage");
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [customPct, setCustomPct] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [reason, setReason] = useState("");

  const computedDiscountCents = useCallback((): number => {
    if (mode === "percentage") {
      const pct = selectedPct ?? (customPct ? parseFloat(customPct) : 0);
      if (Number.isNaN(pct) || pct <= 0) return 0;
      const clamped = Math.min(pct, 100);
      return Math.round(subtotalCents * (clamped / 100));
    }
    const cents = fixedAmount ? Math.round(parseFloat(fixedAmount) * 100) : 0;
    if (Number.isNaN(cents) || cents <= 0) return 0;
    return Math.min(cents, subtotalCents);
  }, [mode, selectedPct, customPct, fixedAmount, subtotalCents]);

  const discountPreview = computedDiscountCents();
  const isValid = discountPreview > 0;

  const activePct = selectedPct ?? (customPct ? parseFloat(customPct) : null);
  const exceedsMax =
    mode === "percentage"
      ? activePct !== null && activePct > 100
      : fixedAmount
        ? Math.round(parseFloat(fixedAmount) * 100) > subtotalCents
        : false;

  const handleApply = () => {
    if (!isValid || exceedsMax) return;
    onApply(discountPreview, reason.trim() || undefined);
  };

  const handlePresetClick = (pct: number) => {
    setSelectedPct(pct);
    setCustomPct("");
  };

  const handleCustomPctChange = (value: string) => {
    setCustomPct(value);
    setSelectedPct(null);
  };

  return (
    <div
      data-testid="discount-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        data-testid="discount-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0a0a",
          border: "1px solid #27272a",
          borderRadius: 20,
          width: "min(440px, 92vw)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Title */}
        <h2 style={{ color: "#fafafa", fontSize: 20, fontWeight: 700, margin: 0 }}>
          {t("discount.title", "Aplicar Desconto")}
        </h2>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["percentage", "fixed"] as const).map((m) => {
            const isActive = mode === m;
            return (
              <button
                key={m}
                type="button"
                data-testid={`mode-${m}`}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: isActive ? "#1e1e1e" : "transparent",
                  border: isActive
                    ? "2px solid #f97316"
                    : "2px solid #27272a",
                  borderRadius: 10,
                  color: isActive ? "#fafafa" : "#9ca3af",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {m === "percentage"
                  ? t("discount.percentage", "Percentagem")
                  : t("discount.fixed", "Valor Fixo")}
              </button>
            );
          })}
        </div>

        {/* Percentage mode content */}
        {mode === "percentage" && (
          <>
            {/* Preset buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {PERCENTAGE_PRESETS.map((pct) => {
                const isSelected = selectedPct === pct && !customPct;
                return (
                  <button
                    key={pct}
                    type="button"
                    data-testid={`preset-${pct}`}
                    onClick={() => handlePresetClick(pct)}
                    style={{
                      flex: 1,
                      padding: "14px 0",
                      background: isSelected ? "#431407" : "#141414",
                      border: isSelected
                        ? "2px solid #f97316"
                        : "2px solid transparent",
                      borderRadius: 10,
                      color: isSelected ? "#fafafa" : "#d4d4d8",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                  >
                    {pct}%
                    <div style={{ fontSize: 11, color: "#71717a", marginTop: 2, fontWeight: 400 }}>
                      {formatAmount(Math.round(subtotalCents * (pct / 100)))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom percentage input */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#9ca3af", fontSize: 13, whiteSpace: "nowrap" }}>
                {t("discount.custom", "Personalizado")}:
              </span>
              <input
                type="number"
                data-testid="custom-pct-input"
                min={0}
                max={100}
                step={1}
                value={customPct}
                onChange={(e) => handleCustomPctChange(e.target.value)}
                placeholder="0"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "#141414",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  color: "#fafafa",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <span style={{ color: "#9ca3af", fontSize: 15 }}>%</span>
            </div>
          </>
        )}

        {/* Fixed mode content */}
        {mode === "fixed" && (
          <div>
            <input
              type="number"
              data-testid="fixed-amount-input"
              min={0}
              step={0.01}
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "#141414",
                border: "1px solid #27272a",
                borderRadius: 10,
                color: "#fafafa",
                fontSize: 18,
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Validation error */}
        {exceedsMax && (
          <div
            data-testid="validation-error"
            style={{ color: "#ef4444", fontSize: 12, fontWeight: 500 }}
          >
            {t("discount.maxExceeded", "Desconto nao pode exceder o total")}
          </div>
        )}

        {/* Preview */}
        {discountPreview > 0 && !exceedsMax && (
          <div
            data-testid="discount-preview"
            style={{
              background: "#141414",
              padding: 14,
              borderRadius: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: 13 }}>
              {t("discount.preview", { amount: formatAmount(discountPreview), defaultValue: "Desconto: {{amount}}" })}
            </span>
            <span style={{ color: "#f97316", fontSize: 18, fontWeight: 700 }}>
              -{formatAmount(discountPreview)}
            </span>
          </div>
        )}

        {/* Reason input */}
        <input
          type="text"
          data-testid="reason-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t(
            "discount.reasonPlaceholder",
            "Ex: Desconto funcionario, Happy Hour...",
          )}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "#141414",
            border: "1px solid #27272a",
            borderRadius: 10,
            color: "#fafafa",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div style={{ color: "#71717a", fontSize: 11, marginTop: -10 }}>
          {t("discount.reason", "Motivo (opcional)")}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {currentDiscountCents > 0 && (
            <button
              type="button"
              data-testid="remove-discount-btn"
              onClick={onRemove}
              style={{
                flex: 1,
                padding: "14px 0",
                background: "#1e1e1e",
                border: "1px solid #dc2626",
                borderRadius: 12,
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("discount.remove", "Remover desconto")}
            </button>
          )}
          <button
            type="button"
            data-testid="apply-discount-btn"
            disabled={!isValid || exceedsMax}
            onClick={handleApply}
            style={{
              flex: 2,
              padding: "14px 0",
              background: isValid && !exceedsMax ? "#f97316" : "#333",
              border: "none",
              borderRadius: 12,
              color: isValid && !exceedsMax ? "#fff" : "#666",
              fontSize: 14,
              fontWeight: 700,
              cursor: isValid && !exceedsMax ? "pointer" : "not-allowed",
            }}
          >
            {t("discount.apply", "Aplicar")}
          </button>
        </div>

        {/* Close via overlay or ESC — close button inside for accessibility */}
        <button
          type="button"
          data-testid="close-discount-btn"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "#9ca3af",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Close"
        >
          {"\u2715"}
        </button>
      </div>
    </div>
  );
}
