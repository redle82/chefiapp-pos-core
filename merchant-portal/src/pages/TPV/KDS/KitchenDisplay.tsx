/**
 * ============================================================================
 * 🧪 SATURDAY NIGHT TEST MANUAL — KDS STANDALONE VALIDATION
 * ============================================================================
 *
 * OBJETIVO: Validar que o KDS funciona em cenário de cozinha real (22h, conexão instável)
 *
 * PRÉ-REQUISITOS:
 * 1. Acesse /kds/{restaurantId} no tablet/TV da cozinha
 * 2. Abra DevTools (F12) > Network tab
 *
 * TEST 1: OFFLINE 5 SEGUNDOS
 * ─────────────────────────────
 * 1. DevTools > Network > Offline ✓
 * 2. ESPERADO:
 *    - Banner vermelho "📡 SEM CONEXÃO — PEDIDOS PODEM NÃO APARECER ⚠️"
 *    - Header background vermelho escuro
 *    - Título da aba: "⚠️ OFFLINE — KDS"
 *    - Botões de ação bloqueados (não avançam status)
 * 3. Desmarque Offline
 * 4. ESPERADO:
 *    - Banner desaparece em ~1-3s
 *    - Refetch automático (ver console: "🔄 RECONNECTED")
 *    - Pedidos sincronizados
 *
 * TEST 2: OFFLINE 60 SEGUNDOS
 * ─────────────────────────────
 * 1. DevTools > Network > Offline ✓
 * 2. Aguarde 60s (durante esse tempo, crie 2-3 pedidos em outro dispositivo)
 * 3. ESPERADO durante offline:
 *    - Banner permanece visível
 *    - Título da aba permanece "⚠️ OFFLINE"
 *    - Nenhum pedido novo aparece
 * 4. Desmarque Offline
 * 5. ESPERADO:
 *    - Refetch automático
 *    - TODOS os pedidos criados durante offline aparecem
 *    - Log: "[OrderContext] 🔄 RECONNECTED - Syncing"
 *
 * TEST 3: EVENTO PERDIDO (Bug Fantasma)
 * ─────────────────────────────────────
 * 1. Com KDS online, anote quantos pedidos estão visíveis
 * 2. DevTools > Network > Offline ✓
 * 3. Crie 1 pedido em outro dispositivo (celular/outro browser)
 * 4. Desmarque Offline
 * 5. ESPERADO:
 *    - Pedido criado durante offline aparece em <5s
 *    - Garantido pelo polling defensivo de 30s (se reconexão falhar, polling pega)
 *
 * TEST 4: AÇÃO OFFLINE BLOQUEADA
 * ──────────────────────────────
 * 1. DevTools > Network > Offline ✓
 * 2. Clique em "Iniciar Preparo" em qualquer pedido
 * 3. ESPERADO:
 *    - Banner laranja: "❌ Sem conexão. Aguarde reconexão."
 *    - Nenhuma mudança no pedido
 *    - Console: "[KDS] ❌ Action blocked - offline"
 *
 * CHECKLIST FINAL:
 * ┌─────────────────────────────────────────────┬─────┐
 * │ Item                                        │ OK? │
 * ├─────────────────────────────────────────────┼─────┤
 * │ Banner offline aparece imediatamente        │     │
 * │ Header muda para vermelho                   │     │
 * │ Título da aba muda para "⚠️ OFFLINE"       │     │
 * │ Ações bloqueadas com feedback visual        │     │
 * │ Refetch automático na reconexão             │     │
 * │ Pedidos perdidos recuperados via polling    │     │
 * │ Nenhum loop de requests (check Network)     │     │
 * └─────────────────────────────────────────────┴─────┘
 *
 * AUTOR: Copilot KDS Hardening
 * DATA: 2026-01-08
 * ============================================================================
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useKitchenReflex } from "../../../intelligence/nervous-system/useKitchenReflex";
import { EmptyState } from "../../../ui/design-system/EmptyState";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../../ui/design-system/tokens";
import { useOrders } from "../context/OrderContextReal";
import type { Order } from "../../../core/contracts";
import { OrderTimer } from "./OrderTimer";
import { ItemTimer } from "./components/ItemTimer";
import { OriginBadge } from "./components/OriginBadge";
import { useBumpBar } from "./hooks/useBumpBar";
import { useNewOrderAlerts } from "./useNewOrderAlerts";

// ------------------------------------------------------------------
// 🎨 CINEMATIC COMPONENTS (Ported & Cleaned)
// ------------------------------------------------------------------

interface TicketCardProps {
  ticket: Order;
  onAdvance: (o: Order) => void;
  isUnseen?: boolean;
  isSelected?: boolean;
  onTicketClick?: () => void;
  id?: string;
  isLoading?: boolean;
}

const TicketCard = ({
  ticket,
  onAdvance,
  isUnseen = false,
  isSelected = false,
  onTicketClick,
  id,
  isLoading = false,
}: TicketCardProps) => {
  const isNew = ticket.status === "new";
  const isPreparing = ticket.status === "preparing";

  // === FASE 1: HIERARQUIA VISUAL — Determinar estado visual ===
  // Calcular tempo decorrido para detectar atraso
  const createdAtDate =
    typeof ticket.createdAt === "string"
      ? new Date(ticket.createdAt)
      : ticket.createdAt instanceof Date
      ? ticket.createdAt
      : new Date(ticket.createdAt);
  const now = Date.now();
  const createdAtTime = createdAtDate.getTime();
  const elapsedSeconds = Math.floor((now - createdAtTime) / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const isLate = elapsedMinutes > 15; // > 15min = Atrasado

  // Estados visuais distintos
  let bgColor: string;
  let borderColor: string;
  let borderWidth: number;
  let scale: number;
  let animation: string | undefined;
  let boxShadow: string;

  if (isNew) {
    // NOVO — Dourado, grande, pulsação suave
    bgColor = "#1A1A0A"; // Fundo escuro com tom dourado
    borderColor = "#FFC107"; // Dourado (#FFC107)
    borderWidth = 6;
    scale = 1.2; // 20% maior
    animation = "kds-ticket-new-pulse 2s ease-in-out infinite";
    boxShadow =
      "0 0 24px rgba(255, 193, 7, 0.4), 0 4px 12px -1px rgba(0, 0, 0, 0.3)";
  } else if (isLate) {
    // ATRASADO — Vermelho, grande, pulsação rápida
    bgColor = "#2D1212"; // Fundo escuro com tom vermelho
    borderColor = "#EF4444"; // Vermelho (#EF4444)
    borderWidth = 6;
    scale = 1.2; // 20% maior
    animation = "kds-ticket-late-pulse 1s ease-in-out infinite";
    boxShadow =
      "0 0 24px rgba(239, 68, 68, 0.5), 0 4px 12px -1px rgba(0, 0, 0, 0.3)";
  } else {
    // EM PREPARO — Azul, normal, estático
    bgColor = "#0A1A2D"; // Fundo escuro com tom azul
    borderColor = "#3B82F6"; // Azul (#3B82F6)
    borderWidth = 4;
    scale = 1.0; // Tamanho normal
    animation = undefined;
    boxShadow =
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
  }

  // Aplicar scale de seleção sobre o scale do estado
  const finalScale = isSelected ? scale * 1.02 : scale;

  return (
    <>
      <style>{`
                @keyframes kds-ticket-new-pulse {
                    0%, 100% {
                        box-shadow: 0 0 24px rgba(255, 193, 7, 0.4), 0 4px 12px -1px rgba(0, 0, 0, 0.3);
                        transform: scale(1.2);
                    }
                    50% {
                        box-shadow: 0 0 32px rgba(255, 193, 7, 0.6), 0 4px 12px -1px rgba(0, 0, 0, 0.3);
                        transform: scale(1.22);
                    }
                }
                @keyframes kds-ticket-late-pulse {
                    0%, 100% {
                        box-shadow: 0 0 24px rgba(239, 68, 68, 0.5), 0 4px 12px -1px rgba(0, 0, 0, 0.3);
                        transform: scale(1.2);
                    }
                    50% {
                        box-shadow: 0 0 36px rgba(239, 68, 68, 0.7), 0 4px 12px -1px rgba(0, 0, 0, 0.3);
                        transform: scale(1.22);
                    }
                }
            `}</style>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onTicketClick}
        className={isUnseen ? "kds-ticket-new" : ""}
        id={id}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          marginBottom: Spacing.lg,
          borderRadius: BorderRadius.md,
          overflow: "hidden",
          boxShadow: boxShadow,
          background: bgColor,
          borderLeft: `${borderWidth}px solid ${borderColor}`,
          color: Colors.kds.text.primary,
          cursor: isUnseen ? "pointer" : "default",
          transform: `scale(${finalScale})`,
          border: isSelected ? `2px solid ${Colors.info}` : "none",
          zIndex: isSelected ? 10 : isNew || isLate ? 5 : 1,
          animation: animation,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* === FASE 1: HIERARQUIA VISUAL — Badge de estado === */}
        {(isNew || isLate) && (
          <div
            className="kds-badge-state"
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              background: isNew ? "#FFC107" : "#EF4444",
              color: "#000",
              padding: "4px 12px",
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "12px",
              textTransform: "uppercase",
              boxShadow: isNew
                ? "0 2px 8px rgba(255, 193, 7, 0.6)"
                : "0 2px 8px rgba(239, 68, 68, 0.6)",
              zIndex: 10,
            }}
          >
            {isNew ? "NOVO" : "ATRASADO"}
          </div>
        )}

        <div style={{ padding: Spacing.lg }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: Spacing.sm,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontWeight: 900,
                  fontSize: Typography.uiLarge.fontSize,
                }}
              >
                #{ticket.tableNumber}
              </span>
              {/* === ORIGEM CLARA: Sempre mostrar badge de origem === */}
              <OriginBadge origin={ticket.origin || (ticket as any).origin} />
              {/* === FASE 5: ZERO RUÍDO — Remover badge "PAGO" (não é informação de cozinha) === */}
            </div>
            {/* === FASE 5: ZERO RUÍDO — Remover hora de criação (redundante com timer) === */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <OrderTimer
                createdAt={
                  typeof ticket.createdAt === "string"
                    ? ticket.createdAt
                    : ticket.createdAt.toISOString()
                }
              />
            </div>
          </div>

          {/* Items List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: Spacing.sm,
            }}
          >
            {ticket.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "bold" }}>
                  {item.quantity}x {item.name}
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {item.notes && (
                    <span
                      style={{
                        color: Colors.risk.high,
                        fontSize: "0.8em",
                        fontStyle: "italic",
                        marginRight: "8px",
                      }}
                    >
                      {item.notes}
                    </span>
                  )}
                  <ItemTimer
                    createdAt={
                      typeof ticket.createdAt === "string"
                        ? new Date(ticket.createdAt)
                        : ticket.createdAt
                    }
                    status={item.status || "pending"}
                    startedAt={item.startedAt} // already Date or undefined
                    completedAt={item.completedAt} // already Date or undefined
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === FASE 4: AÇÃO ÓBVIA — Botão claro e único === */}
        <button
          onClick={() => !isLoading && onAdvance(ticket)}
          disabled={isLoading}
          style={{
            padding: Spacing.lg,
            width: "100%",
            border: "none",
            cursor: isLoading ? "wait" : "pointer",
            background: isLoading
              ? "rgba(59, 130, 246, 0.3)" // Azul claro durante loading
              : isNew
              ? "#22C55E" // Verde para "INICIAR PREPARO"
              : "#3B82F6", // Azul para "MARCAR PRONTO"
            color: "#fff",
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: "16px",
            letterSpacing: "0.1em",
            marginTop: Spacing.md,
            borderRadius: BorderRadius.md,
            boxShadow: isLoading
              ? "0 0 12px rgba(59, 130, 246, 0.5)"
              : isSelected
              ? `0 0 12px ${Colors.info}`
              : "0 2px 8px rgba(0, 0, 0, 0.2)",
            opacity: isLoading ? 0.7 : 1,
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: Spacing.sm,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid #fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }}
              />
              <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
              <span>PROCESSANDO...</span>
            </>
          ) : (
            <span>{isNew ? "INICIAR PREPARO" : "MARCAR PRONTO"}</span>
          )}
        </button>
      </motion.div>
    </>
  );
};

