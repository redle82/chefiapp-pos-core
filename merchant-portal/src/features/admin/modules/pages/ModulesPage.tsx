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
import { openOperationalInNewWindow } from "../../../../core/operational/openOperationalWindow";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { ModuleCard } from "../components/ModuleCard";
import { buildModulesFromRuntime } from "../data/modulesDefinitions";
import { useDeviceInstall } from "../hooks/useDeviceInstall";

/** Módulos operacionais que podem abrir em janela dedicada. */
const OPERATIONAL_MODULE_IDS = ["tpv", "kds", "appstaff"] as const;

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

  const handlePrimaryAction = (id: string) => {
    // AppStaff: sempre abre em janela operacional dedicada.
    if (id === "appstaff") {
      openOperationalInNewWindow("appstaff");
      return;
    }

    // TPV/KDS: se não houver dispositivo local associado, redireciona para /admin/devices?module=...
    if (id === "tpv" || id === "kds") {
      const hasDeviceForModule =
        hasLocalDevice && localDeviceModule === id.toLowerCase();
      if (!hasDeviceForModule) {
        navigate(`/admin/devices?module=${id}`);
        return;
      }
      openOperationalInNewWindow(id as "tpv" | "kds");
      return;
    }

    navigate(getModulePrimaryPath(id));
  };

  const handleSecondaryAction = (id: string) => {
    if (id === "tpv" || id === "kds") {
      navigate(`/admin/devices?module=${id}`);
      return;
    }
    // Outros módulos: futuro (desativar, etc.)
  };

  const essenciais = modules.filter((m) => m.block === "essenciais");
  const canais = modules.filter((m) => m.block === "canais");

  // Para TPV/KDS activos: mostrar \"Instalar dispositivo\" como acção secundária.
  // AppStaff não tem acção secundária.
  const enrichedModules = (list: typeof modules) =>
    list.map((mod) => {
      if (
        (mod.id === "tpv" || mod.id === "kds") &&
        mod.status === "active"
      ) {
        return {
          ...mod,
          secondaryAction: "Instalar dispositivo",
        };
      }
      if (mod.id === "appstaff") {
        return {
          ...mod,
          secondaryAction: undefined,
        };
      }
      return mod;
    });

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
              secondaryLabel={
                mod.id === "tpv" && mod.status === "active"
                  ? "Instalar dispositivo"
                  : mod.id === "kds" && mod.status === "active"
                  ? "Instalar dispositivo"
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
            />
          ))}
        </div>
      </section>
    </div>
  );
}
