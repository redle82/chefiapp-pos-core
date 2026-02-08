/**
 * ConfigGeneralPage — Configuração > Geral (portal /config).
 *
 * Identidade estável do restaurante, sem billing. Reutiliza os 4 cards do wireframe:
 * Identidade, Idioma & Localização, Texto fiscal/recibo, Integrações.
 * Ref: CONFIG_GENERAL_WIREFRAME.md, CONFIG_LOCATION_VS_CONTRACT.md.
 */

import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "@chefiapp/core-design-system";
import { GeneralCardIdentity } from "../../features/admin/config/components/GeneralCardIdentity";
import { GeneralCardIntegrations } from "../../features/admin/config/components/GeneralCardIntegrations";
import { GeneralCardLocale } from "../../features/admin/config/components/GeneralCardLocale";
import { GeneralCardReceipt } from "../../features/admin/config/components/GeneralCardReceipt";

export function ConfigGeneralPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0, fontFamily: fontFamily.sans }}>
      <header style={{ marginBottom: space.lg }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: fontWeight.bold,
            margin: "0 0 2px 0",
            color: colors.textPrimary,
          }}
        >
          Geral
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: fontSize.sm,
            color: colors.textSecondary,
          }}
        >
          Declarações estáveis do restaurante. Sem métricas nem operação.
        </p>
      </header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: space.lg,
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
