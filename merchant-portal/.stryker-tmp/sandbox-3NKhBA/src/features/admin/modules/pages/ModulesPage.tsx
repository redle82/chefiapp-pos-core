/**
 * ModulesPage — Hub Módulos (ativar/abrir/instalar módulos).
 *
 * Integra a funcionalidade de instalação de dispositivos (antes em /admin/devices)
 * diretamente nos cards de TPV e KDS. Ao clicar "Abrir" num módulo operacional,
 * abre em janela popup (sem barra de URL = experiência app-like).
 *
 * Ref: plano página_mis_productos_módulos.
 */
// @ts-nocheck


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { openOperationalInNewWindow } from "../../../../core/operational/openOperationalWindow";
import type { InstalledDeviceModule } from "../../../../core/storage/installedDeviceStorage";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { ModuleCard } from "../components/ModuleCard";
import { buildModulesFromRuntime } from "../data/modulesDefinitions";
import { useDeviceInstall } from "../hooks/useDeviceInstall";

/** Módulos operacionais que abrem em janela dedicada (não na mesma aba da config). */
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

/* ---------- Install Dialog (inline para TPV/KDS) ---------- */

function DeviceInstallDialog({
  moduleId,
  onClose,
}: {
  moduleId: InstalledDeviceModule;
  onClose: () => void;
}) {
  const { installDevice, installing, error, canInstallPwa, triggerPwaInstall } =
    useDeviceInstall();
  const [deviceName, setDeviceName] = useState("");

  const defaultName = moduleId === "tpv" ? "TPV_BALCAO_01" : "KDS_COZINHA_01";
  const kindLabel = moduleId === "tpv" ? "TPV (Caixa)" : "KDS (Cozinha)";

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>
          Instalar {kindLabel}
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "var(--text-secondary, #a3a3a3)",
            lineHeight: 1.5,
          }}
        >
          Regista este dispositivo como {kindLabel} deste restaurante. Depois da
          instalação, o dispositivo não volta a pedir qual é o restaurante.
        </p>

        {error && (
          <p style={{ fontSize: 13, color: "#ff6b6b", margin: "0 0 12px" }}>
            {error}
          </p>
        )}

        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontSize: 12,
            color: "var(--text-secondary, #a3a3a3)",
          }}
        >
          Nome do dispositivo
        </label>
        <input
          type="text"
          style={inputStyle}
          placeholder={defaultName}
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          disabled={!!installing}
        />

        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}
        >
          <button
            type="button"
            style={btnPrimaryStyle}
            onClick={async () => {
              const ok = await installDevice(moduleId, deviceName);
              if (ok) onClose();
            }}
            disabled={!!installing}
          >
            {installing
              ? "A instalar…"
              : `Instalar como ${moduleId.toUpperCase()}`}
          </button>
          <button
            type="button"
            style={btnSecondaryStyle}
            onClick={onClose}
            disabled={!!installing}
          >
            Cancelar
          </button>
        </div>

        {canInstallPwa && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid var(--surface-border, #333)",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "var(--text-secondary, #a3a3a3)",
                margin: "0 0 8px",
              }}
            >
              Para ter um ícone no desktop (sem barra do navegador):
            </p>
            <button
              type="button"
              style={btnPrimaryStyle}
              onClick={triggerPwaInstall}
            >
              Instalar no ambiente de trabalho
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg-on-dark, #141414)",
  borderRadius: 12,
  border: "1px solid var(--surface-border, #333)",
  padding: 24,
  maxWidth: 420,
  width: "90vw",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--surface-border, #404040)",
  borderRadius: 8,
  background: "var(--surface-elevated, #171717)",
  color: "var(--text-primary, #fafafa)",
  width: "100%",
  maxWidth: 300,
  marginBottom: 16,
};

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

/* ---------- ModulesPage ---------- */

export function ModulesPage() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();
  const installed = runtime?.installed_modules ?? [];
  const active = runtime?.active_modules ?? [];
  const modules = buildModulesFromRuntime(installed, active);
  const { hasLocalDevice, localDeviceModule } = useDeviceInstall();

  const [installTarget, setInstallTarget] =
    useState<InstalledDeviceModule | null>(null);

  const handlePrimaryAction = (id: string) => {
    const path = getModulePrimaryPath(id);
    if (
      typeof window !== "undefined" &&
      OPERATIONAL_MODULE_IDS.includes(
        id as (typeof OPERATIONAL_MODULE_IDS)[number],
      )
    ) {
      openOperationalInNewWindow(id as "tpv" | "kds" | "appstaff");
      return;
    }
    navigate(path);
  };

  const handleSecondaryAction = (id: string) => {
    // Para TPV/KDS: ação secundária = instalar dispositivo
    if (
      OPERATIONAL_MODULE_IDS.includes(
        id as (typeof OPERATIONAL_MODULE_IDS)[number],
      )
    ) {
      setInstallTarget(id as InstalledDeviceModule);
      return;
    }
    // Outros módulos: desactivar (futuro)
  };

  const essenciais = modules.filter((m) => m.block === "essenciais");
  const canais = modules.filter((m) => m.block === "canais");

  // Para TPV/KDS activos: mostrar "Instalar dispositivo" como acção secundária
  const enrichedModules = (list: typeof modules) =>
    list.map((mod) => {
      if (
        OPERATIONAL_MODULE_IDS.includes(
          mod.id as (typeof OPERATIONAL_MODULE_IDS)[number],
        ) &&
        mod.status === "active"
      ) {
        return {
          ...mod,
          secondaryAction: "Desactivar" as const,
          // Extra info mostrada no card (via description enrichment)
          _hasDevice: hasLocalDevice && localDeviceModule === mod.id,
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
                OPERATIONAL_MODULE_IDS.includes(
                  mod.id as (typeof OPERATIONAL_MODULE_IDS)[number],
                ) && mod.status === "active"
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

      {/* Dialog de instalação de dispositivo */}
      {installTarget && (
        <DeviceInstallDialog
          moduleId={installTarget}
          onClose={() => setInstallTarget(null)}
        />
      )}
    </div>
  );
}
