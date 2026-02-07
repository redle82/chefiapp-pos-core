/**
 * ConfigLocationPage - Configuração de Localização
 *
 * Gerencia endereço, mesas e zonas do restaurante.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { LocationSection } from "../Onboarding/sections/LocationSection";
import { PublicPresenceFields } from "./PublicPresenceFields";
import { PublicQRSection } from "./PublicQRSection";
import { RestaurantSetupLayout } from "./RestaurantSetupLayout";

export function ConfigLocationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAddressTab = location.pathname.includes("/address");
  const isTablesTab = location.pathname.includes("/tables");

  return (
    <RestaurantSetupLayout
      title="Localização do restaurante"
      description="Gerencie endereço, mesas e zonas do restaurante."
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <button
          onClick={() => navigate("/config/location/address")}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isAddressTab
              ? "2px solid #667eea"
              : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isAddressTab ? 600 : 400,
            color: isAddressTab ? "#667eea" : "#666",
          }}
        >
          Endereço
        </button>
        <button
          onClick={() => navigate("/config/location/tables")}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isTablesTab
              ? "2px solid #667eea"
              : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isTablesTab ? 600 : 400,
            color: isTablesTab ? "#667eea" : "#666",
          }}
        >
          Mesas & Zonas
        </button>
      </div>

      {/* Conteúdo */}
      {isAddressTab && (
        <>
          <LocationSection />
          <PublicPresenceFields />
        </>
      )}
      {isTablesTab && (
        <>
          <p style={{ color: "#666", marginBottom: 24 }}>
            Gerenciamento de mesas e zonas será implementado aqui. Por enquanto,
            use a rota <code>/operacao</code> para visualizar mesas.
          </p>
          <PublicQRSection />
        </>
      )}
    </RestaurantSetupLayout>
  );
}
