/**
 * PlanCard — Card de plano (Basic / Pro / Growth) na página Assinatura.
 * Badge "Plano actual", CTA "Trocar plano", opcional "Falar com suporte".
 */
// @ts-nocheck


import { useState } from "react";
import type { Plan } from "../types";

interface PlanCardProps {
  plan: Plan;
  onChangePlan?: (planId: string) => void;
  onContactSupport?: () => void;
}

export function PlanCard({
  plan,
  onChangePlan,
  onContactSupport,
}: PlanCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleChangeClick = () => {
    if (plan.isCurrent) return;
    setConfirmOpen(true);
  };

  const handleConfirmChange = () => {
    onChangePlan?.(plan.id);
    setConfirmOpen(false);
  };

  return (
    <div
      style={{
        border: "1px solid var(--surface-border)",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "var(--card-bg-on-dark)",
        position: "relative",
        minHeight: 200,
      }}
    >
      {plan.isCurrent && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-inverse)",
            backgroundColor: "var(--color-primary)",
            padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          Plano actual
        </span>
      )}
      {plan.trialEndsAt && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: plan.isCurrent ? 90 : 12,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--status-warning-text)",
            backgroundColor: "var(--status-warning-bg)",
            padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          Trial termina em{" "}
          {new Date(plan.trialEndsAt).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      )}
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {plan.name}
      </h3>
      <ul
        style={{
          margin: "0 0 16px 0",
          paddingLeft: 20,
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        {plan.features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!plan.isCurrent && (
          <button
            type="button"
            onClick={handleChangeClick}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-inverse)",
              backgroundColor: "var(--color-primary)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Cambiar plan
          </button>
        )}
        {plan.isCurrent && onChangePlan && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-primary)",
              backgroundColor: "transparent",
              border: "1px solid var(--color-primary)",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Cambiar plan
          </button>
        )}
        {onContactSupport && (
          <button
            type="button"
            onClick={onContactSupport}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              color: "var(--text-secondary)",
              backgroundColor: "transparent",
              border: "1px solid var(--surface-border)",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Hablar con soporte
          </button>
        )}
      </div>
      {confirmOpen && (
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
          onClick={() => setConfirmOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--card-bg-on-dark)",
              padding: 24,
              borderRadius: 12,
              maxWidth: 360,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid var(--surface-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: "0 0 16px 0", fontSize: 15, color: "var(--text-primary)" }}>
              ¿Cambiar al plan <strong>{plan.name}</strong>? Se aplicará en la
              próxima facturación.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
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
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmChange}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-inverse)",
                  backgroundColor: "var(--color-primary)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
