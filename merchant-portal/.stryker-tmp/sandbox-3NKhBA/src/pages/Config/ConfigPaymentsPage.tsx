/**
 * ConfigPaymentsPage - Configuração de Pagamentos
 *
 * Gerencia métodos de pagamento (FASE 1 Passo 3: dinheiro, cartão).
 */
// @ts-nocheck


import { useState, useEffect } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  getPaymentMethodsEnabled,
  setPaymentMethodsEnabled,
  type PaymentMethodsEnabled,
} from "../../core/storage/paymentMethodsConfigStorage";
import { PaymentsSection } from "../Onboarding/sections/PaymentsSection";

export function ConfigPaymentsPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId =
    runtime?.restaurant_id ??
    (typeof window !== "undefined"
      ? localStorage.getItem("chefiapp_restaurant_id")
      : null);
  const [methods, setMethods] = useState<PaymentMethodsEnabled>(() =>
    getPaymentMethodsEnabled(restaurantId),
  );

  useEffect(() => {
    setMethods(getPaymentMethodsEnabled(restaurantId));
  }, [restaurantId]);

  const handleToggle = (key: keyof PaymentMethodsEnabled, value: boolean) => {
    const next = { ...methods, [key]: value };
    setMethods(next);
    setPaymentMethodsEnabled(restaurantId, next);
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            margin: 0,
            marginBottom: "8px",
            color: "var(--text-primary)",
          }}
        >
          Pagamentos
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Configure quais métodos de pagamento o restaurante aceita no TPV
          (dinheiro, cartão, MB Way, etc.).
        </p>
      </div>

      {/* FASE 1 Passo 3: métodos mínimos dinheiro / cartão */}
      <div
        style={{
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid var(--surface-border)",
          borderRadius: "8px",
          backgroundColor: "var(--card-bg-on-dark)",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 12px 0", color: "var(--text-primary)" }}>
          Métodos de pagamento
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 12px 0" }}>
          Ative os métodos que o TPV aceita.
        </p>
        <label
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--text-primary)" }}
        >
          <input
            type="checkbox"
            checked={methods.cash}
            onChange={(e) => handleToggle("cash", e.target.checked)}
          />
          <span>Dinheiro</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
          <input
            type="checkbox"
            checked={methods.card}
            onChange={(e) => handleToggle("card", e.target.checked)}
          />
          <span>Cartão</span>
        </label>
      </div>

      {/* FASE 1 Passo 3: impressão/ecrã documentado como futuro */}
      <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: 24 }}>
        Impressão e ecrã cozinha: configurável em versões futuras. A cozinha
        recebe pedidos do TPV quando o KDS está ativo.
      </p>

      <PaymentsSection />
    </div>
  );
}
