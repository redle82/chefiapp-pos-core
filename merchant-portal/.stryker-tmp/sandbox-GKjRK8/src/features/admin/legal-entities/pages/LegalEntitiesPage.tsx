/**
 * LegalEntitiesPage — Entidades Legais.
 * Definir a entidade legal responsável por faturação e documentos fiscais.
 * Sem métricas, sem planos, sem operação. Guardar por card.
 */

import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { LegalEntityMainCard } from "../components/LegalEntityMainCard";
import { LegalEntityUsageCard } from "../components/LegalEntityUsageCard";
import { LocationEntityTableCard } from "../components/LocationEntityTableCard";
import { LegalFiscalExtrasCard } from "../components/LegalFiscalExtrasCard";

export function LegalEntitiesPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title="Entidades Legales"
        subtitle="Definir quién es la entidad legal responsable del restaurante para efectos fiscales, facturación y conformidad."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <LegalEntityMainCard />
        <LegalEntityUsageCard />
      </div>

      <div style={{ marginTop: 24 }}>
        <LocationEntityTableCard />
      </div>

      <div style={{ marginTop: 24 }}>
        <LegalFiscalExtrasCard />
      </div>
    </div>
  );
}
