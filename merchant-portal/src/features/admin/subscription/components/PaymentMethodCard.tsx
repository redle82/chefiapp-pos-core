/**
 * PaymentMethodCard — Método de pagamento atual + botão "Trocar cartão".
 * Mostrar falha de pagamento de forma humana (atualizar até DD/MM).
 */

import type { PaymentMethod } from "../types";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onChangeCard?: () => void;
}

export function PaymentMethodCard({
  method,
  onChangeCard,
}: PaymentMethodCardProps) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "#fff",
      }}
    >
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: 16,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Método de pago
      </h3>
      <p
        style={{
          margin: "0 0 12px 0",
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        Se te debitará de esta tarjeta el pago mensual para ChefIApp.
      </p>
      {method.failureDeadline && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            backgroundColor: "#fef2f2",
            borderRadius: 8,
            fontSize: 13,
            color: "#b91c1c",
          }}
        >
          El último pago falló. Actualiza el método antes del{" "}
          {new Date(method.failureDeadline).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          para evitar la suspensión.
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#374151",
          }}
        >
          {method.brand} **** **** **** {method.last4}
        </span>
        {method.expiryMonth != null && method.expiryYear != null && (
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
          </span>
        )}
      </div>
      {onChangeCard && (
        <button
          type="button"
          onClick={onChangeCard}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#7c3aed",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Cambiar tarjeta
        </button>
      )}
    </div>
  );
}