// ------------------------------------------------------------------
// 🌱 MISE EN PLACE MODE (Idle State)
// ------------------------------------------------------------------

const MiseEnPlaceMode = () => {
  // In strict mode, we might not have tasks context available if not inside StaffProvider?
  // But KDS is routed inside OrderProvider, StaffProvider might be separate.
  // Let's degrade gracefully if useStaff fails or returns empty.

  // Actually, KDS route in App.tsx is NOT inside StaffProvider wrapper explicitly (it's inside OrderProvider).
  // And StaffContext errors if not inside provider.
  // SO: KDS cannot safely use useStaff unless we wrap it.
  // DECISION: Remove Staff specific tasks from KDS Idle screen to avoid crash.
  // Keep it simple: Just "Bancada Limpa".

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: Spacing.lg,
      }}
    >
      <EmptyState
        icon={<div style={{ fontSize: 64 }}>🔪</div>}
        title="Bancada Limpa"
        description="Sem pedidos ativos. Mantenha o foco."
        action={{
          label: "Atualizar",
          onClick: () => window.location.reload(),
        }}
      />
    </motion.div>
  );
};

// ------------------------------------------------------------------
// 🛡️ STATION INTELLIGENCE (Mission 55)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// 🛡️ STATION INTELLIGENCE (Mission 55 & Phase 2.2)
// ------------------------------------------------------------------

