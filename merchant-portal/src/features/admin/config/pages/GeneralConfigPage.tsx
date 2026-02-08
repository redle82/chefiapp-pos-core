/**
 * GeneralConfigPage - Configuración > General (Last.app General)
 *
 * Layout em 2 colunas de cards; cada card com Guardar local.
 * Ref: CONFIG_GENERAL_WIREFRAME.md, CONFIGURATION_MAP_V1.md secção 2.1
 */

import { GeneralCardIdentity } from "../components/GeneralCardIdentity";
import { GeneralCardLocale } from "../components/GeneralCardLocale";
import { GeneralCardReceipt } from "../components/GeneralCardReceipt";
import { GeneralCardIntegrations } from "../components/GeneralCardIntegrations";

export function GeneralConfigPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 12 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 2px 0",
            color: "#111827",
          }}
        >
          General
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Declaraciones básicas y estables del restaurante. Sin métricas ni operación.
        </p>
      </header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
        }}
      >
        <GeneralCardIdentity />
        <GeneralCardLocale />
        <GeneralCardReceipt />
        <GeneralCardIntegrations />
      </div>
    </div>
  );
}
