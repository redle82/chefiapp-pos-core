/**
 * UbicacionCreatePage — Página dedicada para criar localização (portal /config/ubicaciones/nova).
 * Sem billing, sem wizard comercial. Ref: CONFIG_LOCATION_VS_CONTRACT.md.
 */

import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "@chefiapp/core-design-system";
import { useNavigate } from "react-router-dom";
import { locationsStore } from "../../features/admin/locations/store/locationsStore";
import type { UbicacionFormData } from "./UbicacionForm";
import { UbicacionForm } from "./UbicacionForm";

export function UbicacionCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = (data: UbicacionFormData) => {
    locationsStore.addLocation(data);
    navigate("/config/ubicaciones", { replace: true });
  };

  const handleCancel = () => {
    navigate("/config/ubicaciones", { replace: true });
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
          Novo local
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: fontSize.sm,
            color: colors.textSecondary,
          }}
        >
          Contexto operacional. Sem plano nem pagamento.
        </p>
      </header>
      <UbicacionForm
        initial={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Criar"
      />
    </div>
  );
}
