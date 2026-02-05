/**
 * APPSTAFF MINIMAL — Garçom / Staff
 *
 * UI mínima: MiniKDSMinimal + MiniTPVMinimal + Tarefas.
 * Visual: VPC (escuro, botões grandes, espaçamento generoso).
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { InstallAppPrompt } from "../../components/pwa/InstallAppPrompt";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { readActiveOrders } from "../../core-boundary/readers/OrderReader";
import { readOpenTasks } from "../../core-boundary/readers/TaskReader";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { getStaffCopy } from "../../core/roles";
import { useRole } from "../../core/roles/RoleContext";
import { canAccessPath } from "../../core/roles/rolePermissions";
import {
  getTabIsolated,
  removeTabIsolated,
  setTabIsolated,
} from "../../core/storage/TabIsolatedStorage";
import { ToastContainer, useToast } from "../../ui/design-system/Toast";
import { TaskPanel } from "../KDSMinimal/TaskPanel";
import { GamificationPanel } from "./components/GamificationPanel";
import { MiniKDSMinimal } from "./components/MiniKDSMinimal";
import { MiniTPVMinimal } from "./components/MiniTPVMinimal";

const ROLE_DENIED_MESSAGE = "Acesso restrito ao seu papel.";
const STAFF_COPY = getStaffCopy();

/** Chave de turno mínimo (CORE_TIME_AND_TURN_CONTRACT). Até haver Core/backend, estado em TabIsolated. */
const MINIMAL_TURN_KEY = "chefiapp_minimal_worker_name";
const MINIMAL_TURN_AT_KEY = "chefiapp_minimal_checked_in_at";

/** Fallback dev (CORE_APPSTAFF_IDENTITY_CONTRACT). */
const DEFAULT_RESTAURANT_ID = "bbce08c7-63c0-473d-b693-ec2997f73a68";

/** Ecrã de entrada em turno (CORE_TIME_AND_TURN_CONTRACT). Até haver Core/backend, nome local. */
function MinimalCheckInScreen({
  onCheckIn,
  vpc,
  canGoToDashboard,
  onGoToDashboard,
}: {
  onCheckIn: (name: string) => void;
  vpc: typeof VPC_STYLE;
  canGoToDashboard: boolean;
  onGoToDashboard: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      {canGoToDashboard && (
        <button
          type="button"
          onClick={onGoToDashboard}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            padding: "8px 12px",
            fontSize: 14,
            color: vpc.textMuted,
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Voltar ao Dashboard
        </button>
      )}
      <h1
        style={{
          fontSize: vpc.fontSizeLarge,
          fontWeight: 700,
          margin: "0 0 8px 0",
          color: vpc.text,
          textAlign: "center",
        }}
      >
        Entrar em turno
      </h1>
      <p
        style={{
          fontSize: vpc.fontSizeBase,
          color: vpc.textMuted,
          margin: "0 0 24px 0",
          textAlign: "center",
        }}
      >
        Identifique-se para aceder ao KDS, TPV e tarefas.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onCheckIn(name)}
        placeholder="Seu nome"
        autoFocus
        style={{
          width: "100%",
          padding: 14,
          fontSize: vpc.fontSizeBase,
          color: vpc.text,
          backgroundColor: vpc.surface,
          border: `1px solid ${vpc.border}`,
          borderRadius: vpc.radius,
          marginBottom: 16,
          boxSizing: "border-box",
        }}
      />
      <button
        type="button"
        onClick={() => onCheckIn(name)}
        disabled={!name.trim()}
        style={{
          width: "100%",
          padding: 14,
          minHeight: vpc.btnMinHeight,
          fontSize: vpc.fontSizeBase,
          fontWeight: 600,
          color: "#fff",
          backgroundColor: name.trim() ? vpc.accent : vpc.border,
          border: "none",
          borderRadius: vpc.radius,
          cursor: name.trim() ? "pointer" : "not-allowed",
        }}
      >
        Entrar em turno
      </button>
    </div>
  );
}

const VPC_STYLE = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 24,
  spaceLg: 32,
  btnMinHeight: 48,
  fontSizeBase: 16,
  fontSizeLarge: 20,
  lineHeight: 1.6,
} as const;
const VPC = VPC_STYLE;

