/**
 * CloseCashRegisterModal — FASE 2.3: Fecho de caixa com total esperado vs declarado
 *
 * UI real: total esperado (readonly), total declarado (input), diferença (calculada),
 * observação obrigatória quando diferença ≠ 0. Ref.: docs/plans/FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md
 */

import React, { useState, useMemo } from "react";

export interface CloseCashRegisterModalProps {
  /** Total de vendas do turno (centavos) — usado para calcular esperado */
  dailyTotalCents: number;
  /** Saldo de abertura da caixa (centavos) */
  openingBalanceCents: number;
  restaurantId: string;
  operatorName?: string;
  terminalId?: string;
  /** Chamado ao confirmar: (total declarado em centavos, observação se houver diferença) */
  onClose: (closingBalanceCents: number, observation?: string) => Promise<void>;
  onCancel: () => void;
  onDismiss: () => void;
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2) + " €";
}

export function CloseCashRegisterModal({
  dailyTotalCents,
  openingBalanceCents,
  onClose,
  onCancel,
  onDismiss,
}: CloseCashRegisterModalProps) {
  const [declaredInput, setDeclaredInput] = useState("");
  const [observation, setObservation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const expectedTotalCents = openingBalanceCents + dailyTotalCents;
  const declaredCents = useMemo(() => {
    const parsed = parseFloat(declaredInput.replace(",", "."));
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
  }, [declaredInput]);
  const differenceCents =
    declaredCents !== null ? declaredCents - expectedTotalCents : null;
  const hasDifference = differenceCents !== null && differenceCents !== 0;
  const observationRequired = hasDifference;
  const canSubmit =
    declaredCents !== null &&
    declaredCents >= 0 &&
    (!observationRequired || observation.trim().length > 0) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || declaredCents === null) return;
    setIsSubmitting(true);
    try {
      await onClose(declaredCents, observation.trim() || undefined);
      setSuccess(true);
      setTimeout(() => onDismiss(), 1500);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-cash-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.target === e.currentTarget && onDismiss()}
      >
<div
        data-testid="close-cash-modal"
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 24,
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ fontSize: 16, color: "#1a1a1a", margin: 0 }}>
            Caixa fechado com sucesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-cash-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        data-testid="close-cash-modal"
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 24,
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="close-cash-title"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#1a1a1a",
            margin: 0,
            marginBottom: 16,
          }}
        >
          Fechar caixa
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#555",
              marginBottom: 4,
            }}
          >
            Total esperado (abertura + vendas)
          </label>
          <div
            style={{
              padding: "10px 12px",
              fontSize: 16,
              backgroundColor: "#f5f5f5",
              borderRadius: 8,
              color: "#1a1a1a",
            }}
          >
            {formatCents(expectedTotalCents)}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#555",
              marginBottom: 4,
            }}
            htmlFor="close-cash-declared"
          >
            Total declarado (contagem em caixa)
          </label>
          <input
            id="close-cash-declared"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={declaredInput}
            onChange={(e) => setDeclaredInput(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              fontSize: 16,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </div>

        {differenceCents !== null && (
          <div
            style={{
              marginBottom: 16,
              padding: 10,
              backgroundColor:
                differenceCents === 0 ? "#e8f5e9" : "#fff3e0",
              borderRadius: 8,
              fontSize: 14,
              color: differenceCents === 0 ? "#2e7d32" : "#e65100",
            }}
          >
            <strong>Diferença:</strong>{" "}
            {differenceCents === 0
              ? "0,00 € (conferido)"
              : formatCents(Math.abs(differenceCents)) +
                (differenceCents > 0 ? " a mais" : " a menos")}
          </div>
        )}

        {observationRequired && (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#555",
                marginBottom: 4,
              }}
              htmlFor="close-cash-observation"
            >
              Observação (obrigatória quando há diferença)
            </label>
            <textarea
              id="close-cash-observation"
              rows={3}
              placeholder="Ex.: troco dado a mais, falta de numerário..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid #ccc",
                borderRadius: 8,
                resize: "vertical",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              color: "#444",
              backgroundColor: "#f0f0f0",
              border: "none",
              borderRadius: 8,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              backgroundColor: canSubmit ? "#1976d2" : "#9e9e9e",
              border: "none",
              borderRadius: 8,
              cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
            }}
          >
            {isSubmitting ? "A fechar…" : "Fechar caixa"}
          </button>
        </div>
      </div>
    </div>
  );
}
