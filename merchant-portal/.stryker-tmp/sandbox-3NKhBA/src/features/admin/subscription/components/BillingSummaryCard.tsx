/**
 * BillingSummaryCard — Resumo de faturação: próxima cobrança, subtotal/IVA/total (€).
 * Cancelar assinatura com fluxo seguro (confirmação dupla).
 */
// @ts-nocheck


import { useState } from "react";
import type { BillingSummary } from "../types";

interface BillingSummaryCardProps {
  summary: BillingSummary;
  onSwitchToYearly?: () => void;
  onCancelSubscription?: () => void;
}

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("es-ES", {
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
  const [cancelStep, setCancelStep] = useState<"idle" | "confirm" | "reason">("idle");
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
        Tu plan ChefIApp
      </h3>
      <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--text-secondary)" }}>
        {summary.cycle === "monthly" ? "Mensual" : "Anual"} · Facturado
      </p>
      <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "var(--text-primary)" }}>
        Próxima renovación: <strong>{formatDate(summary.nextChargeAt)}</strong>
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
          Cambiar a facturación anual
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
          <span>{formatEur(summary.subtotalEur)}</span>
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
          <span>{formatEur(summary.taxEur)}</span>
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
          <span>{formatEur(summary.totalEur)}</span>
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
          Cancelar la suscripción
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
              Al cancelar perderás acceso a los módulos de pago. Los datos se
              conservan hasta el final del período facturado. ¿Continuar?
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
                No, mantener
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
                Sí, cancelar
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
            <p style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              Motivo (opcional)
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej.: cambio de negocio, precio..."
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
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
                Volver
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
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
