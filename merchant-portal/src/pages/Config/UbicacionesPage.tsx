/**
 * UbicacionesPage — Configuração > Ubicaciones (portal /config).
 *
 * Lista de localizações operacionais. Criar/editar em páginas dedicadas.
 * Sem billing, sem wizard comercial. Ref: CONFIG_LOCATION_VS_CONTRACT.md, ROTAS_E_CONTRATOS.md.
 */

import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  space,
  tapTarget,
} from "@chefiapp/core-design-system";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { locationsStore } from "../../features/admin/locations/store/locationsStore";
import type { Location } from "../../features/admin/locations/types";
import { UbicacionList } from "./UbicacionList";

export function UbicacionesPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>(() => locationsStore.getLocations());

  useEffect(() => {
    setLocations(locationsStore.getLocations());
  }, []);

  const refresh = useCallback(() => {
    setLocations(locationsStore.getLocations());
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0, fontFamily: fontFamily.sans }}>
      <header
        style={{
          marginBottom: space.lg,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: space.md,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: fontWeight.bold,
              margin: "0 0 4px 0",
              color: colors.textPrimary,
            }}
          >
            Ubicaciones
          </h1>
          <p style={{ margin: 0, fontSize: fontSize.sm, color: colors.textSecondary }}>
            Locais operacionais. Onde a operação acontece (TPV, Staff, KDS). Sem plano nem pagamento.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/config/ubicaciones/nova")}
          style={{
            minHeight: tapTarget.min,
            padding: `0 ${space.lg}`,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: colors.textInverse,
            backgroundColor: colors.accent,
            border: "none",
            borderRadius: radius.md,
            cursor: "pointer",
          }}
        >
          Nova ubicación
        </button>
      </header>

      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          overflow: "hidden",
        }}
      >
        <UbicacionList locations={locations} />
      </div>
    </div>
  );
}
