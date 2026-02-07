/**
 * DeliveryConfigPage - Configuração Delivery (Plano de mesas, Horarios, QR).
 * Índice com links para sub-secções; conteúdo reutiliza ConfigLocationPage (tables),
 * ConfigSchedulePage (horarios), PublicQRSection (qr). Ref: CONFIGURATION_MAP_V1.md 2.11
 */

import { useLocation, useNavigate } from "react-router-dom";
import { LocationSection } from "../../../../pages/Onboarding/sections/LocationSection";
import { PublicQRSection } from "../../../../pages/Config/PublicQRSection";
import { ScheduleSection } from "../../../../pages/Onboarding/sections/ScheduleSection";

const BASE = "/admin/config/delivery";

export function DeliveryConfigPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const isPlanoMesas = path === `${BASE}/plano-mesas` || path === BASE;
  const isHorarios = path === `${BASE}/horarios`;
  const isQR = path === `${BASE}/qr`;

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
          Delivery
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Plano de mesas, horários e QR.
        </p>
      </header>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`${BASE}/plano-mesas`)}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isPlanoMesas ? "2px solid #667eea" : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isPlanoMesas ? 600 : 400,
            color: isPlanoMesas ? "#667eea" : "#666",
          }}
        >
          Plano de mesas
        </button>
        <button
          type="button"
          onClick={() => navigate(`${BASE}/horarios`)}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isHorarios ? "2px solid #667eea" : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isHorarios ? 600 : 400,
            color: isHorarios ? "#667eea" : "#666",
          }}
        >
          Horarios
        </button>
        <button
          type="button"
          onClick={() => navigate(`${BASE}/qr`)}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isQR ? "2px solid #667eea" : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isQR ? 600 : 400,
            color: isQR ? "#667eea" : "#666",
          }}
        >
          QR
        </button>
      </div>
      {isPlanoMesas && (
        <>
          <p style={{ color: "#666", marginBottom: 24 }}>
            Mesas e zonas. Endereço e presença abaixo.
          </p>
          <LocationSection />
        </>
      )}
      {isHorarios && <ScheduleSection />}
      {isQR && <PublicQRSection />}
    </div>
  );
}
