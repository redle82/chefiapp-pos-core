/**
 * IntegracionesConfigPage - Configuração de integrações.
 * Reutiliza ConfigIntegrationsPage. Ref: CONFIGURATION_MAP_V1.md 2.10
 */

import { ConfigIntegrationsPage } from "../../../../pages/Config/ConfigIntegrationsPage";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

export function IntegracionesConfigPage() {
  return (
    <div className="page-enter admin-content-page" style={{ maxWidth: 820 }}>
      <AdminPageHeader
        title="Integrações"
        subtitle="Pagamentos, delivery, APIs externas."
      />
      <ConfigIntegrationsPage hideHeader />
    </div>
  );
}
