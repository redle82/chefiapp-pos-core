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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoreStatusBadge } from "../../../../components/CoreStatusBadge/CoreStatusBadge";
import { CONFIG } from "../../../../config";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { useDashboardViewModel } from "../../../../core/dashboard/DashboardViewModel";
import {
  deriveSystemTreeState,
  type NodeId,
} from "../../../../core/dashboard/systemTreeState";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { useMenuState } from "../../../../core/menu/MenuState";
import {
  BlockingScreen,
  usePreflightOperational,
} from "../../../../core/readiness";
import { getDashboardCopy } from "../../../../core/roles";
import { useRoleOptional } from "../../../../core/roles/RoleContext";
import { OwnerDashboard } from "../../../../pages/AppStaff/OwnerDashboard";
import { GlobalLoadingView } from "../../../../ui/design-system/components";
import styles from "./OwnerDashboardWithMapLayout.module.css";

function OperacaoCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const preflight = usePreflightOperational({ healthAutoStart: true });
  const hasCoreOffline = preflight.blockers.some(
    (b) => b.code === "CORE_OFFLINE",
  );
  const hasNoPublishedMenu = preflight.blockers.some(
    (b) => b.code === "NO_PUBLISHED_MENU",
  );
  const hasNoIdentity = preflight.blockers.some(
    (b) => b.code === "NO_IDENTITY",
  );
  const abrirTpvEnabled = !hasCoreOffline && preflight.hasPublishedMenu;
  const showRunbookLink = hasCoreOffline;

  return (
    <div className={styles.opCard} data-ready={preflight.operationReady}>
      <div className={styles.opCardLabel}>Operação</div>
      <div
        className={styles.opCardStatus}
        data-ready={preflight.operationReady}
      >
        {preflight.operationReady ? "Pronto" : "Bloqueado"}
      </div>
      {preflight.blockers.length > 0 && (
        <ul className={styles.opCardBlockerList}>
          {preflight.blockers.map((b) => (
            <li key={b.code}>{b.message}</li>
          ))}
        </ul>
      )}
      <div className={styles.opCardActions}>
        <button
          type="button"
          disabled={!abrirTpvEnabled}
          onClick={() => {
            if (!abrirTpvEnabled) return;
            // Em Reports, abrimos apenas a visão de operações (leitura), não o TPV.
            onNavigate("/admin/reports/operations");
          }}
          className={styles.opMainBtn}
          data-enabled={abrirTpvEnabled}
        >
          Ver detalhe da operação
        </button>
        {hasNoPublishedMenu && (
          <button
            type="button"
            onClick={() => onNavigate("/menu-builder")}
            className={styles.opMenuBtn}
          >
            Menu Builder
          </button>
        )}
        {hasNoIdentity && (
          <button
            type="button"
            onClick={() => onNavigate("/admin/config/general")}
            className={styles.opIdentityBtn}
          >
            Configurar identidade
          </button>
        )}
        {showRunbookLink && (
          <button
            type="button"
            onClick={() => onNavigate("/app/runbook-core")}
            className={styles.opRunbookBtn}
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
      {
        id: "operacao-tpv",
        label: "TPV",
        icon: "🖥️",
        route: "/op/tpv",
        moduleId: "tpv" as const,
      },
      {
        id: "operacao-turnos",
        label: "Turnos & Caixa",
        icon: "🧾",
        route: "/op/tpv",
        moduleId: "tpv" as const,
      },
    ],
  },
  {
    id: "configuracao",
    label: "Configuração",
    items: [
      {
        id: "config-identidade",
        label: "Identidade",
        icon: "🏪",
        route: "/admin/config/general",
        moduleId: "config" as const,
      },
      {
        id: "config-local",
        label: "Local & Moeda",
        icon: "📍",
        route: "/admin/config/locations",
        moduleId: "config" as const,
      },
      {
        id: "config-cardapio",
        label: "Cardápio",
        icon: "🍽️",
        route: "/menu-builder",
        moduleId: "menu" as const,
      },
      {
        id: "config-publicacao",
        label: "Publicação",
        icon: "🚀",
        route: "/app/publish",
        moduleId: "publish" as const,
      },
    ],
  },
  {
    id: "equipa",
    label: "Equipa",
    items: [
      {
        id: "equipa-pessoas",
        label: "Pessoas",
        icon: "👥",
        route: "/people",
        moduleId: "people" as const,
      },
      {
        id: "equipa-appstaff",
        label: "AppStaff",
        icon: "🧑‍🍳",
        route: "/garcom",
        moduleId: "appstaff" as const,
      },
      {
        id: "equipa-presenca-online",
        label: "Presença Online",
        icon: "🌐",
        route: "/public/trial-restaurant",
        moduleId: "restaurant-web" as const,
      },
    ],
  },
  {
    id: "gestao",
    label: "Gestão",
    items: [
      {
        id: "gestao-financeiro",
        label: "Financeiro",
        icon: "💰",
        route: "/financial",
        moduleId: "financial" as const,
      },
      {
        id: "gestao-faturacao",
        label: "Faturação",
        icon: "💳",
        route: "/app/billing",
        moduleId: "billing" as const,
      },
      {
        id: "gestao-percepcao",
        label: "Percepção Operacional",
        icon: "📷",
        route: "/admin/config",
        moduleId: "perception" as const,
      },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [
      {
        id: "sistema-saude",
        label: "Saúde",
        icon: "💚",
        route: "/health",
        moduleId: "health" as const,
      },
      {
        id: "sistema-alertas",
        label: "Alertas",
        icon: "🚨",
        route: "/alerts",
        moduleId: "alerts" as const,
      },
      {
        id: "sistema-estado",
        label: "Estado do Sistema",
        icon: "🧠",
        route: "/health",
        moduleId: "health" as const,
      },
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
      ? identity?.name?.trim() || "Restaurante"
      : isOperationalOS && !runtime.restaurant_id
      ? "Seleccionar restaurante"
      : null;

  const getFirstMissingConfigPath = (): string => {
    const candidates: { nodeId: NodeId; path: string }[] = [
      { nodeId: "identity", path: "/admin/config/general" },
      { nodeId: "location_currency", path: "/admin/config/locations" },
      { nodeId: "menu", path: "/menu-builder" },
    ];
    for (const desired of ["missing", "incomplete"] as const) {
      const match = candidates.find(({ nodeId }) => {
        const node = systemTreeState[nodeId];
        return node && node.state === desired;
      });
      if (match) return match.path;
    }
    return "/admin/config/general";
  };

  const blockedByCaixa =
    !readiness.ready &&
    (readiness.blockingReasons?.includes("NO_OPEN_CASH_REGISTER") ||
      readiness.blockingReasons?.includes("SHIFT_NOT_STARTED"));
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
        reason={readiness.blockingReasons?.[0] as any}
        redirectTo={(readiness as any).redirectTo}
      />
    );
  }

  return (
    <div className={styles.pageContainer}>
      {showSetupBanner && (
        <div className={styles.setupBanner}>
          <span className={styles.setupBannerText}>
            ⚙️ Complete o setup: primeiro produto e cardápio.
          </span>
          <div className={styles.setupBannerActions}>
            <button
              onClick={() => navigate("/admin/config/general")}
              className={styles.setupBtnDark}
            >
              Preparar identidade
            </button>
            <button
              onClick={() => navigate("/menu-builder")}
              className={styles.setupBtnAmber}
            >
              Abrir Cardápio
            </button>
          </div>
        </div>
      )}
      {blockedByCaixa && (
        <div className={styles.blockedBanner}>
          <div className={styles.blockedBannerText}>
            O turno ainda não está aberto. Use o TPV no terminal operacional
            para abrir o turno e poder vender.
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/reports/operations")}
            className={styles.blockedBannerBtn}
          >
            Ver detalhe
          </button>
        </div>
      )}
      <div className={styles.contentRow}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitleBlock}>
            <div className={styles.sidebarTitle}>
              {isOperationalOS && sidebarTitleOperational != null
                ? sidebarTitleOperational
                : dashboardCopy.sidebarTitle}
            </div>
            <div className={styles.sidebarSubtitle}>
              {isOperationalOS
                ? preflight.operationReady
                  ? "Estado: Pronta"
                  : "Estado: Operação bloqueada"
                : dashboardCopy.sidebarSubtitle}
            </div>
          </div>

          {runtime.installed_modules?.length != null &&
            runtime.installed_modules.length > 0 && (
              <div className={styles.modulesReadyCard}>
                <div className={styles.modulesReadyLabel}>
                  Sistema pronto ✅
                </div>
                <div className={styles.modulesReadyCount}>
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
            <div className={styles.coreStatusBox}>
              <CoreStatusBadge />
            </div>
          )}

          <nav className={styles.nav}>
            <div className={styles.mapaLabel}>Mapa do sistema</div>
            {MAPA_SECTIONS.map((section) => (
              <div key={section.id}>
                <div className={styles.sectionLabel}>{section.label}</div>
                <div className={styles.sectionItems}>
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
                        status =
                          operation.configStatus === "INCOMPLETE"
                            ? "red"
                            : "green";
                        break;
                      case "operacao-turnos":
                        if (operation.configStatus === "INCOMPLETE")
                          status = "red";
                        else if (turn.operationStatus === "TURN_OPEN")
                          status = "green";
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
                        <span className={styles.badgeRed}>
                          🔴 Requer atenção
                        </span>
                      ) : status === "green" ? (
                        <span
                          className={styles.badgeGreen}
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
                        className={styles.mapItemBtn}
                        data-active={activeModule === item.moduleId}
                      >
                        <span className={styles.mapItemLeft}>
                          <span className={styles.mapItemIcon}>
                            {item.icon}
                          </span>
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

        <main className={styles.main}>
          {role === "owner" && (
            <div className={styles.ambientesCard}>
              <div className={styles.ambientesTitle}>
                Ambientes operacionais
              </div>
              <p className={styles.ambientesDesc}>
                Cada terminal operacional abre o seu App dedicado (Waiter,
                Kitchen, Cleaning, Manager) diretamente. Aqui no portal,
                acompanhe apenas o estado e relatórios — a gestão de
                dispositivos vive em Configuração &gt; Dispositivos.
              </p>
            </div>
          )}
          <OwnerDashboard variant="web" />
        </main>
      </div>
    </div>
  );
}
