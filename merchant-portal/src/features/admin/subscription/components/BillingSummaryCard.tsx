/**
 * BillingSummaryCard — Resumo de faturação: próxima cobrança, subtotal/IVA/total.
 * Cancelar assinatura com fluxo seguro (confirmação dupla).
 */

import { useCurrency } from "@/core/currency/useCurrency";
import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import { useState } from "react";
import type { BillingSummary } from "../types";

interface BillingSummaryCardProps {
  summary: BillingSummary;
  onSwitchToYearly?: () => void;
  onCancelSubscription?: () => void;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(getFormatLocale(), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function BillingSummaryCard({
  summary,
  onSwitchToYearly,
  onCancelSubscription,
}: BillingSummaryCardProps) {
  const { formatAmount } = useCurrency();
  /** Format a currency-unit amount (not cents) using the active currency */
  const fmtPrice = (n: number) => formatAmount(Math.round(n * 100));
  const [cancelStep, setCancelStep] = useState<"idle" | "confirm" | "reason">(
    "idle",
  );
  const [reason, setReason] = useState("");

  const handleCancelClick = () => setCancelStep("confirm");
  const handleCancelConfirm = () => setCancelStep("reason");
  const handleCancelSubmit = () => {
    onCancelSubscription?.();
    setCancelStep("idle");
    setReason("");
  };

  return (
    <div
      style={{
        border: "1px solid var(--surface-border)",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "var(--card-bg-on-dark)",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        O teu plano ChefIApp
      </h3>
      <p
        style={{
          margin: "0 0 12px 0",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        {summary.cycle === "monthly" ? "Mensal" : "Anual"} · Faturado
      </p>
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: 14,
          color: "var(--text-primary)",
        }}
      >
        Próxima renovação: <strong>{formatDate(summary.nextChargeAt)}</strong>
      </p>
      {summary.canSwitchToYearly && onSwitchToYearly && (
        <button
          type="button"
          onClick={onSwitchToYearly}
          style={{
            marginBottom: 16,
            fontSize: 13,
            color: "var(--color-primary)",
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Mudar para faturação anual
        </button>
      )}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 4,
          }}
        >
          <span>Subtotal</span>
          <span>{fmtPrice(summary.subtotalEur)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 4,
          }}
        >
          <span>IVA (21%)</span>
          <span>{fmtPrice(summary.taxEur)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid var(--surface-border)",
          }}
        >
          <span>Total</span>
          <span>{fmtPrice(summary.totalEur)}</span>
        </div>
      </div>
      {onCancelSubscription && (
        <button
          type="button"
          onClick={handleCancelClick}
          style={{
            fontSize: 13,
            color: "var(--color-error)",
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Cancelar assinatura
        </button>
      )}

      {cancelStep === "confirm" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setCancelStep("idle")}
        >
          <div
            style={{
              backgroundColor: "var(--card-bg-on-dark)",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid var(--surface-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                margin: "0 0 16px 0",
                fontSize: 15,
                color: "var(--text-primary)",
              }}
            >
              Ao cancelar perdes acesso aos módulos de pagamento. Os dados
              mantêm-se até ao fim do período faturado. Continuar?
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setCancelStep("idle")}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor: "transparent",
                }}
              >
                Não, manter
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-inverse)",
                  backgroundColor: "var(--color-error)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelStep === "reason" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setCancelStep("idle")}
        >
          <div
            style={{
              backgroundColor: "var(--card-bg-on-dark)",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid var(--surface-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                margin: "0 0 8px 0",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Motivo (opcional)
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: mudança de negócio, preço..."
              rows={3}
              style={{
                width: "100%",
                padding: 8,
                fontSize: 13,
                border: "1px solid var(--surface-border)",
                borderRadius: 8,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                onClick={() => setCancelStep("idle")}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor: "transparent",
                }}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-inverse)",
                  backgroundColor: "var(--color-error)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Confirmar cancelação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
