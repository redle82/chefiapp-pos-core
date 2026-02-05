/**
 * DashboardPortal - Portal de Sistemas
 *
 * Após publicação, o usuário cai aqui.
 * Mostra todos os sistemas disponíveis como ícones clicáveis.
 *
 * Este é o "Dashboard" que você descreveu desde o começo.
 */

import { fontSize, fontWeight, space } from "@chefiapp/core-design-system";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CoreStatusBadge } from "../../components/CoreStatusBadge/CoreStatusBadge";
import { EcraZeroView } from "../../components/Dashboard/EcraZeroView";
import { OperationalMetricsCards } from "../../components/Dashboard/OperationalMetricsCards";
import { ShiftHistorySection } from "../../components/Dashboard/ShiftHistorySection";
import { DataModeBanner } from "../../components/DataModeBanner";
import { InstallAppPrompt } from "../../components/pwa/InstallAppPrompt";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { alertEngine } from "../../core/alerts/AlertEngine";
import { useEcraZeroState } from "../../core/dashboard/useEcraZeroState";
import { deriveRestaurantReadiness } from "../../core/dashboard/restaurantReadiness";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import {
  MENU_STATE_MESSAGES,
  useMenuState,
  type MenuState,
} from "../../core/menu/MenuState";
import { OperationalShell, PanelRoot } from "../../core/operational";
import {
  BlockingScreen,
  useOperationalReadiness,
  usePreflightOperational,
} from "../../core/readiness";
import {
  canAccessPath,
  getDashboardCopy,
  normalizePath,
} from "../../core/roles";
import { useRoleOptional } from "../../core/roles/RoleContext";
import { useShift } from "../../core/shift/ShiftContext";
import { useOperationalKernel } from "../../core/operational/useOperationalKernel";
import { useTerminals } from "../../core/terminal/useTerminals";
import {
  CashRegisterEngine,
  type CashRegister,
} from "../../core/tpv/CashRegister";
import { CONFIG } from "../../config";
import { useBootstrapState } from "../../hooks/useBootstrapState";
import { EmptyState } from "../../ui/design-system";
import { ToastContainer, useToast } from "../../ui/design-system/Toast";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { AlertsDashboardPage } from "../Alerts/AlertsDashboardPage";
import { AppStaffMobileOnlyPage } from "../AppStaff/AppStaffMobileOnlyPage";
import { BillingConfigPanel } from "../Billing/BillingConfigPanel";
import { ConfigIdentityPage } from "../Config/ConfigIdentityPage";
import { ConfigPerceptionPage } from "../Config/ConfigPerceptionPage";
import { FinancialDashboardPage } from "../Financial/FinancialDashboardPage";
import { GroupsDashboardPage } from "../Groups/GroupsDashboardPage";
import { HealthDashboardPage } from "../Health/HealthDashboardPage";
import { InstallPage } from "../InstallPage";
import { InventoryStockMinimal } from "../InventoryStock/InventoryStockMinimal";
import { KDSMinimal } from "../KDSMinimal/KDSMinimal";
import { MentorDashboardPage } from "../Mentor/MentorDashboardPage";
import { MenuBuilderPanel } from "../MenuBuilder/MenuBuilderPanel";
import { OperacaoMinimal } from "../Operacao/OperacaoMinimal";
import { PeopleDashboardPage } from "../People/PeopleDashboardPage";
import { PublishPage } from "../PublishPage";
import { PurchasesDashboardPage } from "../Purchases/PurchasesDashboardPage";
import { ReservationsDashboardPage } from "../Reservations/ReservationsDashboardPage";
import { TPVMinimal } from "../TPVMinimal/TPVMinimal";
import { TaskDashboardPage } from "../Tasks/TaskDashboardPage";

/** Estado opcional por item (ex.: TPV/KDS bloqueados por ORE). */
export type TreeItemState = { disabled?: boolean; tooltip?: string };

