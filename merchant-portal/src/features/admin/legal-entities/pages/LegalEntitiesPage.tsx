/**
 * LegalEntitiesPage — Entidades Legais.
 * Definir a entidade legal responsável por faturação e documentos fiscais.
 * Sem métricas, sem planos, sem operação. Guardar por card.
 */

import { LegalEntityMainCard } from "../components/LegalEntityMainCard";
import { LegalEntityUsageCard } from "../components/LegalEntityUsageCard";
import { LocationEntityTableCard } from "../components/LocationEntityTableCard";
import { LegalFiscalExtrasCard } from "../components/LegalFiscalExtrasCard";

export function LegalEntitiesPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px 0",
            color: "#111827",
          }}
        >
          Entidades Legales
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          Definir quién es la entidad legal responsable del restaurante para
          efectos fiscales, facturación y conformidad.
        </p>
      </header>

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
