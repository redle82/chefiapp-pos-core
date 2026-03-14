/**
 * ModulesPage — Hub Módulos (ativar/abrir/instalar módulos).
 *
 * Mantém a separação entre:
 *  - AppStaff: abre sempre em janela operacional dedicada.
 *  - TPV/KDS: encaminham instalação de dispositivos para /admin/devices.
 *
 * Ref: plano página_mis_productos_módulos.
 */

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { ModuleCard } from "../components/ModuleCard";
import { buildModulesFromRuntime } from "../data/modulesDefinitions";
import { useDeviceInstall } from "../hooks/useDeviceInstall";

/** NAVIGATION_CONTRACT: path canónico da ação primária por módulo; default = /app/activation. Exportado para testes. */
export function getModulePrimaryPath(id: string): string {
  switch (id) {
    case "tpv":
      return "/op/tpv";
    case "kds":
      return "/op/kds";
    case "appstaff":
      return "/app/staff/home";
    case "fichaje":
      return "/app/staff";
    case "stock":
      return "/inventory-stock";
    case "tienda-online":
      return "/admin/config/website";
    case "qr-ordering":
      return "/admin/config/delivery";
    case "reservas":
      return "/admin/reservations";
    case "delivery-integrator":
      return "/admin/config/integrations";
    default:
      return "/app/activation";
  }
}

/* ---------- ModulesPage ---------- */

export function ModulesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("sidebar");
  const { runtime } = useRestaurantRuntime();
  const installed = runtime?.installed_modules ?? [];
  const active = runtime?.active_modules ?? [];
  const modules = buildModulesFromRuntime(installed, active);
  const { hasLocalDevice, localDeviceModule } = useDeviceInstall();

  const hasDeviceForModule = (id: string) =>
    hasLocalDevice && localDeviceModule === id.toLowerCase();

  const handlePrimaryAction = (id: string) => {
    // TPV: CTA de gestão leva sempre para a página dedicada de terminais TPV.
    if (id === "tpv") {
      navigate("/admin/devices/tpv");
      return;
    }

    // AppStaff: CTA passa a gerir dispositivos de equipa via página genérica.
    if (id === "appstaff") {
      navigate("/admin/devices");
      return;
    }

    // KDS (se existir como módulo): encaminhar para Dispositivos com contexto.
    if (id === "kds") {
      navigate("/admin/devices?module=kds");
      return;
    }

    // QR ORDERING: dependência comportamental — primeiro passo é garantir Catálogo.
    if (id === "qr-ordering") {
      navigate("/admin/catalog");
      return;
    }

    navigate(getModulePrimaryPath(id));
  };

  const handleSecondaryAction = (id: string) => {
    if (id === "tpv") {
      navigate("/admin/devices/tpv");
      return;
    }
    if (id === "kds") {
      navigate("/admin/devices?module=kds");
      return;
    }
    // Outros módulos: futuro (desativar, etc.)
  };

  const essenciais = modules.filter((m) => m.block === "essenciais");
  const canais = modules.filter((m) => m.block === "canais");

  // Enriquecimento de módulos para comportamento da UI:
  // - AppStaff: nunca tem ação secundária.
  // - TPV/KDS sem dispositivo local: estado activeNoDevice → sem ação secundária.
  const enrichedModules = (list: typeof modules) =>
    list.map((mod) => {
      if (mod.id === "appstaff") {
        return {
          ...mod,
          secondaryAction: undefined,
        };
      }
      if (
        (mod.id === "tpv" || mod.id === "kds") &&
        mod.status === "active" &&
        !hasDeviceForModule(mod.id)
      ) {
        return {
          ...mod,
          secondaryAction: undefined,
        };
      }
      return mod;
    });

  const getPrimaryLabelOverride = (id: string, status: string) => {
    if ((id === "tpv" || id === "kds") && status === "active") {
      if (!hasDeviceForModule(id)) {
        return t("modules.actionInstallDevice");
      }
    }

    if (id === "qr-ordering") {
      return t("modules.actionGoToCatalog");
    }

    if (id === "delivery-integrator") {
      return t("modules.actionGoToIntegrations");
    }

    return undefined;
  };

  const gridStyle = {
    display: "grid" as const,
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  };
  const blockTitleStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    margin: "0 0 8px 0",
  };

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title={t("modules.pageTitle")}
        subtitle={t("modules.pageSubtitle")}
      />

      <section style={{ marginBottom: 24 }}>
        <h2 style={blockTitleStyle}>{t("modules.blockEssentials")}</h2>
        <div style={gridStyle}>
          {enrichedModules(essenciais).map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onPrimaryAction={handlePrimaryAction}
              onSecondaryAction={handleSecondaryAction}
              primaryLabelOverride={getPrimaryLabelOverride(mod.id, mod.status)}
              secondaryLabel={
                (mod.id === "tpv" || mod.id === "kds") &&
                mod.status === "active" &&
                hasDeviceForModule(mod.id)
                  ? t("modules.actionInstallDevice")
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <section>
        <h2 style={blockTitleStyle}>{t("modules.blockChannels")}</h2>
        <div style={gridStyle}>
          {enrichedModules(canais).map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onPrimaryAction={handlePrimaryAction}
              onSecondaryAction={handleSecondaryAction}
              primaryLabelOverride={getPrimaryLabelOverride(mod.id, mod.status)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
