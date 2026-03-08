/**
 * UbicacionEditPage — Página dedicada para editar localização (portal /admin/config/locations/:id).
 * Ref: CONFIG_LOCATION_VS_CONTRACT.md.
 */

import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "@chefiapp/core-design-system";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useToastContext } from "../../context/ToastContext";
import { locationsStore } from "../../features/admin/locations/store/locationsStore";
import { useAsync } from "../../hooks/useAsync";
import { Breadcrumb } from "../../ui/design-system/Breadcrumb";
import type { UbicacionFormData } from "./UbicacionForm";
import { UbicacionForm } from "./UbicacionForm";

export function UbicacionEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastContext();
  const location = id
    ? locationsStore.getLocations().find((l) => l.id === id)
    : null;
  const { execute: submitUpdate, loading: isSubmitting } = useAsync(
    async (data: UbicacionFormData) => {
      if (!id) return;
      locationsStore.updateLocation(id, data);
      toast.success(
        t("locations:updated_success", {
          defaultValue: "Alterações guardadas.",
        }),
      );
      navigate("/admin/config/locations", { replace: true });
    },
  );

  const handleSubmit = (data: UbicacionFormData) => {
    submitUpdate(data).catch(() => {
      toast.error(
        t("locations:updated_error", {
          defaultValue: "Erro ao guardar. Tenta de novo.",
        }),
      );
    });
  };

  const handleCancel = () => {
    navigate("/admin/config/locations", { replace: true });
  };

  if (!id || !location) {
    return (
      <div style={{ fontFamily: fontFamily.sans }}>
        <p style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
          Local não encontrado.
        </p>
        <button
          type="button"
          aria-label="Voltar à lista de locais"
          onClick={() => navigate("/admin/config/locations")}
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
      <Breadcrumb
        items={[
          { label: "Configuração", to: "/admin/config/general" },
          { label: "Localizações", to: "/admin/config/locations" },
          { label: "Editar local" },
        ]}
      />
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
        submitLabel={t("common:save")}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
