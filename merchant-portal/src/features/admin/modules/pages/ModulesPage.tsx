/**
 * ModulesPage — Hub Módulos (ativar/abrir/instalar módulos).
 *
 * UXG-003: módulos operacionais desktop exibem estado de dispositivo e labels
 * explícitas de capacidade real ("Abrir no app" vs "Vincular dispositivo").
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { openOperationalInNewWindow } from "../../../../core/operational/openOperationalWindow";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { ModuleCard } from "../components/ModuleCard";
import { buildModulesFromRuntime } from "../data/modulesDefinitions";
import { useDeviceInstall } from "../hooks/useDeviceInstall";

const OPERATIONAL_MODULE_IDS = ["tpv", "kds", "appstaff"] as const;
const INSTALLABLE_DEVICE_MODULE_IDS = ["tpv", "kds"] as const;

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
      return "/admin/config/tienda-online";
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

export function buildDevicesInstallPath(moduleId: "tpv" | "kds"): string {
  return `/admin/devices?module=${moduleId}`;
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  backgroundColor: "#eab308",
  color: "#0a0a0a",
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid var(--surface-border, #404040)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  backgroundColor: "transparent",
  color: "var(--text-secondary, #a3a3a3)",
};

const blockNoticeStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  background: "var(--card-bg-on-dark, #141414)",
  border: "1px solid #eab308",
  borderRadius: 12,
  padding: "16px 24px",
  maxWidth: 480,
  width: "90vw",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  zIndex: 9999,
  fontSize: 14,
  color: "var(--text-primary, #fafafa)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

export function ModulesPage() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();
  const installed = runtime?.installed_modules ?? [];
  const active = runtime?.active_modules ?? [];
  const modules = buildModulesFromRuntime(installed, active);
  const { hasLocalDevice, localDeviceModule, localDeviceName } =
    useDeviceInstall();

  const [blockNotice, setBlockNotice] = useState<string | null>(null);

  const isDeviceLinkedFor = (moduleId: "tpv" | "kds") =>
    hasLocalDevice && localDeviceModule === moduleId;

  const handlePrimaryAction = (id: string) => {
    if (
      INSTALLABLE_DEVICE_MODULE_IDS.includes(
        id as (typeof INSTALLABLE_DEVICE_MODULE_IDS)[number],
      )
    ) {
      const moduleId = id as (typeof INSTALLABLE_DEVICE_MODULE_IDS)[number];
      if (!isDeviceLinkedFor(moduleId)) {
        navigate(buildDevicesInstallPath(moduleId));
        return;
      }
    }

    const path = getModulePrimaryPath(id);
    if (
      typeof window !== "undefined" &&
      OPERATIONAL_MODULE_IDS.includes(
        id as (typeof OPERATIONAL_MODULE_IDS)[number],
      )
    ) {
      const moduleId = id as "tpv" | "kds" | "appstaff";
      const label =
        moduleId === "appstaff" ? "AppStaff" : moduleId.toUpperCase();
      openOperationalInNewWindow(moduleId, {
        navigate,
        onBrowserBlocked: () => {
          setBlockNotice(
            `${label} solo se puede abrir en la aplicación instalada.`,
          );
        },
        onBrowserFallback: () => {
          navigate("/admin/devices");
        },
      });
      return;
    }

    navigate(path);
  };

  const handleSecondaryAction = (id: string) => {
    if (
      INSTALLABLE_DEVICE_MODULE_IDS.includes(
        id as (typeof INSTALLABLE_DEVICE_MODULE_IDS)[number],
      )
    ) {
      navigate(
        buildDevicesInstallPath(
          id as (typeof INSTALLABLE_DEVICE_MODULE_IDS)[number],
        ),
      );
      return;
    }
  };

  const essenciais = modules.filter((m) => m.block === "essenciais");
  const canais = modules.filter((m) => m.block === "canais");

  const enrichedModules = (list: typeof modules) =>
    list.map((mod) => {
      if (
        INSTALLABLE_DEVICE_MODULE_IDS.includes(
          mod.id as (typeof INSTALLABLE_DEVICE_MODULE_IDS)[number],
        )
      ) {
        const moduleId = mod.id as (typeof INSTALLABLE_DEVICE_MODULE_IDS)[number];
        const isLinked = isDeviceLinkedFor(moduleId);
        const fallbackName = moduleId === "tpv" ? "TPV_BALCAO_01" : "KDS_COZINHA_01";
        return {
          ...mod,
          primaryLabelOverride: isLinked ? "Abrir no app" : "Vincular dispositivo",
          deviceStatusLabel: isLinked
            ? `Dispositivo: ${localDeviceName ?? fallbackName} ✓`
            : "Nenhum dispositivo vinculado",
          secondaryAction:
            mod.status === "active" || mod.status === "needs_setup"
              ? "Desactivar"
              : mod.secondaryAction,
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
        title="Módulos"
        subtitle="Activa, configura o instala los módulos que quieras usar."
      />

      <section style={{ marginBottom: 24 }}>
        <h2 style={blockTitleStyle}>Esenciales del día a día</h2>
        <div style={gridStyle}>
          {enrichedModules(essenciais).map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onPrimaryAction={handlePrimaryAction}
              onSecondaryAction={handleSecondaryAction}
              secondaryLabel={
                INSTALLABLE_DEVICE_MODULE_IDS.includes(
                  mod.id as (typeof INSTALLABLE_DEVICE_MODULE_IDS)[number],
                ) &&
                (mod.status === "active" || mod.status === "needs_setup")
                  ? "Instalar dispositivo"
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <section>
        <h2 style={blockTitleStyle}>Canales y crecimiento</h2>
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

      {blockNotice && (
        <div style={blockNoticeStyle}>
          <span style={{ lineHeight: 1.5 }}>🔒 {blockNotice}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={btnPrimaryStyle}
              onClick={() => {
                navigate("/admin/devices");
                setBlockNotice(null);
              }}
            >
              Ir a Dispositivos
            </button>
            <button
              type="button"
              style={btnSecondaryStyle}
              onClick={() => setBlockNotice(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
