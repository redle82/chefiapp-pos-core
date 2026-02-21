/**
 * UbicacionEditPage — Página dedicada para editar localização (portal /config/ubicaciones/:id).
 * Ref: CONFIG_LOCATION_VS_CONTRACT.md.
 */
// @ts-nocheck


import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "@chefiapp/core-design-system";
import { useNavigate, useParams } from "react-router-dom";
import { locationsStore } from "../../features/admin/locations/store/locationsStore";
import type { UbicacionFormData } from "./UbicacionForm";
import { UbicacionForm } from "./UbicacionForm";

export function UbicacionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = id
    ? locationsStore.getLocations().find((l) => l.id === id)
    : null;

  const handleSubmit = (data: UbicacionFormData) => {
    if (!id) return;
    locationsStore.updateLocation(id, data);
    navigate("/config/ubicaciones", { replace: true });
  };

  const handleCancel = () => {
    navigate("/config/ubicaciones", { replace: true });
  };

  if (!id || !location) {
    return (
      <div style={{ fontFamily: fontFamily.sans }}>
        <p style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
          Local não encontrado.
        </p>
        <button
          type="button"
          onClick={() => navigate("/config/ubicaciones")}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Voltar à lista
        </button>
      </div>
    );
  }

  const initial: UbicacionFormData = {
    name: location.name,
    address: location.address,
    country: location.country,
    city: location.city,
    postalCode: location.postalCode,
    timezone: location.timezone,
    currency: location.currency,
    isActive: location.isActive,
    isPrimary: location.isPrimary ?? false,
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 560,
        margin: 0,
        fontFamily: fontFamily.sans,
      }}
    >
      <header style={{ marginBottom: space.xl }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: fontWeight.bold,
            margin: "0 0 4px 0",
            color: colors.textPrimary,
          }}
        >
          Editar local
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: fontSize.sm,
            color: colors.textSecondary,
          }}
        >
          {location.name}
        </p>
      </header>
      <UbicacionForm
        initial={initial}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Guardar"
      />
    </div>
  );
}
