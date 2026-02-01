/**
 * DashboardPortal - Portal de Sistemas
 *
 * Após publicação, o usuário cai aqui.
 * Mostra todos os sistemas disponíveis como ícones clicáveis.
 *
 * Este é o "Dashboard" que você descreveu desde o começo.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { InstallAppPrompt } from "../../components/pwa/InstallAppPrompt";
import type { ProductMode } from "../../context/RestaurantRuntimeContext";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { OperationalShell, PanelRoot } from "../../core/operational";
import {
  canAccessPath,
  getDashboardCopy,
  normalizePath,
  type UserRole,
} from "../../core/roles";
import { useRoleOptional } from "../../core/roles/RoleContext";
import { ToastContainer, useToast } from "../../ui/design-system/Toast";
import { AlertsDashboardPage } from "../Alerts/AlertsDashboardPage";
import { AppStaffMobileOnlyPage } from "../AppStaff/AppStaffMobileOnlyPage";
import { BillingConfigPanel } from "../Billing/BillingConfigPanel";
import { ConfigIdentityPage } from "../Config/ConfigIdentityPage";
import { ConfigPerceptionPage } from "../Config/ConfigPerceptionPage";
import { FinancialDashboardPage } from "../Financial/FinancialDashboardPage";
import { GroupsDashboardPage } from "../Groups/GroupsDashboardPage";
import { HealthDashboardPage } from "../Health/HealthDashboardPage";
import { KDSMinimal } from "../KDSMinimal/KDSMinimal";
import { MentorDashboardPage } from "../Mentor/MentorDashboardPage";
import { MenuBuilderPanel } from "../MenuBuilder/MenuBuilderPanel";
import { OperacaoMinimal } from "../Operacao/OperacaoMinimal";
import { PeopleDashboardPage } from "../People/PeopleDashboardPage";
import { PurchasesDashboardPage } from "../Purchases/PurchasesDashboardPage";
import { ReservationsDashboardPage } from "../Reservations/ReservationsDashboardPage";
import { TPVMinimal } from "../TPVMinimal/TPVMinimal";
import { TaskDashboardPage } from "../Tasks/TaskDashboardPage";
import { alertEngine } from "../../core/alerts/AlertEngine";
import { EcraZeroView } from "../../components/Dashboard/EcraZeroView";
import { OperationalMetricsCards } from "../../components/Dashboard/OperationalMetricsCards";
import { ShiftHistorySection } from "../../components/Dashboard/ShiftHistorySection";
import { OSCopy } from "../../ui/design-system/sovereign/OSCopy";
import { useEcraZeroState } from "../../core/dashboard/useEcraZeroState";

const ESTADO_COPY: Record<
  ProductMode,
  { label: string; desc: string; color: string }
> = {
  demo: {
    label: "DEMO",
    desc: "Demonstração, ações reais bloqueadas.",
    color: "#3b82f6",
  },
  pilot: {
    label: "PILOTO",
    desc: "Operação real controlada.",
    color: "#f59e0b",
  },
  live: {
    label: "AO VIVO",
    desc: "Operação oficial.",
    color: "#22c55e",
  },
};

/** Item da árvore: selector (não navega). */
function TreeSection({
  label,
  systems,
  activeModule,
  setActiveModule,
  statusIcon,
  statusColor,
}: {
  label: string;
  systems: SystemCard[];
  activeModule: string | null;
  setActiveModule: (id: string | null) => void;
  statusIcon: string;
  statusColor: string;
}) {
  if (systems.length === 0) return null;
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#555",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "4px",
          paddingLeft: "4px",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {systems.map((system) => {
          const isSelected = activeModule === system.id;
          return (
            <button
              key={system.id}
              type="button"
              onClick={() => setActiveModule(isSelected ? null : system.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                fontSize: "13px",
                color: isSelected ? "#1a1a1a" : "#444",
                backgroundColor: isSelected ? "#e8ecf4" : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span
                style={{ color: statusColor, fontSize: "12px", width: "14px" }}
              >
                {statusIcon}
              </span>
              <span style={{ fontSize: "18px" }}>{system.icon}</span>
              <span>{system.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Conteúdo vivo do módulo ativo — sem card intermediário, sem "Abrir X". */
function ActiveModuleContent({
  activeModule,
}: {
  activeModule: string | null;
}) {
  if (!activeModule) return null;

  const panelStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    marginTop: "24px",
  };

  const wrap = (children: React.ReactNode) => (
    <div style={panelStyle}>
      <PanelRoot>{children}</PanelRoot>
    </div>
  );

  switch (activeModule) {
    case "tasks":
      return wrap(<TaskDashboardPage />);
    case "tpv":
      return wrap(<TPVMinimal />);
    case "kds":
      return wrap(<KDSMinimal />);
    case "menu":
      return wrap(<MenuBuilderPanel />);
    case "appstaff":
      return wrap(<AppStaffMobileOnlyPage />);
    case "health":
      return wrap(<HealthDashboardPage />);
    case "alerts":
      return wrap(<AlertsDashboardPage />);
    case "config":
      return wrap(<ConfigIdentityPage />);
    case "billing":
      return wrap(<BillingConfigPanel />);
    case "perception":
      return wrap(<ConfigPerceptionPage />);
    case "people":
      return wrap(<PeopleDashboardPage />);
    case "mentor":
      return wrap(<MentorDashboardPage />);
    case "purchases":
      return wrap(<PurchasesDashboardPage />);
    case "financial":
      return wrap(<FinancialDashboardPage />);
    case "reservations":
      return wrap(<ReservationsDashboardPage />);
    case "groups":
      return wrap(<GroupsDashboardPage />);
    case "qr-table":
      return wrap(<OperacaoMinimal />);
    case "restaurant-web":
    case "public-kds":
      return wrap(<KDSMinimal />);
    default:
      return null;
  }
}

function EstadoDoSistemaCard({
  style: styleProp,
}: {
  style?: React.CSSProperties;
}) {
  const { runtime, setProductMode } = useRestaurantRuntime();
  const mode = runtime.productMode ?? "demo";
  const config = ESTADO_COPY[mode];

  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 12,
        border: `1px solid ${config.color}40`,
        backgroundColor: `${config.color}08`,
        maxWidth: 420,
        ...styleProp,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#555",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 6,
        }}
      >
        Estado do sistema
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: config.color,
          marginBottom: 4,
        }}
      >
        {config.label}
      </div>
      <p style={{ fontSize: 13, color: "#666", margin: 0, marginBottom: 12 }}>
        {config.desc}
      </p>
      {mode === "demo" && (
        <button
          type="button"
          onClick={() => setProductMode("pilot")}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: config.color,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Ativar piloto
        </button>
      )}
      {mode === "pilot" && (
        <button
          type="button"
          onClick={() => setProductMode("live")}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: config.color,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Ativar ao vivo
        </button>
      )}
    </div>
  );
}

interface SystemCard {
  id: string;
  name: string;
  icon: string;
  description: string;
  route: string;
  moduleId?: string;
  color: string;
}

const SYSTEMS: SystemCard[] = [
  {
    id: "tpv",
    name: "TPV",
    icon: "🖥️",
    description: "Ponto de venda",
    route: "/op/tpv",
    moduleId: "tpv",
    color: "#667eea",
  },
  {
    id: "kds",
    name: "KDS",
    icon: "👨‍🍳",
    description: "Cozinha",
    route: "/op/kds",
    moduleId: "kds",
    color: "#f093fb",
  },
  {
    id: "menu",
    name: "Cardápio",
    icon: "🍽️",
    description: "Produtos e receitas",
    route: "/menu-builder",
    moduleId: "menu",
    color: "#4facfe",
  },
  {
    id: "inventory-stock",
    name: "Estoque",
    icon: "📦",
    description: "Inventário e estoque (alerta baixo)",
    route: "/inventory-stock",
    moduleId: "inventory-stock",
    color: "#2d5016",
  },
  {
    id: "tasks",
    name: "Tarefas",
    icon: "✅",
    description: "Sistema de tarefas",
    route: "/tasks",
    moduleId: "tasks",
    color: "#43e97b",
  },
  {
    id: "appstaff",
    name: "AppStaff",
    icon: "🧑‍🍳",
    description: "Aplicativo do staff (garçom / salão)",
    route: "/garcom",
    moduleId: "appstaff",
    color: "#ff9f43",
  },
  {
    id: "people",
    name: "Pessoas",
    icon: "👥",
    description: "Funcionários e escalas",
    route: "/people",
    moduleId: "people",
    color: "#fa709a",
  },
  {
    id: "health",
    name: "Saúde",
    icon: "💚",
    description: "Saúde do restaurante",
    route: "/health",
    moduleId: "health",
    color: "#30cfd0",
  },
  {
    id: "alerts",
    name: "Alertas",
    icon: "🚨",
    description: "Alertas críticos",
    route: "/alerts",
    moduleId: "alerts",
    color: "#f0932b",
  },
  {
    id: "mentor",
    name: "Mentor IA",
    icon: "🤖",
    description: "IA mentora",
    route: "/mentor",
    moduleId: "mentor",
    color: "#c471ed",
  },
  {
    id: "purchases",
    name: "Compras",
    icon: "🛒",
    description: "Fornecedores e pedidos",
    route: "/purchases",
    moduleId: "purchases",
    color: "#ffc796",
  },
  {
    id: "financial",
    name: "Financeiro",
    icon: "💰",
    description: "Fluxo de caixa",
    route: "/financial",
    moduleId: "financial",
    color: "#fbc2eb",
  },
  {
    id: "reservations",
    name: "Reservas",
    icon: "📅",
    description: "Sistema de reservas",
    route: "/reservations",
    moduleId: "reservations",
    color: "#a8edea",
  },
  {
    id: "groups",
    name: "Multi-Unidade",
    icon: "🏢",
    description: "Grupos e benchmarks",
    route: "/groups",
    moduleId: "groups",
    color: "#fed6e3",
  },
  {
    id: "config",
    name: "Configurar restaurante",
    icon: "⚙️",
    description: "Identidade, localização, horários",
    route: "/config",
    moduleId: "config",
    color: "#d299c2",
  },
  {
    id: "billing",
    name: "Billing",
    icon: "💳",
    description: "Subscrição e gateways de pagamento",
    route: "/app/billing",
    moduleId: "billing",
    color: "#22c55e",
  },
  {
    id: "perception",
    name: "Percepção Operacional",
    icon: "📷",
    description: "Câmera + análise com IA",
    route: "/config/perception",
    color: "#6366f1",
  },
  {
    id: "restaurant-web",
    name: "Presença Online",
    icon: "🌐",
    description: "Interface pública ativa do restaurante",
    route: "/public/demo-restaurant",
    moduleId: "restaurant-web",
    color: "#6c5ce7",
  },
  {
    id: "qr-table",
    name: "QR Mesa",
    icon: "🪑",
    description: "Página pública por mesa (QR_MESA)",
    route: "/operacao",
    color: "#2ecc71",
  },
  {
    id: "public-kds",
    name: "Painel Pedidos Prontos",
    icon: "📺",
    description: "KDS público com pedidos prontos",
    route: "/op/kds",
    color: "#e67e22",
  },
];

const ROLE_DENIED_MESSAGE = "Acesso restrito ao seu papel.";

/** Módulo ativo na árvore (selector). null = overview / nenhum selecionado. */
export function DashboardPortal() {
  const { runtime } = useRestaurantRuntime();
  const globalUI = useGlobalUIState();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roleContext = useRoleOptional();
  const role = roleContext?.role ?? null;
  const setRole = roleContext?.setRole;
  const { toasts, dismiss, warning, show } = useToast();
  const roleDeniedShown = useRef(false);
  const criticalAlertToastShown = useRef(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [alertsActiveCount, setAlertsActiveCount] = useState<number>(0);
  const [alertsCriticalCount, setAlertsCriticalCount] = useState<number>(0);
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const ecraZero = useEcraZeroState(runtime.restaurant_id ?? null);

  useEffect(() => {
    if (!runtime.restaurant_id) {
      setAlertsActiveCount(0);
      setAlertsCriticalCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [active, critical] = await Promise.all([
          alertEngine.getActive(runtime.restaurant_id),
          alertEngine.getCritical(runtime.restaurant_id),
        ]);
        if (!cancelled) {
          setAlertsActiveCount(active.length);
          setAlertsCriticalCount(critical.length);
        }
      } catch {
        if (!cancelled) {
          setAlertsActiveCount(0);
          setAlertsCriticalCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runtime.restaurant_id]);

  // O5.10: notificação in-app quando há alertas críticos (ALERT_ACTION_CONTRACT)
  useEffect(() => {
    if (alertsCriticalCount === 0) {
      criticalAlertToastShown.current = false;
      return;
    }
    if (!criticalAlertToastShown.current) {
      criticalAlertToastShown.current = true;
      const n = alertsCriticalCount;
      show({
        message: n === 1 ? "Tens 1 alerta crítico." : `Tens ${n} alertas críticos.`,
        type: "error",
        duration: 8000,
        action: {
          label: "Ver alertas",
          onClick: () => navigate("/app/alerts"),
        },
      });
    }
  }, [alertsCriticalCount, show, navigate]);

  useEffect(() => {
    if (location.state?.reason === "role_denied" && !roleDeniedShown.current) {
      roleDeniedShown.current = true;
      warning(ROLE_DENIED_MESSAGE);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.reason, location.pathname, navigate, warning]);

  // Redirect antigo: /dashboard?billing=success → página dedicada
  if (searchParams.get("billing") === "success") {
    navigate("/billing/success", { replace: true });
    return null;
  }

  if (globalUI.isLoadingCritical) {
    return (
      <GlobalLoadingView
        message="Carregando Dashboard..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  // Ecrã Zero do Dono (docs/product/ECRA_ZERO_DONO.md): primeiro ecrã após login; um juízo, uma causa, um gesto.
  if (role === "owner" && !showFullDashboard) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          paddingTop: runtime.mode !== "active" ? 52 : 0,
        }}
      >
        {runtime.mode !== "active" && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 40,
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
              ⚙️ Complete a configuração para ativar TPV, KDS e presença online.
            </span>
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
              Checklist de Configuração
            </button>
          </div>
        )}
        <EcraZeroView
          state={ecraZero.state}
          reason={ecraZero.reason}
          loading={ecraZero.loading}
          onAction={() => {
            if (ecraZero.state === "vermelho") {
              navigate("/alerts");
            } else {
              setShowFullDashboard(true);
            }
          }}
        />
      </div>
    );
  }

  // GLORIAFOOD MODEL: Portal central — nada bloqueia acesso ao dashboard.
  // Onboarding vira checklist/banners; bloqueios apenas em TPV/KDS (RequireOperational).

  // Agrupamento em 3 zonas: Em uso hoje, Pronto para ativar, Em evolução
  const ACTIVE_ZONE_IDS = [
    "tasks",
    "appstaff",
    "config",
    "billing",
    "perception",
    "health",
    "alerts",
    "restaurant-web",
  ];
  const PILOT_READY_IDS = ["tpv", "kds", "menu"];
  const EVOLVING_IDS = [
    "people",
    "mentor",
    "purchases",
    "financial",
    "reservations",
    "groups",
    "qr-table",
    "public-kds",
  ];

  const allowedSystems =
    role == null
      ? SYSTEMS
      : SYSTEMS.filter((s) => canAccessPath(role, normalizePath(s.route)));
  const activeSystems = allowedSystems.filter((s) =>
    ACTIVE_ZONE_IDS.includes(s.id),
  );
  const pilotReadySystems = allowedSystems.filter((s) =>
    PILOT_READY_IDS.includes(s.id),
  );
  const evolvingSystems = allowedSystems.filter((s) =>
    EVOLVING_IDS.includes(s.id),
  );
  const dashboardCopy = getDashboardCopy(role);

  /** Contexto operacional (OUC) — injetado no Shell para todos os painéis. */
  const operationalContext = {
    activeModule,
    systemMode: (runtime.productMode ?? "demo") as "demo" | "pilot" | "live",
    role: role as "owner" | "manager" | "staff" | null,
    uiDensity: "standard" as const,
    restaurantId: runtime.restaurant_id,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        paddingTop: runtime.mode !== "active" ? 52 : 0,
      }}
    >
      {/* Banner de checklist (não bloqueante) — GloriaFood: onboarding = ajuda contextual */}
      {runtime.mode !== "active" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 40,
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
            ⚙️ Complete a configuração para ativar TPV, KDS e presença online.
          </span>
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
            Checklist de Configuração
          </button>
        </div>
      )}

      {/* Sidebar OS - Mapa do Restaurante */}
      <aside
        style={{
          width: "260px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}>
            {dashboardCopy.sidebarTitle}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            {dashboardCopy.sidebarSubtitle}
          </div>
        </div>

        {/* DEV-only: Seletor de papel para simulação */}
        {import.meta.env.DEV && setRole && (
          <div
            style={{
              marginBottom: "8px",
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: "#f0f4f8",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#555",
                marginBottom: "6px",
              }}
            >
              DEV: Simular papel
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {(["owner", "manager", "staff"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: role === r ? 600 : 500,
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: role === r ? "#667eea" : "#fff",
                    color: role === r ? "#fff" : "#475569",
                  }}
                >
                  {r === "owner"
                    ? "Dono"
                    : r === "manager"
                    ? "Gerente"
                    : "Staff"}
                </button>
              ))}
            </div>
          </div>
        )}

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
          <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
            {runtime.active_modules?.length ?? runtime.installed_modules.length}{" "}
            ativo(s)
          </div>
          {runtime.plan === "premium" && (
            <div
              style={{
                fontSize: "10px",
                color: "#667eea",
                marginTop: "4px",
                fontWeight: 600,
              }}
            >
              Premium
            </div>
          )}
        </div>

        {/* Árvore do Sistema = única fonte de navegação. Troca foco do painel central. */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flex: 1,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "4px",
            }}
          >
            Sistema Operacional
          </div>
          {/* Em uso hoje */}
          <TreeSection
            label="Em uso hoje"
            systems={activeSystems}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            statusIcon="✓"
            statusColor="#43e97b"
          />
          {/* Pronto para ativar */}
          <TreeSection
            label="Pronto para ativar"
            systems={pilotReadySystems}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            statusIcon="○"
            statusColor="#667eea"
          />
          {/* Em evolução */}
          <TreeSection
            label="Em evolução"
            systems={evolvingSystems}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            statusIcon="…"
            statusColor="#999"
          />
        </nav>
      </aside>

      {/* Conteúdo principal — Shell impõe VPC e contexto (OUC). */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <OperationalShell context={operationalContext} fill>
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "4px",
                color: "#1a1a1a",
              }}
            >
              {dashboardCopy.mainTitle}
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#666",
                marginTop: "4px",
                maxWidth: "560px",
              }}
            >
              {dashboardCopy.mainSubtitle}
            </p>
          </div>

          {/* Promover instalação PWA — um ícone no desktop */}
          <InstallAppPrompt compact />

          {/* Próximo passo: criar primeiro produto (trial/onboarding) */}
          {runtime.mode !== "active" && (
            <section
              style={{
                marginBottom: "24px",
                padding: "16px 20px",
                borderRadius: 12,
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#92400e",
                  margin: "0 0 6px 0",
                }}
              >
                {OSCopy.emptyStates.primeiroProduto.titulo}
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#78350f",
                  margin: "0 0 12px 0",
                  lineHeight: 1.4,
                }}
              >
                {OSCopy.emptyStates.primeiroProduto.descricao}
              </p>
              <Link
                to="/onboarding/first-product"
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0a0a0a",
                  backgroundColor: "#eab308",
                  border: "none",
                  borderRadius: 8,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                {OSCopy.emptyStates.primeiroProduto.cta}
              </Link>
            </section>
          )}

          {/* Card Estado do sistema — DEMO / PILOT / LIVE + CTA contextual */}
          <EstadoDoSistemaCard style={{ marginBottom: "32px" }} />

          {/* Primeira venda em poucos passos — guia linear */}
          <section
            style={{
              marginBottom: "32px",
              padding: "20px 24px",
              borderRadius: 14,
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#166534",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 12,
              }}
            >
              🎯 Primeira venda em poucos passos
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 20px",
                alignItems: "center",
              }}
            >
              {[
                {
                  label: "1. Identidade",
                  route: "/config/identity",
                  done: runtime.setup_status?.identity,
                },
                {
                  label: "2. Localização",
                  route: "/config/location",
                  done: runtime.setup_status?.location,
                },
                {
                  label: "3. Horários",
                  route: "/config/schedule",
                  done: runtime.setup_status?.schedule,
                },
                {
                  label: "4. Cardápio",
                  route: "/menu-builder",
                  done: undefined,
                },
                { label: "5. Abrir TPV", route: "/op/tpv", done: undefined },
              ].map((step) => (
                <button
                  key={step.route}
                  type="button"
                  onClick={() => navigate(step.route)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: step.done ? "#166534" : "#1a1a1a",
                    backgroundColor: "#fff",
                    border: `1px solid ${step.done ? "#86efac" : "#e5e7eb"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  {step.done ? "✓" : "○"} {step.label}
                </button>
              ))}
            </div>
          </section>

          {/* Painel do módulo ativo — uma única fonte de conteúdo (não grid de cards) */}
          {!activeModule ? (
            <>
              {/* Onda 5 O5.1: atalhos rápidos (visão de dono) — TPV, KDS, Menu, Billing */}
              <section
                style={{
                  marginBottom: "24px",
                  padding: "20px 24px",
                  borderRadius: 14,
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 12,
                  }}
                >
                  Atalhos rápidos
                </h2>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  {[
                    { id: "tpv", label: "TPV (Caixa)", icon: "🖥️" },
                    { id: "kds", label: "Cozinha (KDS)", icon: "📺" },
                    { id: "menu", label: "Cardápio", icon: "📋" },
                    { id: "billing", label: "Faturação", icon: "💳" },
                  ].map(({ id, label, icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveModule(id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 16px",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#1a1a1a",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              <OperationalMetricsCards />

              {/* Onda 5 O5.6: histórico por turno (RPC get_shift_history) */}
              <ShiftHistorySection />

              {/* Onda 5 O5.8: alertas acionáveis no hub — resumo + atalho */}
              <section
                style={{
                  marginTop: "24px",
                  marginBottom: "24px",
                  padding: "16px 24px",
                  borderRadius: 14,
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: 4,
                    }}
                  >
                    Alertas
                  </h2>
                  <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
                    {alertsActiveCount} ativos
                    {alertsCriticalCount > 0 && (
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>
                        {" "}
                        · {alertsCriticalCount} críticos
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule("alerts")}
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#fff",
                    backgroundColor: alertsCriticalCount > 0 ? "#dc2626" : "#64748b",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Ver alertas
                </button>
              </section>

              <section
                style={{
                  marginTop: "24px",
                  padding: "32px 24px",
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                <p
                  style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}
                >
                  Selecione um módulo na coluna esquerda para ver o estado e as
                  ações.
                </p>
                <p style={{ fontSize: "13px", color: "#999" }}>
                  O mapa do sistema está à esquerda; o conteúdo aparece aqui.
                </p>
              </section>
            </>
          ) : (
            <ActiveModuleContent activeModule={activeModule} />
          )}
        </OperationalShell>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
