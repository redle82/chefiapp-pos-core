/**
 * OwnerDashboardWithMapLayout — Dashboard central com sidebar "Mapa do sistema".
 *
 * @deprecated Não usar em Reports. Dashboard operacional (estado vivo). A overview
 * de reports usa AdminReportsOverview. O dashboard do dono vive em AppStaff
 * (OwnerDashboard variant="app"). Ref: reports_only_no_dashboard plan.
 *
 * Conteúdo migrado de DashboardPortal: OperacaoCard + árvore (OPERAÇÃO, CONFIGURAÇÃO,
 * EQUIPA, GESTÃO, SISTEMA) + OwnerDashboard.
 * Ref: TWO_DASHBOARDS_REFERENCE.md, COGNITIVE_MODES_OWNER_DASHBOARD.md
 */

import { fontSize, fontWeight, space } from "@chefiapp/core-design-system";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoreStatusBadge } from "../../../../components/CoreStatusBadge/CoreStatusBadge";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  deriveSystemTreeState,
  type NodeId,
} from "../../../../core/dashboard/systemTreeState";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { useMenuState } from "../../../../core/menu/MenuState";
import { BlockingScreen, usePreflightOperational } from "../../../../core/readiness";
import { getDashboardCopy } from "../../../../core/roles";
import { useRoleOptional } from "../../../../core/roles/RoleContext";
import { useDashboardViewModel } from "../../../../core/dashboard/DashboardViewModel";
import { CONFIG } from "../../../../config";
import { GlobalLoadingView } from "../../../../ui/design-system/components";
import { OwnerDashboard } from "../../../../pages/AppStaff/OwnerDashboard";

