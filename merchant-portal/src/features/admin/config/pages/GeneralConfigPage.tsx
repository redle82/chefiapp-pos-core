/**
 * GeneralConfigPage - Configuración > General (Last.app General)
 *
 * Layout em 2 colunas de cards; cada card com Guardar local.
 * Ref: CONFIG_GENERAL_WIREFRAME.md, CONFIGURATION_MAP_V1.md secção 2.1
 */

import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { GeneralCardIdentity } from "../components/GeneralCardIdentity";
import { GeneralCardLocale } from "../components/GeneralCardLocale";
import { GeneralCardReceipt } from "../components/GeneralCardReceipt";
import { GeneralCardIntegrations } from "../components/GeneralCardIntegrations";
import { EmailSettingsCard } from "../components/EmailSettingsCard";

export function GeneralConfigPage() {
  return (
    <div className="page-enter admin-content-page" style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title="General"
        subtitle="Declaraciones básicas y estables del restaurante. Sin métricas ni operación."
      />
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
        <EmailSettingsCard />
      </div>
    </div>
  );
}
