/**
 * ConfigPaymentsPage - Configuração de Pagamentos
 *
 * Gerencia métodos de pagamento.
 */

import { PaymentsSection } from "../Onboarding/sections/PaymentsSection";

export function ConfigPaymentsPage() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Pagamentos
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Configure quais métodos de pagamento o restaurante aceita no TPV
          (dinheiro, cartão, MB Way, etc.).
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#059669",
            margin: 0,
            fontWeight: 500,
          }}
        >
          Esta secção está em desenvolvimento. Em breve poderá ativar ou
          desativar cada método e associar terminais. Por agora o TPV aceita os
          métodos definidos na operação.
        </p>
      </div>

      <PaymentsSection />
    </div>
  );
}