function OperacaoCard({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const preflight = usePreflightOperational({ healthAutoStart: true });
  const hasCoreOffline = preflight.blockers.some(
    (b) => b.code === "CORE_OFFLINE"
  );
  const hasNoPublishedMenu = preflight.blockers.some(
    (b) => b.code === "NO_PUBLISHED_MENU"
  );
  const hasNoIdentity = preflight.blockers.some(
    (b) => b.code === "NO_IDENTITY"
  );
  const abrirTpvEnabled = !hasCoreOffline && preflight.hasPublishedMenu;
  const showRunbookLink = hasCoreOffline;

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: preflight.operationReady ? "#ecfdf5" : "#fef2f2",
        border: `1px solid ${preflight.operationReady ? "#a7f3d0" : "#fecaca"}`,
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#444",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "6px",
        }}
      >
        Operação
      </div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: preflight.operationReady ? "#059669" : "#b91c1c",
          marginBottom: preflight.blockers.length > 0 ? "8px" : 0,
        }}
      >
        {preflight.operationReady ? "Pronto" : "Bloqueado"}
      </div>
      {preflight.blockers.length > 0 && (
        <ul
          style={{
            margin: "0 0 10px 0",
            paddingLeft: "18px",
            fontSize: "12px",
            color: "#555",
            lineHeight: 1.5,
          }}
        >
          {preflight.blockers.map((b) => (
            <li key={b.code}>{b.message}</li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <button
          type="button"
          disabled={!abrirTpvEnabled}
          onClick={() => {
            if (!abrirTpvEnabled) return;
            // Em Reports, abrimos apenas a visão de operações (leitura), não o TPV.
            onNavigate("/admin/reports/operations");
          }}
          style={{
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 600,
            color: abrirTpvEnabled ? "#fff" : "#9ca3af",
            backgroundColor: abrirTpvEnabled ? "#059669" : "#e5e7eb",
            border: "none",
            borderRadius: 6,
            cursor: abrirTpvEnabled ? "pointer" : "not-allowed",
          }}
        >
          Ver detalhe da operação
        </button>
        {hasNoPublishedMenu && (
          <button
            type="button"
            onClick={() => onNavigate("/menu-builder")}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: 500,
              color: "#b45309",
              backgroundColor: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Menu Builder
          </button>
        )}
        {hasNoIdentity && (
          <button
            type="button"
            onClick={() => onNavigate("/config/identity")}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: 500,
              color: "#1e40af",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Configurar identidade
          </button>
        )}
        {showRunbookLink && (
          <button
            type="button"
            onClick={() => onNavigate("/app/runbook-core")}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: 500,
              color: "#0d9488",
              backgroundColor: "#ccfbf1",
              border: "1px solid #99f6e4",
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Ver instruções (Core offline)
          </button>
        )}
      </div>
    </div>
  );
}

const MAPA_SECTIONS = [
  {
    id: "operacao",
    label: "Operação",
    items: [
      { id: "operacao-tpv", label: "TPV", icon: "🖥️", route: "/op/tpv", moduleId: "tpv" as const },
      { id: "operacao-turnos", label: "Turnos & Caixa", icon: "🧾", route: "/op/tpv", moduleId: "tpv" as const },
    ],
  },
  {
    id: "configuracao",
    label: "Configuração",
    items: [
      { id: "config-identidade", label: "Identidade", icon: "🏪", route: "/config/identity", moduleId: "config" as const },
      { id: "config-local", label: "Local & Moeda", icon: "📍", route: "/config/location", moduleId: "config" as const },
      { id: "config-cardapio", label: "Cardápio", icon: "🍽️", route: "/menu-builder", moduleId: "menu" as const },
      { id: "config-publicacao", label: "Publicação", icon: "🚀", route: "/app/publish", moduleId: "publish" as const },
    ],
  },
  {
    id: "equipa",
    label: "Equipa",
    items: [
      { id: "equipa-pessoas", label: "Pessoas", icon: "👥", route: "/people", moduleId: "people" as const },
      { id: "equipa-appstaff", label: "AppStaff", icon: "🧑‍🍳", route: "/garcom", moduleId: "appstaff" as const },
      { id: "equipa-presenca-online", label: "Presença Online", icon: "🌐", route: "/public/demo-restaurant", moduleId: "restaurant-web" as const },
    ],
  },
  {
    id: "gestao",
    label: "Gestão",
    items: [
      { id: "gestao-financeiro", label: "Financeiro", icon: "💰", route: "/financial", moduleId: "financial" as const },
      { id: "gestao-faturacao", label: "Faturação", icon: "💳", route: "/app/billing", moduleId: "billing" as const },
      { id: "gestao-percepcao", label: "Percepção Operacional", icon: "📷", route: "/config/perception", moduleId: "perception" as const },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [
      { id: "sistema-saude", label: "Saúde", icon: "💚", route: "/health", moduleId: "health" as const },
      { id: "sistema-alertas", label: "Alertas", icon: "🚨", route: "/alerts", moduleId: "alerts" as const },
      { id: "sistema-estado", label: "Estado do Sistema", icon: "🧠", route: "/health", moduleId: "health" as const },
    ],
  },
] as const;

export function OwnerDashboardWithMapLayout() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { runtime } = useRestaurantRuntime();
  const roleContext = useRoleOptional();
  const role = roleContext?.role ?? null;
  const menuState = useMenuState();
  const preflight = usePreflightOperational({ healthAutoStart: true });
  const { identity } = useRestaurantIdentity();
  const dashboardVm = useDashboardViewModel();
  const { readiness, operation, turn, alerts } = dashboardVm;
  const systemTreeState = deriveSystemTreeState({
    readiness,
    preflight,
    runtime,
    menuState,
  });
  const isOperationalOS = CONFIG.UI_MODE === "OPERATIONAL_OS";
  const dashboardCopy = getDashboardCopy(role);
  const sidebarTitleOperational =
    isOperationalOS && runtime.restaurant_id
      ? (identity?.name?.trim() || "Restaurante")
      : isOperationalOS && !runtime.restaurant_id
        ? "Seleccionar restaurante"
        : null;

  const getFirstMissingConfigPath = (): string => {
    const candidates: { nodeId: NodeId; path: string }[] = [
      { nodeId: "identity", path: "/config/identity" },
      { nodeId: "location_currency", path: "/config/location" },
      { nodeId: "menu", path: "/menu-builder" },
    ];
    for (const desired of ["missing", "incomplete"] as const) {
      const match = candidates.find(({ nodeId }) => {
        const node = systemTreeState[nodeId];
        return node && node.state === desired;
      });
      if (match) return match.path;
    }
    return "/config/identity";
  };

  const blockedByCaixa =
    !readiness.ready &&
    (readiness.blockingReason === "NO_OPEN_CASH_REGISTER" ||
      readiness.blockingReason === "SHIFT_NOT_STARTED");
  const systemState = runtime.systemState ?? "SETUP";
  const showSetupBanner = systemState === "SETUP";

  if (readiness.loading) {
    return (
      <GlobalLoadingView
        message="Verificando estado operacional..."
        layout="portal"
        variant="fullscreen"
        longDelay={5000}
        longMessage="A demorar mais do que o habitual. A verificar ligação..."
      />
    );
  }
  if (!readiness.ready && readiness.uiDirective === "SHOW_BLOCKING_SCREEN") {
    return (
      <BlockingScreen
        reason={readiness.blockingReason}
        redirectTo={readiness.redirectTo}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showSetupBanner && (
        <div
          style={{
            padding: "10px 16px",
            background: "linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)",
            borderBottom: "1px solid #f59e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14, color: "#92400e", fontWeight: 500 }}>
            ⚙️ Complete o setup: primeiro produto e cardápio.
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/config/identity")}
              style={{
                padding: "6px 14px",
                backgroundColor: "#1a1a1a",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Preparar identidade
            </button>
            <button
              onClick={() => navigate("/menu-builder")}
              style={{
                padding: "6px 14px",
                backgroundColor: "#f59e0b",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Abrir Cardápio
            </button>
          </div>
        </div>
      )}
      {blockedByCaixa && (
        <div
          style={{
            padding: "16px 20px",
            marginBottom: 0,
            backgroundColor: "#fef2f2",
            borderBottom: "1px solid #ef4444",
            color: "#b91c1c",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 500, fontSize: 14 }}>
            O turno ainda não está aberto. Use o TPV no terminal operacional
            para abrir o turno e poder vender.
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/reports/operations")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#b91c1c",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Ver detalhe
          </button>
        </div>
      )}
      <div style={{ display: "flex", flex: 1 }}>
        <aside
          style={{
            width: "260px",
            backgroundColor: "#ffffff",
            borderRight: "1px solid #e5e7eb",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}
            >
              {isOperationalOS && sidebarTitleOperational != null
                ? sidebarTitleOperational
                : dashboardCopy.sidebarTitle}
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>
              {isOperationalOS
                ? (preflight.operationReady ? "Estado: Pronta" : "Estado: Operação bloqueada")
                : dashboardCopy.sidebarSubtitle}
            </div>
          </div>

          {runtime.installed_modules?.length != null && runtime.installed_modules.length > 0 && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#f5f7ff",
                border: "1px solid #e0e4ff",
                marginBottom: "8px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#444" }}>
                Sistema pronto ✅
              </div>
              <div style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>
                {runtime.installed_modules.length} instalado(s)
              </div>
            </div>
          )}

          <OperacaoCard
            onNavigate={navigate}
            onBlockedOpenTpv={() => {
              navigate(getFirstMissingConfigPath());
            }}
          />

          {!isOperationalOS && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "12px",
                padding: "10px",
                borderRadius: 8,
                backgroundColor: "#f0f4f8",
                border: "1px solid #e0e4e8",
              }}
            >
              <CoreStatusBadge />
            </div>
          )}

          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: space[2],
              flex: 1,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: space[1],
              }}
            >
              Mapa do sistema
            </div>
            {MAPA_SECTIONS.map((section) => (
              <div key={section.id}>
                <div
                  style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: "#888",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 4,
                    paddingLeft: space[1],
                  }}
                >
                  {section.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {section.items.map((item) => {
                    type Status = "red" | "yellow" | "green";
                    const reasons = new Set(operation.blockingReasons);
                    let status: Status = "yellow";
                    switch (item.id) {
                      case "config-identidade":
                        status = reasons.has("Identidade") ? "red" : "green";
                        break;
                      case "config-local":
                        status = reasons.has("Local & Moeda") ? "red" : "green";
                        break;
                      case "config-cardapio":
                        status = reasons.has("Cardápio") ? "red" : "green";
                        break;
                      case "config-publicacao":
                        status = reasons.has("Publicação") ? "red" : "green";
                        break;
                      case "operacao-tpv":
                        status = operation.configStatus === "INCOMPLETE" ? "red" : "green";
                        break;
                      case "operacao-turnos":
                        if (operation.configStatus === "INCOMPLETE") status = "red";
                        else if (turn.operationStatus === "TURN_OPEN") status = "green";
                        else status = "yellow";
                        break;
                      case "sistema-alertas":
                        if (alerts.criticalCount > 0) status = "red";
                        else if (alerts.activeCount > 0) status = "yellow";
                        else status = "green";
                        break;
                      default:
                        status = "yellow";
                    }
                    const badge =
                      status === "red" ? (
                        <span
                          style={{
                            fontSize: fontSize.xs,
                            fontWeight: fontWeight.semibold,
                            color: "#b91c1c",
                            backgroundColor: "#fee2e2",
                            borderRadius: 999,
                            padding: "2px 8px",
                          }}
                        >
                          🔴 Requer atenção
                        </span>
                      ) : status === "green" ? (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "999px",
                            backgroundColor: "#22c55e",
                            display: "inline-block",
                          }}
                          aria-label="Pronto"
                        />
                      ) : null;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.moduleId) setActiveModule(item.moduleId);
                          navigate(item.route);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: `${space[1]}px ${space[2]}px`,
                          fontSize: fontSize.sm,
                          color: "#111827",
                          backgroundColor:
                            activeModule === item.moduleId ? "#e8ecf4" : "transparent",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: space[1],
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: space[1] }}>
                          <span style={{ fontSize: 18 }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        {badge}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {role === "owner" && (
            <div
              style={{
                padding: space[4],
                margin: space[4],
                marginBottom: 0,
                borderRadius: 8,
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: `${fontSize.sm}px`,
                  fontWeight: fontWeight.semibold,
                  color: "#374151",
                  marginBottom: space[2],
                }}
              >
                Ambientes operacionais
              </div>
              <p
                style={{
                  fontSize: `${fontSize.xs}px`,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                Cada terminal operacional abre o seu App dedicado (Waiter, Kitchen,
                Cleaning, Manager) diretamente. Aqui no portal, acompanhe apenas
                o estado e relatórios — a gestão de dispositivos vive em
                Configuração &gt; Dispositivos.
              </p>
            </div>
          )}
          <OwnerDashboard variant="web" />
        </main>
      </div>
    </div>
  );
}
