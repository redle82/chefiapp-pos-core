/**
 * UbicacionCard — Card de uma localização na lista.
 * Ref: CONFIG_LOCATION_VS_CONTRACT.md — Location = contexto operacional (ChefIApp).
 */

import {
  colors,
  fontSize,
  fontWeight,
  radius,
  space,
  tapTarget,
} from "@chefiapp/core-design-system";
import { useNavigate } from "react-router-dom";
import type { Location } from "../../features/admin/locations/types";

interface UbicacionCardProps {
  location: Location;
}

export function UbicacionCard({ location }: UbicacionCardProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: space.lg,
        borderRadius: radius.md,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space.md,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: space.sm,
            marginBottom: space.xs,
          }}
        >
          <span
            style={{
              fontSize: fontSize.base,
              fontWeight: fontWeight.semibold,
              color: colors.textPrimary,
            }}
          >
            {location.name}
          </span>
          {location.isPrimary && (
            <span
              style={{
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
                color: colors.accent,
                backgroundColor: colors.surface,
                padding: "2px 8px",
                borderRadius: radius.sm,
                border: `1px solid ${colors.border}`,
              }}
            >
              Principal
            </span>
          )}
          {!location.isActive && (
            <span
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
              }}
            >
              Inativo
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {location.address || location.city || "—"}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Editar local ${location.name}`}
        onClick={() => navigate(`/admin/config/locations/${location.id}`)}
        style={{
          minHeight: tapTarget.min,
          padding: `0 ${space.md}`,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
          color: colors.accent,
          backgroundColor: "transparent",
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          cursor: "pointer",
        }}
      >
        Editar
      </button>
    </div>
  );
}
