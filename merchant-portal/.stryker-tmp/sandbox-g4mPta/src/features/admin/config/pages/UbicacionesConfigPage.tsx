/**
 * UbicacionesConfigPage - Cadastro de unidades (Last.app style).
 * Ruta base = lista de ubicaciones + grupos. Subrutas address/tables = contenido legacy.
 * Ref: Last.app Ubicaciones — todo en el sistema ocurre dentro de una Ubicación.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { LocationsPage } from "../../locations/pages/LocationsPage";
import { LocationSection } from "../../../../pages/Onboarding/sections/LocationSection";
import { PublicPresenceFields } from "../../../../pages/Config/PublicPresenceFields";
import { PublicQRSection } from "../../../../pages/Config/PublicQRSection";

const BASE = "/admin/config/ubicaciones";

export function UbicacionesConfigPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const isList = path === BASE || path === `${BASE}/`;
  const isAddressTab = path === `${BASE}/address`;
  const isTablesTab = path === `${BASE}/tables`;

  if (isList) {
    return <LocationsPage />;
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <AdminPageHeader
        title="Ubicaciones"
        subtitle="Endereço, mesas e zonas do restaurante."
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`${BASE}/address`)}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isAddressTab ? "2px solid var(--color-primary)" : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isAddressTab ? 600 : 400,
            color: isAddressTab ? "var(--color-primary)" : "var(--text-secondary)",
          }}
        >
          Endereço
        </button>
        <button
          type="button"
          onClick={() => navigate(`${BASE}/tables`)}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isTablesTab ? "2px solid var(--color-primary)" : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isTablesTab ? 600 : 400,
            color: isTablesTab ? "var(--color-primary)" : "var(--text-secondary)",
          }}
        >
          Mesas & Zonas
        </button>
        <button
          type="button"
          onClick={() => navigate(BASE)}
          style={{
            padding: "12px 16px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          ← Lista de ubicaciones
        </button>
      </div>
      {isAddressTab && (
        <>
          <LocationSection />
          <PublicPresenceFields />
        </>
      )}
      {isTablesTab && (
        <>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            Gerenciamento de mesas e zonas será implementado aqui. Por enquanto,
            use a rota <code>/operacao</code> para visualizar mesas.
          </p>
          <PublicQRSection />
        </>
      )}
    </div>
  );
}