// KDS Station can be 'ALL', 'KITCHEN', 'BAR' (Legacy) or a specific UUID
type KDSStation = string;

const isBarItem = (categoryName?: string) => {
  if (!categoryName) return false;
  const n = categoryName.toLowerCase();
  return (
    n.includes("bebida") ||
    n.includes("drink") ||
    n.includes("bar") ||
    n.includes("suco") ||
    n.includes("vinho") ||
    n.includes("cerveja") ||
    n.includes("refrigerante") ||
    n.includes("água") ||
    n.includes("agua") ||
    n.includes("café") ||
    n.includes("cafe")
  );
};

// ------------------------------------------------------------------
// 👨‍🍳 MAIN KDS
// ------------------------------------------------------------------

export default function KitchenDisplay({
  initialStation = "ALL",
  forceNewVersion = false,
}: {
  initialStation?: KDSStation;
  forceNewVersion?: boolean;
}) {
  // === KDS HARDENING: Obter todos os estados de conexão ===
  const {
    orders: rawOrders,
    performOrderAction,
    isConnected,
    realtimeStatus,
    lastRealtimeEvent,
    getActiveOrders,
  } = useOrders();
  const { orders } = useKitchenReflex({ orders: rawOrders || [] }); // Safety fallback

  // === NEW ORDER ALERTS: Visual + Audio notifications ===
  const {
    unseenOrderIds,
    markSeen,
    markAllSeen,
    soundEnabled,
    toggleSound,
    initAudio,
  } = useNewOrderAlerts(orders);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // === STATION INTELLIGENCE ===
  const [station, setStation] = useState<KDSStation>(initialStation); // TODO: Persist in localStorage?
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Extract dynamic stations from active orders (auto-discovery)
  const activeDynamicStations = useMemo(() => {
    const stations = new Set<string>();
    orders.forEach((o) =>
      o.items.forEach((i) => {
        if (i.stationId) stations.add(i.stationId);
      }),
    );
    return Array.from(stations);
  }, [orders]);

  // === KDS HARDENING: Determinar se está "cego" (sem eventos realtime) ===
  // REGRA: KDS é considerado offline quando:
  //   1. Rede está down (isConnected=false), OU
  //   2. Supabase realtime não está subscribed (mesmo com rede OK)
  // MOTIVO: Cozinheiro precisa saber se pode confiar na tela
  const isRealtimeActive = realtimeStatus === "SUBSCRIBED";
  const isKDSEffectivelyOffline = !isConnected || !isRealtimeActive;
  const isReconnecting =
    (realtimeStatus === "SUBSCRIBING" || realtimeStatus === "TIMED_OUT") &&
    isConnected;

  // Verificar se último evento foi há mais de 30s (possível problema silencioso)
  const timeSinceLastEvent = lastRealtimeEvent
    ? Date.now() - lastRealtimeEvent.getTime()
    : Infinity;
  const isStale = isRealtimeActive && timeSinceLastEvent > 30000;

  // 🔴 RISK: Se ambos network e realtime reportam OK mas pedidos não chegam,
  // o polling de 30s em OrderContextReal é a última linha de defesa.

  // Staff-style browser tab title for isolated tool context
  useEffect(() => {
    document.title = isKDSEffectivelyOffline
      ? "⚠️ OFFLINE — KDS"
      : "ChefIApp POS — KDS";
    return () => {
      document.title = "ChefIApp POS";
    };
  }, [isKDSEffectivelyOffline]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === KDS HARDENING: Limpar erro após 5 segundos ===
  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Logic: Filter Active Tickets
  // MISSION 55: Apply Station Filter
  const activeTickets = useMemo(() => {
    let filtered = orders;
    if (station !== "ALL") {
      if (station === "KITCHEN") {
        filtered = orders
          .map((order) => ({
            ...order,
            items: order.items.filter((item) => {
              // Legacy Kitchen: Not Bar, and NOT assigned to a specific other station
              const isBar = isBarItem(item.categoryName);
              return !isBar && !item.stationId;
            }),
          }))
          .filter((order) => order.items.length > 0);
      } else if (station === "BAR") {
        filtered = orders
          .map((order) => ({
            ...order,
            items: order.items.filter((item) => {
              // Legacy Bar: Is Bar, and NOT assigned to a specific other station
              const isBar = isBarItem(item.categoryName);
              return isBar && !item.stationId;
            }),
          }))
          .filter((order) => order.items.length > 0);
      } else {
        // Specific Station UUID
        filtered = orders
          .map((order) => ({
            ...order,
            items: order.items.filter((item) => item.stationId === station),
          }))
          .filter((order) => order.items.length > 0);
      }
    }

    return filtered
      .filter((o) => o.status === "new" || o.status === "preparing")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }, [orders, station]);

  const hasPressure = activeTickets.length > 0;

  // === CONTROLE DE VERSÃO: Se forceNewVersion=true, sempre usar componente novo ===
  // Mesmo sem pedidos, mostrar MiseEnPlaceMode (parte do KDS novo) ao invés de fallback antigo
  if (forceNewVersion) {
    console.log(
      "[KDS] ✅ Modo forçado: KDS NOVO (sem fallback para versão antiga)",
    );
  }
  const newOrders = activeTickets.filter((o) => o.status === "new");
  const preparingOrders = activeTickets.filter((o) => o.status === "preparing");

  // === BUMP BAR NAVIGATION ===
  useBumpBar({
    onNavigate: (dir) => {
      if (activeTickets.length === 0) return;
      const currentIndex = activeTickets.findIndex(
        (o) => o.id === selectedOrderId,
      );
      let nextIndex = currentIndex;

      if (currentIndex === -1) {
        nextIndex = 0;
      } else if (dir === "right" || dir === "down") {
        nextIndex = currentIndex + 1;
        if (nextIndex >= activeTickets.length) nextIndex = 0;
      } else {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) nextIndex = activeTickets.length - 1;
      }

      const nextOrder = activeTickets[nextIndex];
      if (nextOrder) {
        setSelectedOrderId(nextOrder.id);
        // Auto-scroll logic if needed could go here
        const element = document.getElementById(`ticket-${nextOrder.id}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    onBump: () => {
      const order = activeTickets.find((o) => o.id === selectedOrderId);
      if (order) handleAdvance(order);
    },
  });

  // Auto-select first if none selected
  useEffect(() => {
    if (!selectedOrderId && activeTickets.length > 0) {
      setSelectedOrderId(activeTickets[0].id);
    }
  }, [activeTickets.length]); // Only run when count changes to avoid fighting user selection

  // === KDS HARDENING: handleAdvance com proteção e logging ===
  const handleAdvance = async (order: Order) => {
    // PROTEÇÃO: Não executar ação se offline
    if (isKDSEffectivelyOffline) {
      console.error("[KDS] ❌ Action blocked - offline");
      setActionError("Sem conexão. Aguarde reconexão.");
      return;
    }

    // === FASE 4: AÇÃO ÓBVIA — Estado de loading ===
    setLoadingOrderId(order.id);
    setActionError(null);

    try {
      if (order.status === "new") {
        console.log("[KDS] 🍳 Advancing order to PREP:", order.id);
        await performOrderAction(order.id, "prepare");
      } else if (order.status === "preparing") {
        console.log("[KDS] ✅ Marking order READY:", order.id);
        await performOrderAction(order.id, "ready");
      }
      // Sucesso: loading será removido quando o pedido atualizar via realtime
    } catch (err: any) {
      // === HARDENING: Log visível de erro ===
      console.error("[KDS] ❌ Action failed:", err);
      setActionError(err.message || "Erro ao atualizar pedido");
      setLoadingOrderId(null); // Remove loading em caso de erro
    }
  };

  // === FASE 4: AÇÃO ÓBVIA — Remover loading quando pedido atualizar ===
  useEffect(() => {
    // Se o pedido mudou de status, remove loading
    if (loadingOrderId) {
      const order = orders.find((o) => o.id === loadingOrderId);
      if (order && order.status !== "new" && order.status !== "preparing") {
        setLoadingOrderId(null);
      }
    }
  }, [orders, loadingOrderId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: Colors.kds.background,
        color: Colors.kds.text.primary,
        display: "flex",
        flexDirection: "column",
        fontFamily: Typography.fontFamily,
      }}
    >
      {/* === KDS HARDENING: BANNER OFFLINE PROEMINENTE === */}
      {isKDSEffectivelyOffline && (
        <div
          style={{
            background: "linear-gradient(90deg, #dc2626, #b91c1c)",
            color: "#fff",
            padding: "16px 24px",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "20px",
            letterSpacing: "0.1em",
            animation: "pulse-fast 1.5s ease-in-out infinite",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📡</span>
          <span>SEM CONEXÃO — PEDIDOS PODEM NÃO APARECER</span>
          <span style={{ fontSize: "24px" }}>⚠️</span>
        </div>
      )}

      {/* === KDS HARDENING: BANNER DE ERRO DE AÇÃO === */}
      {actionError && (
        <div
          style={{
            background: "#f97316",
            color: "#fff",
            padding: "12px 24px",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          ❌ {actionError}
        </div>
      )}

      {/* HERMETIC HEADER */}
      <header
        style={{
          height: "64px",
          borderBottom: `1px solid ${
            isKDSEffectivelyOffline ? Colors.risk.high : Colors.kds.border
          }`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${Spacing["xl"]}`,
          background: isKDSEffectivelyOffline ? "#3d0c0c" : "rgba(0,0,0,0.5)", // Dark red tint if offline
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: Spacing.lg }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: isKDSEffectivelyOffline
                ? Colors.risk.high
                : hasPressure
                ? Colors.risk.high
                : Colors.risk.low,
              boxShadow: `0 0 10px ${
                isKDSEffectivelyOffline
                  ? Colors.risk.high
                  : hasPressure
                  ? Colors.risk.high
                  : Colors.risk.low
              }`,
              animation: isKDSEffectivelyOffline
                ? "pulse-fast 1s infinite"
                : "none",
            }}
          />
          <h1
            style={{
              fontSize: Typography.h3.fontSize,
              fontWeight: "bold",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: Colors.kds.text.secondary,
            }}
          >
            {isKDSEffectivelyOffline
              ? "🚧 OFFLINE — AGUARDANDO CONEXÃO 🚧"
              : hasPressure
              ? "Produção"
              : "Mise en Place"}
          </h1>
          {/* === UNSEEN ORDERS BADGE === */}
          {unseenOrderIds.size > 0 && (
            <button
              onClick={markAllSeen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                padding: "6px 16px",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer",
                animation: "kds-badge-bounce 0.6s ease-in-out infinite",
              }}
            >
              🔔 {unseenOrderIds.size} NOVO{unseenOrderIds.size > 1 ? "S" : ""}
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: Spacing.lg }}>
          {/* === STATION TOGGLE (Mission 55 & Phase 2.2) === */}
          <div
            style={{
              display: "flex",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "8px",
              padding: "2px",
              gap: "2px",
            }}
          >
            {/* Dynamic Station Buttons */}
            {["ALL", "KITCHEN", "BAR", ...activeDynamicStations].map((s) => {
              let label = s;
              if (s === "ALL") label = "TODOS";
              else if (s === "KITCHEN") label = "COZINHA";
              else if (s === "BAR") label = "BAR";
              else label = `STATION ${s.substring(0, 4).toUpperCase()}`;

              return (
                <button
                  key={s}
                  onClick={() => setStation(s)}
                  style={{
                    background:
                      station === s
                        ? s === "BAR"
                          ? Colors.info
                          : Colors.risk.medium
                        : "transparent",
                    color: station === s ? "#fff" : Colors.kds.text.dim,
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "12px",
                    transition: "all 0.2s ease",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* === SOUND TOGGLE === */}
          <button
            onClick={() => {
              initAudio(); // Initialize audio on first interaction
              toggleSound();
            }}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
            style={{
              background: soundEnabled ? "#22c55e" : "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
          >
            {soundEnabled ? "🔊" : "🔇"}
            <span style={{ fontSize: "12px", fontWeight: "bold" }}>
              {soundEnabled ? "ON" : "OFF"}
            </span>
          </button>
          {/* === FASE 5: ZERO RUÍDO — Simplificar status de conexão (apenas indicador visual) === */}
          <div
            style={{ display: "flex", alignItems: "center", gap: Spacing.sm }}
          >
            {isKDSEffectivelyOffline ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: Colors.risk.high,
                }}
              >
                <span style={{ fontSize: "16px" }}>🔴</span>
              </div>
            ) : isStale ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: Colors.risk.medium,
                }}
              >
                <span style={{ fontSize: "16px" }}>⚠️</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: Colors.risk.low,
                }}
              >
                <span style={{ fontSize: "16px" }}>🟢</span>
              </div>
            )}
          </div>
          {/* === FASE 5: ZERO RUÍDO — Remover hora atual (redundante, já tem timer nos tickets) === */}
        </div>
      </header>

      {/* CONTENT AREA */}
      <main style={{ flex: 1, overflow: "hidden", padding: Spacing.xl }}>
        <AnimatePresence mode="wait">
          {!hasPressure ? (
            <MiseEnPlaceMode key="idle" />
          ) : (
            <motion.div
              key="production"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: Spacing["2xl"],
                height: "100%",
              }}
            >
              {/* LANE 1: NOVOS */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <h2
                  style={{
                    fontSize: Typography.uiTiny.fontSize,
                    fontWeight: "bold",
                    color: Colors.risk.medium,
                    marginBottom: Spacing.lg,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  Novos Pedidos <span>{newOrders.length}</span>
                </h2>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: Spacing.sm,
                    paddingBottom: Spacing["4xl"],
                  }}
                >
                  {newOrders.map((t) => (
                    <TicketCard
                      key={t.id}
                      ticket={t}
                      id={`ticket-${t.id}`}
                      onAdvance={handleAdvance}
                      isUnseen={unseenOrderIds.has(t.id)}
                      isSelected={selectedOrderId === t.id}
                      onTicketClick={() => {
                        markSeen(t.id);
                        setSelectedOrderId(t.id);
                      }}
                      isLoading={loadingOrderId === t.id}
                    />
                  ))}
                  {newOrders.length === 0 && (
                    <div
                      style={{
                        color: Colors.kds.text.dim,
                        textAlign: "center",
                        paddingTop: Spacing["2xl"],
                        fontStyle: "italic",
                      }}
                    >
                      A aguardar entrada...
                    </div>
                  )}
                </div>
              </div>

              {/* LANE 2: PREPARANDO */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  borderLeft: `1px solid ${Colors.kds.border}`,
                  paddingLeft: Spacing["2xl"],
                }}
              >
                <h2
                  style={{
                    fontSize: Typography.uiTiny.fontSize,
                    fontWeight: "bold",
                    color: Colors.info,
                    marginBottom: Spacing.lg,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  Em Preparação <span>{preparingOrders.length}</span>
                </h2>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: Spacing.sm,
                    paddingBottom: Spacing["4xl"],
                  }}
                >
                  {preparingOrders.map((t) => (
                    <TicketCard
                      key={t.id}
                      id={`ticket-${t.id}`}
                      ticket={t}
                      onAdvance={handleAdvance}
                      isSelected={selectedOrderId === t.id}
                      onTicketClick={() => setSelectedOrderId(t.id)}
                      isLoading={loadingOrderId === t.id}
                    />
                  ))}
                  {preparingOrders.length === 0 && (
                    <div
                      style={{
                        color: Colors.kds.text.dim,
                        textAlign: "center",
                        paddingTop: Spacing["2xl"],
                        fontStyle: "italic",
                      }}
                    >
                      Bancada livre.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
