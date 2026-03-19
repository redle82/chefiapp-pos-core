/**
 * DeliveryConfigPage - Configuração Delivery (Plano de mesas, Horarios, QR).
 * Índice com links para sub-secções; conteúdo reutiliza ConfigLocationPage (tables),
 * ConfigSchedulePage (horarios), PublicQRSection (qr). Ref: CONFIGURATION_MAP_V1.md 2.11
 */

import { useLocation, useNavigate } from "react-router-dom";
import { LocationSection } from "../../../../pages/Onboarding/sections/LocationSection";
import { PublicQRSection } from "../../../../pages/Config/PublicQRSection";
import { ScheduleSection } from "../../../../pages/Onboarding/sections/ScheduleSection";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

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
      <AdminPageHeader
        title="Delivery"
        subtitle="Plano de mesas, horários e QR."
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
          onClick={() => navigate(`${BASE}/plano-mesas`)}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isPlanoMesas ? "2px solid var(--color-primary)" : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isPlanoMesas ? 600 : 400,
            color: isPlanoMesas ? "var(--color-primary)" : "var(--text-secondary)",
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
            borderBottom: isHorarios ? "2px solid var(--color-primary)" : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isHorarios ? 600 : 400,
            color: isHorarios ? "var(--color-primary)" : "var(--text-secondary)",
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
            borderBottom: isQR ? "2px solid var(--color-primary)" : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isQR ? 600 : 400,
            color: isQR ? "var(--color-primary)" : "var(--text-secondary)",
          }}
        >
          QR
        </button>
      </div>
      {isPlanoMesas && (
        <>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
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