export function AppStaffMinimal() {
  const { identity } = useRestaurantIdentity();
  const { role } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const canGoToDashboard = canAccessPath(role, "/dashboard");
  const { toasts, dismiss, warning } = useToast();
  const roleDeniedShown = useRef(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"kds" | "tarefas" | "pontos">(
    "kds"
  );
  // Estado de turno (CORE_TIME_AND_TURN_CONTRACT): em turno = workerName preenchido
  const [workerName, setWorkerName] = useState<string | null>(
    () => getTabIsolated(MINIMAL_TURN_KEY) || null
  );
  const [checkedInAt, setCheckedInAt] = useState<string | null>(
    () => getTabIsolated(MINIMAL_TURN_AT_KEY) || null
  );
  // Métricas de consciência (CORE_OPERATIONAL_AWARENESS_CONTRACT) e alertas (tarefas abertas)
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [metrics, setMetrics] = useState<{
    delayed: number;
    queue: number;
    pressure: "baixa" | "média" | "alta";
  }>({ delayed: 0, queue: 0, pressure: "baixa" });

  const { runtime } = useRestaurantRuntime();

  // Id para leituras (evita "before initialization" nos effects)
  const restaurantIdOrDefault = restaurantId ?? DEFAULT_RESTAURANT_ID;

  useEffect(() => {
    if (location.state?.reason === "role_denied" && !roleDeniedShown.current) {
      roleDeniedShown.current = true;
      warning(ROLE_DENIED_MESSAGE);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.reason, location.pathname, navigate, warning]);

  useEffect(() => {
    const id =
      identity.id ||
      getTabIsolated("chefiapp_restaurant_id") ||
      DEFAULT_RESTAURANT_ID;
    setRestaurantId(id);
    setLoading(false);
  }, [identity.id]);

  useEffect(() => {
    const load = async () => {
      try {
        if (runtime.loading || !runtime.coreReachable) {
          setOpenTaskCount(0);
          return;
        }
        const tasks = await readOpenTasks(restaurantIdOrDefault);
        setOpenTaskCount(tasks.length);
      } catch {
        setOpenTaskCount(0);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [restaurantIdOrDefault, runtime.loading, runtime.coreReachable]);

  useEffect(() => {
    const load = async () => {
      try {
        const orders = await readActiveOrders(restaurantIdOrDefault);
        const now = Date.now();
        const DELAY_MINUTES = 15;
        const inProgress = orders.filter(
          (o) => o.status === "OPEN" || o.status === "IN_PREP"
        );
        const delayed = inProgress.filter((o) => {
          const created = new Date(o.created_at).getTime();
          return (now - created) / 60000 > DELAY_MINUTES;
        }).length;
        const queue = inProgress.length;
        const pressure: "baixa" | "média" | "alta" =
          delayed > 2 || queue > 4
            ? "alta"
            : delayed > 0 || queue > 2
            ? "média"
            : "baixa";
        setMetrics({ delayed, queue, pressure });
      } catch {
        setMetrics({ delayed: 0, queue: 0, pressure: "baixa" });
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [restaurantIdOrDefault]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: VPC.spaceLg,
          backgroundColor: VPC.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          color: VPC.textMuted,
          fontSize: VPC.fontSizeBase,
        }}
      >
        <p style={{ margin: 0, opacity: 0.9 }}>A carregar...</p>
      </div>
    );
  }

  const handleCheckIn = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const at = new Date().toISOString();
    setWorkerName(trimmed);
    setCheckedInAt(at);
    setTabIsolated(MINIMAL_TURN_KEY, trimmed);
    setTabIsolated(MINIMAL_TURN_AT_KEY, at);
  };

  const handleCheckOut = () => {
    setWorkerName(null);
    setCheckedInAt(null);
    removeTabIsolated(MINIMAL_TURN_KEY);
    removeTabIsolated(MINIMAL_TURN_AT_KEY);
  };

  const formatCheckedInAt = (iso: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  // Porta de check-in (CORE_TIME_AND_TURN_CONTRACT): sem turno = mostrar ecrã de entrada
  if (!workerName) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: VPC.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          color: VPC.text,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: VPC.spaceLg,
        }}
      >
        <InstallAppPrompt compact />
        <MinimalCheckInScreen
          onCheckIn={handleCheckIn}
          vpc={VPC}
          canGoToDashboard={canGoToDashboard}
          onGoToDashboard={() => navigate("/dashboard")}
        />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: VPC.bg,
        fontFamily: "Inter, system-ui, sans-serif",
        color: VPC.text,
        lineHeight: VPC.lineHeight,
        padding: VPC.spaceLg,
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <InstallAppPrompt compact />
        <header style={{ marginBottom: VPC.space }}>
          {canGoToDashboard && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                padding: "10px 14px",
                fontSize: 15,
                fontWeight: 600,
                color: VPC.text,
                backgroundColor: VPC.surface,
                border: `1px solid ${VPC.border}`,
                borderRadius: VPC.radius,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = VPC.accent;
                e.currentTarget.style.borderColor = VPC.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = VPC.text;
                e.currentTarget.style.borderColor = VPC.border;
              }}
            >
              ← Voltar ao Dashboard
            </button>
          )}
          <h1
            style={{
              fontSize: VPC.fontSizeLarge,
              fontWeight: 700,
              margin: "0 0 8px 0",
              color: VPC.text,
              letterSpacing: "-0.02em",
            }}
          >
            {STAFF_COPY.title}
          </h1>
          <p
            style={{
              fontSize: VPC.fontSizeBase,
              color: VPC.textMuted,
              margin: "0 0 4px 0",
            }}
          >
            {STAFF_COPY.subtitle}
          </p>
          <p style={{ fontSize: 14, color: VPC.textMuted, margin: 0 }}>
            Restaurante: {restaurantIdOrDefault.slice(0, 8)}…
          </p>
          {/* Estado de turno (CORE_TIME_AND_TURN_CONTRACT) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${VPC.border}`,
            }}
          >
            <span style={{ fontSize: 14, color: VPC.accent, fontWeight: 600 }}>
              Em turno: {workerName}
            </span>
            <span style={{ fontSize: 13, color: VPC.textMuted }}>
              Papel:{" "}
              {role === "owner"
                ? "Dono"
                : role === "manager"
                ? "Gerente"
                : "Staff"}
            </span>
            {checkedInAt && (
              <span style={{ fontSize: 13, color: VPC.textMuted }}>
                Entrada às {formatCheckedInAt(checkedInAt)}
              </span>
            )}
            <button
              type="button"
              onClick={handleCheckOut}
              style={{
                marginLeft: "auto",
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 500,
                color: VPC.textMuted,
                backgroundColor: "transparent",
                border: `1px solid ${VPC.border}`,
                borderRadius: VPC.radius,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.borderColor = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = VPC.textMuted;
                e.currentTarget.style.borderColor = VPC.border;
              }}
            >
              Sair de turno
            </button>
          </div>
        </header>

        {/* Métricas de consciência (CORE_OPERATIONAL_AWARENESS_CONTRACT) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: VPC.space,
            padding: "10px 14px",
            backgroundColor: VPC.surface,
            borderRadius: VPC.radius,
            border: `1px solid ${VPC.border}`,
            fontSize: 14,
            color: VPC.textMuted,
          }}
        >
          <span>
            Atrasados:{" "}
            <strong
              style={{ color: metrics.delayed > 0 ? "#ef4444" : VPC.text }}
            >
              {metrics.delayed}
            </strong>
          </span>
          <span>
            Fila: <strong style={{ color: VPC.text }}>{metrics.queue}</strong>
          </span>
          <span>
            Pressão:{" "}
            <strong
              style={{
                color:
                  metrics.pressure === "alta"
                    ? "#ef4444"
                    : metrics.pressure === "média"
                    ? "#eab308"
                    : VPC.accent,
              }}
            >
              {metrics.pressure}
            </strong>
          </span>
        </div>

        {/* Visibilidade financeira (CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT) — placeholder até Core expor */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: VPC.space,
            padding: "10px 14px",
            backgroundColor: VPC.surface,
            borderRadius: VPC.radius,
            border: `1px dashed ${VPC.border}`,
            fontSize: 14,
            color: VPC.textMuted,
          }}
        >
          <span>
            Ticket médio do turno:{" "}
            <strong style={{ color: VPC.text }}>—</strong>
          </span>
          {(role === "manager" || role === "owner") && (
            <span>
              Resumo turno: <strong style={{ color: VPC.text }}>—</strong>
            </span>
          )}
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            (quando o Core expuser)
          </span>
        </div>

        {/* Tabs — VPC: accent verde, min-height 48px */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: VPC.space,
            borderBottom: `2px solid ${VPC.border}`,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("kds")}
            style={{
              padding: "12px 24px",
              minHeight: VPC.btnMinHeight,
              fontSize: VPC.fontSizeBase,
              fontWeight: activeTab === "kds" ? 700 : 400,
              border: "none",
              borderBottom:
                activeTab === "kds"
                  ? `2px solid ${VPC.accent}`
                  : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: activeTab === "kds" ? VPC.accent : VPC.textMuted,
            }}
          >
            📋 {STAFF_COPY.tabAction}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tarefas")}
            style={{
              padding: "12px 24px",
              minHeight: VPC.btnMinHeight,
              fontSize: VPC.fontSizeBase,
              fontWeight: activeTab === "tarefas" ? 700 : 400,
              border: "none",
              borderBottom:
                activeTab === "tarefas"
                  ? `2px solid ${VPC.accent}`
                  : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: activeTab === "tarefas" ? VPC.accent : VPC.textMuted,
            }}
          >
            🧠 Tarefas{openTaskCount > 0 ? ` (${openTaskCount})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pontos")}
            style={{
              padding: "12px 24px",
              minHeight: VPC.btnMinHeight,
              fontSize: VPC.fontSizeBase,
              fontWeight: activeTab === "pontos" ? 700 : 400,
              border: "none",
              borderBottom:
                activeTab === "pontos"
                  ? `2px solid ${VPC.accent}`
                  : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: activeTab === "pontos" ? VPC.accent : VPC.textMuted,
            }}
          >
            🏆 Pontos
          </button>
        </div>

        {activeTab === "kds" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: VPC.space,
              marginTop: VPC.space,
            }}
          >
            <div>
              <MiniKDSMinimal
                restaurantId={restaurantIdOrDefault}
                maxHeight="600px"
              />
            </div>
            <div>
              <MiniTPVMinimal
                restaurantId={restaurantIdOrDefault}
                maxHeight="600px"
              />
            </div>
          </div>
        )}

        {activeTab === "tarefas" && (
          <div style={{ marginTop: VPC.space }}>
            <TaskPanel
              restaurantId={restaurantIdOrDefault}
              onTaskAcknowledged={(taskId) => {
                console.log("Tarefa reconhecida:", taskId);
              }}
            />
          </div>
        )}

        {activeTab === "pontos" && (
          <div style={{ marginTop: VPC.space }}>
            <GamificationPanel />
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