/** Item da árvore: selector (não navega). Suporta disabled + tooltip por item. */
function TreeSection({
  label,
  systems,
  activeModule,
  setActiveModule,
  statusIcon,
  statusColor,
  getItemState,
}: {
  label: string;
  systems: SystemCard[];
  activeModule: string | null;
  setActiveModule: (id: string | null) => void;
  statusIcon: string;
  statusColor: string;
  getItemState?: (system: SystemCard) => TreeItemState | undefined;
}) {
  if (systems.length === 0) return null;
  return (
    <div>
      {label ? (
        <div
          style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: "#555",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: space[1],
            paddingLeft: space[1],
          }}
        >
          {label}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {systems.map((system) => {
          const isSelected = activeModule === system.id;
          const itemState = getItemState?.(system);
          const disabled = itemState?.disabled ?? false;
          const tooltip = itemState?.tooltip;
          return (
            <button
              key={system.id}
              type="button"
              title={tooltip}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                setActiveModule(isSelected ? null : system.id);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: `${space[1]}px ${space[2]}px`,
                fontSize: fontSize.sm,
                color: disabled ? "#999" : isSelected ? "#1a1a1a" : "#444",
                backgroundColor: isSelected ? "#e8ecf4" : "transparent",
                border: "none",
                borderRadius: 6,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "background-color 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: space[1],
                opacity: disabled ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !disabled)
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span
                style={{
                  color: statusColor,
                  fontSize: fontSize.xs,
                  width: 14,
                }}
              >
                {statusIcon}
              </span>
              <span style={{ fontSize: 18 }}>{system.icon}</span>
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
    case "publish":
      return wrap(<PublishPage />);
    case "install":
      return wrap(<InstallPage />);
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
    case "inventory-stock":
      return wrap(<InventoryStockMinimal />);
    default:
      return null;
  }
}

/** Copy por SystemState (FASE C — CONTRATO_TRIAL_REAL). */
const SYSTEM_STATE_COPY: Record<
  "SETUP" | "TRIAL" | "ACTIVE" | "SUSPENDED",
  { label: string; color: string }
> = {
  SETUP: {
    label: "Complete o setup para começar.",
    color: "#f59e0b",
  },
  TRIAL: {
    label: "Trial ativo — 14 dias para operar no seu restaurante real.",
    color: "#22c55e",
  },
  ACTIVE: {
    label: "Plano ativo — operação ao vivo.",
    color: "#22c55e",
  },
  SUSPENDED: {
    label: "Pagamento em atraso — regularize para continuar.",
    color: "#ef4444",
  },
};

/** Card Estado do sistema — derivado do bootstrap (coreStatus + operationMode + publishStatus). */
function EstadoDoSistemaCard({
  style: styleProp,
}: {
  style?: React.CSSProperties;
}) {
  const { runtime } = useRestaurantRuntime();
  const bootstrap = useBootstrapState();
  const state = runtime.systemState ?? "SETUP";
  const config = SYSTEM_STATE_COPY[state];

  const bootstrapLabel =
    bootstrap.coreStatus === "offline-erro"
      ? "Core offline — inicie o Docker Core."
      : bootstrap.publishStatus !== "publicado"
      ? "Complete a publicação para operar."
      : bootstrap.operationMode === "operacao-real"
      ? "Operação ao vivo."
      : "Exploração.";

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
        Pronto para vender?
      </div>
      <p
        style={{
          fontSize: 15,
          color: config.color,
          margin: 0,
          fontWeight: 600,
        }}
      >
        {config.label}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "#64748b",
          margin: "6px 0 0 0",
          fontWeight: 500,
        }}
      >
        {bootstrapLabel}
      </p>
    </div>
  );
}

