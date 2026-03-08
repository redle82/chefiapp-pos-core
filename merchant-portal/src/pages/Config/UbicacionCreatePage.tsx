/**
 * UbicacionCreatePage — Página dedicada para criar localização (portal /admin/config/locations/nova).
 * Sem billing, sem wizard comercial. Ref: CONFIG_LOCATION_VS_CONTRACT.md.
 */

import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "@chefiapp/core-design-system";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useToastContext } from "../../context/ToastContext";
import { locationsStore } from "../../features/admin/locations/store/locationsStore";
import { useAsync } from "../../hooks/useAsync";
import { Breadcrumb } from "../../ui/design-system/Breadcrumb";
import type { UbicacionFormData } from "./UbicacionForm";
import { UbicacionForm } from "./UbicacionForm";

export function UbicacionCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToastContext();

  const { execute: submitCreate, loading: isSubmitting } = useAsync(
    async (data: UbicacionFormData) => {
      locationsStore.addLocation(data);
      toast.success(
        t("locations:created_success", {
          defaultValue: "Local criado com sucesso.",
        }),
      );
      navigate("/admin/config/locations", { replace: true });
    },
  );

  const handleSubmit = (data: UbicacionFormData) => {
    submitCreate(data).catch(() => {
      toast.error(
        t("locations:created_error", {
          defaultValue: "Erro ao criar local. Tenta de novo.",
        }),
      );
    });
  };

  const handleCancel = () => {
    navigate("/admin/config/locations", { replace: true });
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
          { label: "Novo local" },
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
        submitLabel={t("common:create")}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
