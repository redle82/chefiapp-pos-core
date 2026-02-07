/**
 * IntegracionesConfigPage - Configuração de integrações.
 * Reutiliza ConfigIntegrationsPage. Ref: CONFIGURATION_MAP_V1.md 2.10
 */

import { ConfigIntegrationsPage } from "../../../../pages/Config/ConfigIntegrationsPage";

export function IntegracionesConfigPage() {
  return (
    <div style={{ maxWidth: 820 }}>
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px 0",
            color: "#111827",
          }}
        >
          Integraciones
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Pagamentos, delivery, APIs externas.
        </p>
      </header>
      <ConfigIntegrationsPage />
    </div>
  );
}