/** Cartão Operação — Preflight: status (Pronto/Bloqueado), blockers, CTAs. */
function OperacaoCard({ onNavigate }: { onNavigate: (path: string) => void }) {
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
          onClick={() => abrirTpvEnabled && onNavigate("/op/tpv")}
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
          Abrir TPV
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

/** CORREÇÃO 1: Vista obrigatória quando systemState === "SETUP". Nunca return null. */
function SetupRequiredView({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        paddingTop: 52,
      }}
    >
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
          ⚙️ Prepare o restaurante para ativar TPV, cozinha e presença online.
        </span>
        <button
          onClick={() => onNavigate("/config/identity")}
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
          Preparar restaurante
        </button>
      </div>
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: "24px 28px",
            borderRadius: 14,
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#1a1a1a",
              margin: "0 0 8px 0",
            }}
          >
            Complete o setup para começar
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#666",
              margin: "0 0 20px 0",
              lineHeight: 1.5,
            }}
          >
            Configure a identidade, localização e horários do seu restaurante e
            crie o primeiro produto.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => onNavigate("/config/identity")}
              style={{
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "#f59e0b",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Preparar restaurante
            </button>
            <button
              onClick={() => onNavigate("/onboarding/first-product")}
              style={{
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                color: "#1a1a1a",
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Criar primeiro produto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** CORREÇÃO 1: Vista obrigatória quando systemState === "SUSPENDED". Nunca return null. */
function SuspendedView({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <EmptyState
        title="Pagamento em atraso"
        description="Regularize a sua subscrição para continuar a operar."
        action={{
          label: "Ir para Faturação",
          onClick: () => onNavigate("/app/billing"),
        }}
      />
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
    id: "publish",
    name: "Publicar",
    icon: "🚀",
    description: "Ativar TPV, KDS e presença online",
    route: "/app/publish",
    moduleId: "publish",
    color: "#8b5cf6",
  },
  {
    id: "install",
    name: "Instalar Terminais",
    icon: "📲",
    description: "Web app instalável (Caixa e Cozinha)",
    route: "/app/install",
    moduleId: "install",
    color: "#06b6d4",
  },
  {
    id: "billing",
    name: "Faturação",
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

import { OnboardingProvider } from "../../context/OnboardingContext";

/** Módulo ativo na árvore (selector). null = overview / nenhum selecionado. */
export function DashboardPortal() {
  return (
    <OnboardingProvider>
      <DashboardPortalContent />
    </OnboardingProvider>
  );
}

function DashboardPortalContent() {
  const readiness = useOperationalReadiness("DASHBOARD");
  const { runtime } = useRestaurantRuntime();
  const bootstrap = useBootstrapState();
  const menuState: MenuState = useMenuState();
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
  const [crescimentoExpanded, setCrescimentoExpanded] = useState(false);
  const ecraZero = useEcraZeroState(runtime.restaurant_id ?? null);
  const shift = useShift();
  const preflight = usePreflightOperational({ healthAutoStart: true });
  const isOperationalOS = CONFIG.UI_MODE === "OPERATIONAL_OS";
  const { identity } = useRestaurantIdentity();
  const [activeShift, setActiveShift] = useState<CashRegister | null>(null);
  const { equipment, hasTerminals, isOnline } = useTerminals(
    runtime.restaurant_id ?? null
  );
  const kernel = useOperationalKernel({ healthAutoStart: true });

  // OPERATIONAL_HEADER_CONTRACT: títulos header/sidebar por modo e restaurante
  const headerTitle =
    isOperationalOS && runtime.restaurant_id
      ? (identity?.name?.trim() || "Restaurante")
      : null;
  const sidebarTitleOperational =
    isOperationalOS && runtime.restaurant_id
      ? (identity?.name?.trim() || "Restaurante")
      : isOperationalOS && !runtime.restaurant_id
        ? "Seleccionar restaurante"
        : null;

  // Lei do Turno: ao montar o Dashboard, ler estado do turno na fonte única (Core) para não mostrar "turno fechado" em cache
  useEffect(() => {
    shift?.refreshShiftStatus?.();
  }, []);

  // OPERATIONAL_HEADER_CONTRACT: turno activo para "Operador actual" (name, openedBy)
  useEffect(() => {
    if (!isOperationalOS || !runtime.restaurant_id || !shift?.isShiftOpen) {
      setActiveShift(null);
      return;
    }
    let cancelled = false;
    CashRegisterEngine.getOpenCashRegister(runtime.restaurant_id)
      .then((reg) => {
        if (!cancelled && reg) setActiveShift(reg);
        else if (!cancelled) setActiveShift(null);
      })
      .catch(() => {
        if (!cancelled) setActiveShift(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOperationalOS, runtime.restaurant_id, shift?.isShiftOpen]);

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

  // O5.10 + OPERATIONAL_ALERTS_CONTRACT: notificação quando há alertas que exigem atenção; critical = bloqueio/verdade; máx. 1–3 visíveis, link "Ver alertas"
  const displayCriticalCap = Math.min(alertsCriticalCount, 3);
  const hasManyCritical = alertsCriticalCount > 3;

  // DASHBOARD_READINESS_CONTRACT: estados macro de prontidão (configuração vs operação)
  const restaurantReadiness = deriveRestaurantReadiness({
    preflight,
    runtimeRestaurantId: runtime.restaurant_id ?? null,
  });
  useEffect(() => {
    if (alertsCriticalCount === 0) {
      criticalAlertToastShown.current = false;
      return;
    }
    if (!criticalAlertToastShown.current) {
      criticalAlertToastShown.current = true;
      const n = alertsCriticalCount;
      const message =
        n === 1
          ? "Tens 1 alerta que exige atenção."
          : n <= 3
            ? `Tens ${n} alertas que exigem atenção.`
            : "Tens vários alertas que exigem atenção.";
      show({
        message,
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

  // Redirect: /dashboard?billing=success → página dedicada. Nunca return null (sempre renderizar algo).
  if (searchParams.get("billing") === "success") {
    navigate("/billing/success", { replace: true });
    return (
      <GlobalLoadingView
        message="A redirecionar..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  const blockedByCaixa =
    !readiness.ready &&
    (readiness.blockingReason === "NO_OPEN_CASH_REGISTER" ||
      readiness.blockingReason === "SHIFT_NOT_STARTED");
  if (globalUI.isLoadingCritical && !blockedByCaixa) {
    return (
      <GlobalLoadingView
        message="Carregando Dashboard..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  // Web de configuração: SEMPRE renderizar. Ramificação explícita por systemState (nunca return null).
  // SETUP → portal com banner; TRIAL/ACTIVE → portal; SUSPENDED → vista faturação; fallback → portal (nunca vazio).
  const systemState = runtime.systemState ?? "SETUP";
  const showSetupBanner = systemState === "SETUP";
  if (systemState === "SUSPENDED") {
    return <SuspendedView onNavigate={navigate} />;
  }
  // Qualquer outro estado (TRIAL, ACTIVE, ou valor inesperado): mostrar portal, nunca tela vazia.
  if (systemState !== "TRIAL" && systemState !== "ACTIVE" && !showSetupBanner) {
    // Fallback seguro: tratar como SETUP e mostrar portal com banner (nunca EmptyState que pareça “bloqueado”).
    // Assim a web de configuração continua acessível mesmo com estado derivado inesperado.
  }

  // Na rota /dashboard mostramos sempre o portal (tela de configuração web), sem gate do Ecrã Zero.
  const isDashboardRoute =
    location.pathname === "/dashboard" ||
    location.pathname === "/app/dashboard";
  const showPortalDirectly =
    isDashboardRoute || showFullDashboard || showSetupBanner;

  // TRIAL / ACTIVE (ou SETUP): Ecrã Zero do Dono ou dashboard completo. Em /dashboard → sempre portal.
  if (!showPortalDirectly) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
        }}
      >
        <DataModeBanner dataMode={runtime.dataMode} />
        <EcraZeroView
          state={ecraZero.state}
          reason={ecraZero.reason}
          loading={ecraZero.loading}
          dataMode={runtime.dataMode}
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

  // GLORIAFOOD MODEL: 5 blocos — Começar, Operar, Equipe, Gestão, Crescimento (colapsado).
  const COMECAR_IDS = ["config", "menu", "publish", "install"];
  const OPERAR_IDS = ["tpv", "kds", "alerts", "health"];
  const EQUIPE_IDS = ["appstaff", "people", "tasks", "restaurant-web"];
  const GESTAO_IDS = ["financial", "billing", "perception"];
  const CRESCIMENTO_IDS = [
    "reservations",
    "purchases",
    "groups",
    "qr-table",
    "mentor",
    "public-kds",
    "inventory-stock",
  ];

  const allowedSystems =
    role == null
      ? SYSTEMS
      : SYSTEMS.filter((s) => canAccessPath(role, normalizePath(s.route)));

  const comecarSystems = allowedSystems.filter((s) =>
    COMECAR_IDS.includes(s.id)
  );
  const operarSystems = allowedSystems.filter((s) => OPERAR_IDS.includes(s.id));
  const equipeSystems = allowedSystems.filter((s) => EQUIPE_IDS.includes(s.id));
  const gestaoSystems = allowedSystems.filter((s) => GESTAO_IDS.includes(s.id));
  const crescimentoSystems = allowedSystems.filter((s) =>
    CRESCIMENTO_IDS.includes(s.id)
  );

  const dashboardCopy = getDashboardCopy(role);

  /** TPV/KDS desativados quando ORE bloqueia (Core offline, não publicado, sem caixa/turno). */
  const getOperarItemState = (system: SystemCard): TreeItemState => {
    if (system.id !== "tpv" && system.id !== "kds") return {};
    if (readiness.ready) return {};
    const reason = readiness.blockingReason;
    if (reason === "CORE_OFFLINE")
      return { disabled: true, tooltip: "Core offline. Ver Runbook." };
    if (reason === "NOT_PUBLISHED")
      return { disabled: true, tooltip: "Publicar menu para operar." };
    if (reason === "NO_OPEN_CASH_REGISTER" || reason === "SHIFT_NOT_STARTED")
      return { disabled: true, tooltip: "Abra o turno no TPV para vender." };
    return { disabled: true, tooltip: "Não disponível." };
  };

  /** Crescimento: todos disabled + tooltip "Em evolução". */
  const getCrescimentoItemState = (_system: SystemCard): TreeItemState => ({
    disabled: true,
    tooltip: "Em evolução",
  });

  /** Contexto operacional (OUC) — injetado no Shell. UI lê systemState; systemMode derivado (não productMode). */
  const operationalContext = {
    activeModule,
    systemMode: (systemState === "ACTIVE" || systemState === "TRIAL"
      ? "live"
      : "demo") as "demo" | "pilot" | "live",
    role: role as "owner" | "manager" | "staff" | null,
    uiDensity: "standard" as const,
    restaurantId: runtime.restaurant_id,
  };

  // TRIAL / ACTIVE (ou SETUP): portal completo. SETUP: banner sem link para onboarding antigo (/config).
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
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
              onClick={() => navigate("/onboarding/first-product")}
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
              Primeiro produto
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
              Cardápio
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
            O turno ainda não está aberto. Abra o turno no TPV para poder
            vender.
          </div>
          <button
            type="button"
            onClick={() => navigate("/op/tpv")}
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
            Abrir turno
          </button>
        </div>
      )}
      <div style={{ display: "flex", flex: 1 }}>
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
            <div
              style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}
            >
              {isOperationalOS && sidebarTitleOperational != null
                ? sidebarTitleOperational
                : dashboardCopy.sidebarTitle}
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>
              {isOperationalOS
                ? kernel.canOperate
                  ? "Estado: Pronta"
                  : "Estado: Operação bloqueada"
                : dashboardCopy.sidebarSubtitle}
            </div>
          </div>

          {!isOperationalOS && (
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
                {runtime.active_modules?.length ??
                  runtime.installed_modules.length}{" "}
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
          )}

          <OperacaoCard onNavigate={navigate} />

          {!isOperationalOS && (
            /* Badge de estado do Core — em OPERATIONAL_OS só o OperacaoCard mostra estado */
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

          {/* Faturação — oculta em OPERATIONAL_OS */}
          {(systemState === "TRIAL" || systemState === "ACTIVE") &&
            !isOperationalOS && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ fontSize: "12px", fontWeight: 600, color: "#1e40af" }}
              >
                💳 Faturação
              </div>
              <button
                type="button"
                onClick={() => navigate("/app/billing")}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#1e40af",
                  backgroundColor: "#fff",
                  border: "1px solid #93c5fd",
                  borderRadius: 6,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Ver planos e faturação
              </button>
            </div>
          )}

          {/* Árvore do Sistema = 5 blocos GloriaFood: Começar, Operar, Equipe, Gestão, Crescimento. */}
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
              Sistema Operacional
            </div>
            <TreeSection
              label="Começar"
              systems={comecarSystems}
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              statusIcon="✓"
              statusColor="#43e97b"
            />
            {/* Operar: Kernel gate — lista só quando kernel.terminals.canQuery; senão "Não instalado" + CTA */}
            {kernel.terminals.canQuery && hasTerminals && equipment.length > 0 ? (
              <div>
                <div
                  style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: "#555",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: space[1],
                    paddingLeft: space[1],
                  }}
                >
                  Operar
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {equipment.map((eq) => {
                    const online = isOnline(eq);
                    const route = eq.kind === "TPV" ? "/op/tpv" : "/op/kds";
                    const icon = eq.kind === "TPV" ? "🖥️" : "👨‍🍳";
                    return (
                      <div
                        key={eq.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: `${space[1]}px ${space[2]}px`,
                          fontSize: fontSize.sm,
                          color: online ? "#e5e5e5" : "#999",
                          backgroundColor: activeModule === (eq.kind === "TPV" ? "tpv" : "kds") ? "rgba(102,126,234,0.15)" : "transparent",
                          borderRadius: 6,
                          gap: space[1],
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(route)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && navigate(route)}
                      >
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <span style={{ flex: 1 }}>
                          {eq.kind} {eq.name}
                        </span>
                        <span
                          style={{
                            fontSize: fontSize.xs,
                            color: online ? "#43e97b" : "#737373",
                          }}
                        >
                          {online ? "Online" : "Offline"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {operarSystems.filter((s) => s.id !== "tpv" && s.id !== "kds").length > 0 && (
                  <TreeSection
                    label=""
                    systems={operarSystems.filter((s) => s.id !== "tpv" && s.id !== "kds")}
                    activeModule={activeModule}
                    setActiveModule={setActiveModule}
                    statusIcon="○"
                    statusColor="#667eea"
                    getItemState={getOperarItemState}
                  />
                )}
              </div>
            ) : kernel.terminals.canQuery && !hasTerminals ? (
              <div>
                <div
                  style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: "#555",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: space[1],
                    paddingLeft: space[1],
                  }}
                >
                  Operar
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: `${space[1]}px ${space[2]}px`,
                      fontSize: fontSize.sm,
                      color: "#999",
                      backgroundColor: "transparent",
                      borderRadius: 6,
                      gap: space[1],
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🖥️</span>
                    <span>TPV — Não instalado</span>
                    <button
                      type="button"
                      onClick={() => navigate("/app/install")}
                      style={{
                        fontSize: fontSize.sm,
                        fontWeight: 600,
                        color: "#059669",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                      }}
                    >
                      Instalar terminal
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: `${space[1]}px ${space[2]}px`,
                      fontSize: fontSize.sm,
                      color: "#999",
                      backgroundColor: "transparent",
                      borderRadius: 6,
                      gap: space[1],
                    }}
                  >
                    <span style={{ fontSize: 18 }}>👨‍🍳</span>
                    <span>KDS — Não instalado</span>
                    <button
                      type="button"
                      onClick={() => navigate("/app/install")}
                      style={{
                        fontSize: fontSize.sm,
                        fontWeight: 600,
                        color: "#059669",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                      }}
                    >
                      Instalar terminal
                    </button>
                  </div>
                </div>
                {operarSystems.filter((s) => s.id !== "tpv" && s.id !== "kds").length > 0 && (
                  <TreeSection
                    label=""
                    systems={operarSystems.filter((s) => s.id !== "tpv" && s.id !== "kds")}
                    activeModule={activeModule}
                    setActiveModule={setActiveModule}
                    statusIcon="○"
                    statusColor="#667eea"
                    getItemState={getOperarItemState}
                  />
                )}
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: "#555",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: space[1],
                    paddingLeft: space[1],
                  }}
                >
                  Operar
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: `${space[1]}px ${space[2]}px`,
                      fontSize: fontSize.sm,
                      color: "#999",
                      backgroundColor: "transparent",
                      borderRadius: 6,
                      gap: space[1],
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🖥️</span>
                    <span>TPV — Não instalado</span>
                    <button
                      type="button"
                      onClick={() => navigate("/app/install")}
                      style={{
                        fontSize: fontSize.sm,
                        fontWeight: 600,
                        color: "#059669",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                      }}
                    >
                      Instalar terminal
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: `${space[1]}px ${space[2]}px`,
                      fontSize: fontSize.sm,
                      color: "#999",
                      backgroundColor: "transparent",
                      borderRadius: 6,
                      gap: space[1],
                    }}
                  >
                    <span style={{ fontSize: 18 }}>👨‍🍳</span>
                    <span>KDS — Não instalado</span>
                    <button
                      type="button"
                      onClick={() => navigate("/app/install")}
                      style={{
                        fontSize: fontSize.sm,
                        fontWeight: 600,
                        color: "#059669",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                      }}
                    >
                      Instalar terminal
                    </button>
                  </div>
                </div>
                {operarSystems.filter((s) => s.id !== "tpv" && s.id !== "kds").length > 0 && (
                  <TreeSection
                    label=""
                    systems={operarSystems.filter((s) => s.id !== "tpv" && s.id !== "kds")}
                    activeModule={activeModule}
                    setActiveModule={setActiveModule}
                    statusIcon="○"
                    statusColor="#667eea"
                    getItemState={getOperarItemState}
                  />
                )}
              </div>
            )}
            <TreeSection
              label="Equipe"
              systems={equipeSystems}
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              statusIcon="✓"
              statusColor="#43e97b"
            />
            <TreeSection
              label="Gestão"
              systems={gestaoSystems}
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              statusIcon="✓"
              statusColor="#43e97b"
            />
            {/* Crescimento: colapsado por defeito; itens disabled + tooltip "Em evolução". */}
            <div>
              <button
                type="button"
                onClick={() => setCrescimentoExpanded(!crescimentoExpanded)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: space[1],
                  paddingLeft: space[1],
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: space[1],
                }}
              >
                <span style={{ fontSize: 10 }}>
                  {crescimentoExpanded ? "▼" : "▶"}
                </span>
                Crescimento (em evolução)
              </button>
              {crescimentoExpanded && (
                <TreeSection
                  label=""
                  systems={crescimentoSystems}
                  activeModule={activeModule}
                  setActiveModule={setActiveModule}
                  statusIcon="…"
                  statusColor="#999"
                  getItemState={getCrescimentoItemState}
                />
              )}
            </div>
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
            {/* Header — OPERATIONAL_HEADER_CONTRACT: restaurante + estado quando OPERATIONAL_OS */}
            <div style={{ marginBottom: "32px" }}>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  marginBottom: "4px",
                  color: "#1a1a1a",
                }}
              >
                {isOperationalOS && headerTitle
                  ? headerTitle
                  : dashboardCopy.mainTitle}
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginTop: "4px",
                  maxWidth: "560px",
                }}
              >
                {isOperationalOS && headerTitle
                  ? `${kernel.canOperate ? "Operação Pronta" : "Operação Bloqueada"} | Core ${kernel.core === "UP" ? "ON" : "OFF"} | Turno ${kernel.shift === "OPEN" ? "Aberto" : "Fechado"}`
                  : dashboardCopy.mainSubtitle}
              </p>
            </div>

            {/* Promover instalação PWA — um ícone no desktop */}
            <InstallAppPrompt compact />

            {/* OPERATIONAL_OS: primeira dobra = Operação + Estado operacional (contrato OPERATIONAL_DASHBOARD_V2) */}
            {isOperationalOS && (
              <section
                aria-label="Primeira dobra: Operação e estado"
                style={{ marginBottom: "24px", maxWidth: 480 }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <OperacaoCard onNavigate={navigate} />
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#64748b",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                >
                  Core: {kernel.core === "UP" ? "ON" : "OFF"}
                  {" · "}
                  Turno: {kernel.shift === "OPEN" ? "Aberto" : "Fechado"}
                  {" · "}
                  Terminais:{" "}
                  {kernel.terminals.status === "INSTALLED" ? "Instalados" : kernel.terminals.status === "NOT_IMPLEMENTED" ? "Não implementado" : "Não instalados"}
                </div>
                {activeShift != null && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 14px",
                      fontSize: 13,
                      color: "#475569",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                  >
                    Operador actual: {activeShift.name} —{" "}
                    {activeShift.openedBy ?? "—"}
                  </div>
                )}
              </section>
            )}

            {/* Card Estado do sistema — oculto em OPERATIONAL_OS */}
            {!isOperationalOS && (
              <EstadoDoSistemaCard style={{ marginBottom: "32px" }} />
            )}

            {/* Card Plano & Faturação — oculto em OPERATIONAL_OS */}
            {systemState === "TRIAL" && !isOperationalOS && (
              <section
                style={{
                  marginBottom: "32px",
                  padding: "20px 24px",
                  borderRadius: 14,
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1e40af",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 8,
                  }}
                >
                  💳 Plano & Faturação
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#1e3a8a",
                    margin: "0 0 16px 0",
                    lineHeight: 1.5,
                  }}
                >
                  Estás a usar o ChefIApp em modo real. Trial ativo — escolhe um
                  plano para continuar sem interrupções.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/app/billing")}
                  style={{
                    padding: "10px 18px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    backgroundColor: "#2563eb",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Ver planos e faturação
                </button>
              </section>
            )}

            {/* MENU_OPERATIONAL_STATE: sinal vital do menu. OPERATIONAL_OS: regra do contrato — "disponível para venda" só com terminais e turno. */}
            <section
              style={{
                marginBottom: "16px",
                padding: "12px 20px",
                borderRadius: 10,
                backgroundColor:
                  menuState === "LIVE"
                    ? "#f0fdf4"
                    : menuState === "VALID_UNPUBLISHED"
                    ? "#fefce8"
                    : "#f8fafc",
                border: `1px solid ${
                  menuState === "LIVE"
                    ? "#bbf7d0"
                    : menuState === "VALID_UNPUBLISHED"
                    ? "#fef08a"
                    : "#e2e8f0"
                }`,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: menuState === "LIVE" ? "#166534" : "#64748b",
                }}
              >
                {menuState === "LIVE" && "🟢 "}
                {menuState === "VALID_UNPUBLISHED" && "🟡 "}
                {menuState === "INCOMPLETE" && "🟠 "}
                {menuState === "EMPTY" && "⚪ "}
                {isOperationalOS &&
                menuState === "LIVE" &&
                !(kernel.terminals.status === "INSTALLED" && kernel.shift === "OPEN")
                  ? "Cardápio publicado."
                  : MENU_STATE_MESSAGES[menuState].short}
              </span>
            </section>

            {/* Primeira venda em poucos passos — oculto em OPERATIONAL_OS */}
            {!isOperationalOS && (
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
                  {
                    label: "6. Faturação",
                    route: "/app/billing",
                    done: systemState === "ACTIVE" ? true : undefined,
                  },
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
            )}

            {/* Painel do módulo ativo — uma única fonte de conteúdo (não grid de cards) */}
            {!activeModule ? (
              <>
                {/* Atalhos rápidos — oculto em OPERATIONAL_OS */}
                {!isOperationalOS && (
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
                )}

                {bootstrap.publishStatus === "publicado" ? (
                  <>
                    <section
                      aria-label={isOperationalOS ? "Segunda dobra: Histórico, receita, alertas" : undefined}
                      style={isOperationalOS ? { marginTop: "8px" } : undefined}
                    >
                      <OperationalMetricsCards />
                      <ShiftHistorySection />
                    </section>
                  </>
                ) : (
                  <section
                    style={{
                      marginBottom: "24px",
                      padding: "20px 24px",
                      borderRadius: 14,
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        color: "#64748b",
                        margin: 0,
                        fontWeight: 500,
                      }}
                    >
                      Complete a publicação para ver métricas e histórico de
                      turnos.
                    </p>
                  </section>
                )}

                {/* Onda 5 O5.8: alertas acionáveis no hub — resumo + atalho (segunda dobra) */}
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
                    <p
                      style={{ fontSize: "14px", color: "#475569", margin: 0 }}
                    >
                      {alertsActiveCount} ativos
                      {alertsCriticalCount > 0 && (
                        <span style={{ color: "#dc2626", fontWeight: 600 }}>
                          {" "}
                          · {displayCriticalCap}
                          {hasManyCritical ? "+" : ""} que exigem atenção
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
                      backgroundColor:
                        alertsCriticalCount > 0 ? "#dc2626" : "#64748b",
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
                    style={{
                      fontSize: "15px",
                      color: "#666",
                      marginBottom: "8px",
                    }}
                  >
                    Selecione um módulo na coluna esquerda para ver o estado e
                    as ações.
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
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
