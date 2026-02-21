/**
 * KDS MINIMAL — FASE 2
 *
 * UI mínima para listar pedidos. VPC: escuro, botões grandes, tipografia clara.
 * MENU_DERIVATIONS: KDS consome apenas product_id + nome; zero preço na UI/lógica.
 *
 * CONTRATOS (anti-regressão): docs/contracts/KDS_LAYOUT_UX_CONTRACT.md, docs/contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md.
 * Resumo: layout flex column, um único scroll na lista (flex:1 minHeight:0), sem barra preta; activeOnly (sem READY/CLOSED);
 * tabs Todas/Cozinha/Bar; secções COZINHA e BAR em cada card; OriginBadge com createdByRole/tableNumber; log só quando nº pedidos muda.
 *
 * FLUXO PRINCIPAL
 * 1. useOperationalReadiness("KDS") → BlockingScreen/Redirect se não pronto; shift.refreshShiftStatus ao montar.
 * 2. restaurantId: instalado (getKdsRestaurantId) > runtime > TabIsolated > DEFAULT.
 * 3. loadOrders(false) → readActiveOrders + readOrderItems por pedido; loadTasks em paralelo; polling (5s instalado/DEBUG, 30s operação real).
 * 4. Lista: pedidos filtrados por stationFilter (ALL | BAR | KITCHEN); status por item via calculateOrderStatus(order, items).
 * 5. Ações: handleStartPreparation(orderId) → updateOrderStatus(IN_PREP); handleMarkItemReady(itemId) → markItemReady → refresh.
 *
 * GUARDS CRÍTICOS (ordem de bloqueio)
 * - canOperate = readiness.ready; se false, orders = [] e return.
 * - Bootstrap: se !installedKdsRestaurantId && !DEBUG: coreStatus === "online" e operationMode === "operacao-real" para loadOrders/polling; senão lista vazia ou TrialGuideExplicativoCard / "Complete bootstrap" / "Core online".
 * - hasNoIdentity: sem instalado/runtime/storage → "KDS não instalado" + link /admin/devices.
 * - globalUI: isLoadingCritical → loading; isError → erro + retry; isEmpty → empty_orders.
 *
 * DEPENDÊNCIAS REAIS
 * - OrderReader (infra): readActiveOrders(restaurantId), readOrderItems(orderId) — Docker Core.
 * - TaskReader: readOpenTasks(restaurantId).
 * - OrderWriter (infra): updateOrderStatus(orderId, "IN_PREP", restaurantId), markItemReady(itemId, restaurantId).
 * - useOperationalReadiness("KDS"), useShift, useBootstrapState, useRestaurantRuntime (coreReachable para loadOrders).
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { DevicePairingView } from "../../features/auth/connectByCode/DevicePairingView";
// FASE 3.5: Migrado para OrderReader (usa dockerCoreClient)
import { CONFIG } from "../../config";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { isDockerBackend } from "../../core/infra/backendAdapter";
import { updateOrderStatus as coreUpdateOrderStatus } from "../../core/infra/CoreOrdersApi";
import {
  BlockingScreen,
  DeviceBlockedScreen,
  useDeviceGate,
  useOperationalReadiness,
} from "../../core/readiness";
import { useShift } from "../../core/shift/ShiftContext";
import {
  getInstalledDevice,
  getKdsRestaurantId,
} from "../../core/storage/installedDeviceStorage";
import { TerminalEngine } from "../../core/terminal/TerminalEngine";
import { useBootstrapState } from "../../hooks/useBootstrapState";
import type { CoreOrderItem, CoreTask } from "../../infra/docker-core/types";
import { isNetworkError } from "../../infra/menuPilotFallback";
import {
  readActiveOrders,
  readOrderItems,
  type ActiveOrderRow,
} from "../../infra/readers/OrderReader";
import { readOpenTasks } from "../../infra/readers/TaskReader";
import { markItemReady } from "../../infra/writers/OrderWriter";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { toUserMessage } from "../../ui/errors";
import { RestaurantLogo } from "../../ui/RestaurantLogo";
import { TPVStateDisplay } from "../TPV/components/TPVStateDisplay";
import { ItemTimer } from "./ItemTimer";
import {
  calculateOrderStatus,
  type OrderStatusResult,
} from "./OrderStatusCalculator";
import { OriginBadge } from "./OriginBadge";
import { TaskPanel } from "./TaskPanel";

/** Seed do Core Docker (06-seed-enterprise). Usar literal para não depender de isDockerBackend() no load do módulo. */
const SEED_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

/** Fallback quando backend não é Docker (Supabase). */
const DEFAULT_RESTAURANT_ID = isDockerBackend()
  ? SEED_RESTAURANT_ID
  : "bbce08c7-63c0-473d-b693-ec2997f73a68";

const VPC = {
  bg: "#111",
  surface: "#171717",
  surfaceAlt: "#1e1e1e",
  surfaceDim: "#141414",
  border: "rgba(255,255,255,0.06)",
  borderSolid: "#262626",
  text: "#fafafa",
  textMuted: "#8a8a8a",
  textDim: "#737373",
  accent: "#f97316",
  accentSoft: "rgba(249,115,22,0.15)",
  radius: 8,
  space: 24,
  btnMinHeight: 48,
  fontSizeBase: 16,
  fontSizeLarge: 20,
} as const;

/** Pure: resolve restaurantId para KDS (instalado > runtime > storage > default). Runtime prevalece para alinhar com TPV/Core. */
function resolveKdsRestaurantId(
  installedId: string | null,
  runtimeId: string | null | undefined,
  storageId: string | null,
  defaultId: string,
): string {
  if (installedId) return installedId;
  if (runtimeId) return runtimeId;
  return storageId ?? defaultId;
}

/** Pure: deve carregar/polling de pedidos (Core online + operação real, ou dispositivo instalado / DEBUG, ou Core Docker). */
function shouldLoadKdsOrders(
  installedId: string | null,
  debugDirect: boolean,
  coreStatus: string,
  operationMode: string,
): boolean {
  if (installedId || debugDirect) return true;
  if (coreStatus === "online" && operationMode === "operacao-real") return true;
  // Core Docker local: sempre tentar carregar (TPV→KDS; health pode ainda não ter atualizado)
  if (isDockerBackend()) return true;
  return false;
}

/** Pure: filtra pedidos por estação (ALL = todos; BAR/KITCHEN = só itens dessa estação). KDS_BAR_COZINHA_STATION_CONTRACT §5 — não remover. */
function filterOrdersByStation<T extends { items: CoreOrderItem[] }>(
  orders: T[],
  stationFilter: "ALL" | "BAR" | "KITCHEN",
): T[] {
  if (stationFilter === "ALL") return orders;
  return orders
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => item.station === stationFilter),
    }))
    .filter((order) => order.items.length > 0);
}

export function KDSMinimal() {
  const { identity } = useRestaurantIdentity();
  const readiness = useOperationalReadiness("KDS");
  const { runtime } = useRestaurantRuntime();
  const globalUI = useGlobalUIState();
  const bootstrap = useBootstrapState();
  const shift = useShift();

  // DEBUG: Log identity loading state and logo
  useEffect(() => {
    console.log("[KDS] Identity state:", {
      id: identity.id,
      name: identity.name,
      loading: identity.loading,
      logoUrl: identity.logoUrl,
      logoUrlExists: !!identity.logoUrl,
    });
  }, [identity]);

  // Lei do Turno: ao montar o KDS, ler estado do turno na fonte única (Core) para não mostrar "turno fechado" em cache.
  // useLayoutEffect para disparar o refresh antes do paint e permitir que ORE trate isChecking como loading.
  useLayoutEffect(() => {
    shift?.refreshShiftStatus?.();
  }, []);

  useEffect(() => {
    document.title = identity.name
      ? `${identity.name} — KDS`
      : "KDS — Pedidos ativos";
  }, [identity.name]);

  // Hooks sempre no topo (regra do React): nunca após early return.
  const [orders, setOrders] = useState<
    (ActiveOrderRow & { items: CoreOrderItem[] })[]
  >([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [markingItem, setMarkingItem] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("DISCONNECTED");
  const [stationFilter, setStationFilter] = useState<"ALL" | "BAR" | "KITCHEN">(
    "ALL",
  );
  const [activeTab, setActiveTab] = useState<"ALL" | "BAR" | "KITCHEN">("ALL");
  const [tasks, setTasks] = useState<CoreTask[]>([]);
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const ordersRef = useRef<number>(0);

  // Em localhost + Docker: SEMPRE seed (TPV e KDS no mesmo restaurante; evita 1a35f047/cache).
  const installedKdsRestaurantId = getKdsRestaurantId();
  const storageId = getTabIsolated("chefiapp_restaurant_id");
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const restaurantId =
    isLocalhost && isDockerBackend() && !runtime?.restaurant_id
      ? SEED_RESTAURANT_ID
      : isLocalhost
      ? runtime?.restaurant_id ?? SEED_RESTAURANT_ID
      : isDockerBackend()
      ? runtime?.restaurant_id ?? DEFAULT_RESTAURANT_ID
      : resolveKdsRestaurantId(
          installedKdsRestaurantId,
          runtime?.restaurant_id,
          storageId,
          DEFAULT_RESTAURANT_ID,
        );
  const canOperate = readiness.ready;

  // CONFIG_RUNTIME_CONTRACT: Device Gate — KDS só opera com dispositivo ativo na Config (docs/contracts/CONFIG_RUNTIME_CONTRACT.md §2.2, §2.3).
  const deviceGate = useDeviceGate(restaurantId);

  const hasNoIdentity =
    !installedKdsRestaurantId && !runtime?.restaurant_id && !storageId;

  // Função para carregar tarefas (B4: em erro não bloquear UI; tasks = [] é aceitável)
  const loadTasks = async () => {
    // Fail-fast: se o Core estiver em baixo, não tentar ler gm_tasks.
    if (runtime.loading || !runtime.coreReachable) {
      setTasks([]);
      return;
    }
    try {
      const openTasks = await readOpenTasks(restaurantId);
      setTasks(openTasks);
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
      setTasks([]);
    }
  };

  // Função para carregar pedidos (B4: fallback rede → lista vazia + mensagem neutra; toUserMessage em catch)
  const loadOrders = async (isBackground = false) => {
    try {
      if (runtime.loading) {
        if (!isBackground) globalUI.setScreenLoading(false);
        return;
      }
      // Core Docker: tentar fetch mesmo se coreReachable ainda não atualizou (health check async)
      const skipReachability = isDockerBackend();
      if (!skipReachability && !runtime.coreReachable) {
        if (!isBackground) globalUI.setScreenLoading(false);
        return;
      }
      if (!isBackground) {
        globalUI.setScreenLoading(true);
      }
      globalUI.setScreenError(null);

      const activeOrders = await readActiveOrders(restaurantId);

      const ordersWithItems = await Promise.all(
        activeOrders.map(async (order) => {
          const items = await readOrderItems(order.id);
          return { ...order, items };
        }),
      );

      setOrders(ordersWithItems);
      globalUI.setScreenEmpty(ordersWithItems.length === 0);
      // KDS_LAYOUT_UX_CONTRACT §7: log só quando número de pedidos muda (evitar spam em DEV)
      if (import.meta.env.DEV) {
        const prevCount = ordersRef.current;
        ordersRef.current = ordersWithItems.length;
        if (prevCount !== ordersWithItems.length) {
          console.log(
            `[KDS] loadOrders: ${
              ordersWithItems.length
            } pedido(s) ativo(s) para restaurante ${restaurantId.slice(0, 8)}…`,
          );
        }
      }
      await loadTasks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (import.meta.env.DEV) {
        console.warn("[KDS] loadOrders failed:", msg, err);
      }
      setOrders([]);
      globalUI.setScreenEmpty(true);
      // Mostrar erro sempre (incl. rede) para o utilizador saber que falhou e poder repetir
      const userMsg = isNetworkError(err)
        ? "Não foi possível ligar ao Core. Verifique se o Docker Core está a correr e clique em Repetir."
        : toUserMessage(err, "Erro ao carregar pedidos. Tente novamente.");
      globalUI.setScreenError(userMsg);
    } finally {
      if (!isBackground) {
        globalUI.setScreenLoading(false);
      }
    }
  };

  useEffect(() => {
    setRealtimeStatus("CLOSED"); // B4: realtime desativado; UI mostra "Modo Piloto"

    if (!canOperate) {
      setOrders([]);
      globalUI.setScreenEmpty(true);
      return;
    }

    const shouldLoad = shouldLoadKdsOrders(
      installedKdsRestaurantId,
      CONFIG.DEBUG_DIRECT_FLOW,
      bootstrap.coreStatus,
      bootstrap.operationMode,
    );
    if (!shouldLoad) {
      setOrders([]);
      globalUI.setScreenEmpty(true);
      return;
    }

    loadOrders(false);

    const pollingIntervalMs =
      installedKdsRestaurantId || CONFIG.DEBUG_DIRECT_FLOW ? 5000 : 30000;
    const pollingInterval = setInterval(() => {
      if (
        !shouldLoadKdsOrders(
          installedKdsRestaurantId,
          CONFIG.DEBUG_DIRECT_FLOW,
          bootstrap.coreStatus,
          bootstrap.operationMode,
        )
      )
        return;
      loadOrders(true);
    }, pollingIntervalMs);

    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
      clearInterval(pollingInterval);
    };
  }, [
    restaurantId,
    bootstrap.coreStatus,
    bootstrap.operationMode,
    canOperate,
    installedKdsRestaurantId,
  ]);

  // TERMINAL_INSTALLATION_RITUAL: heartbeat para gm_terminals (dashboard mostra Online)
  useEffect(() => {
    const device = getInstalledDevice();
    if (!device || device.module_id !== "kds") return;
    const send = () =>
      TerminalEngine.sendHeartbeat({
        restaurantId: device.restaurant_id,
        type: "KDS",
        name: device.device_name,
      });
    send();
    const interval = setInterval(send, 30_000);
    return () => clearInterval(interval);
  }, []);

  // FLOW: Autoridade cozinha — marcar item pronto (RPC mark_item_ready); se todos prontos, pedido → READY.
  const handleMarkItemReady = async (itemId: string, rid: string) => {
    try {
      setMarkingItem(itemId);
      const result = await markItemReady(itemId, rid);
      await loadOrders(true);
      if (result.all_items_ready) {
        console.log("✅ Todos os itens prontos! Pedido marcado como READY.");
      }
    } catch (err) {
      console.error("Erro ao marcar item como pronto:", err);
      globalUI.setScreenError(
        toUserMessage(err, "Erro ao marcar item como pronto. Tente novamente."),
      );
    } finally {
      setMarkingItem(null);
    }
  };

  // FLOW: "Enviado à cozinha" — pedido passa a IN_PREP (RPC update_order_status; autoridade KDS — FASE 1).
  const handleStartPreparation = async (orderId: string) => {
    try {
      setUpdating(orderId);
      globalUI.setScreenError(null);
      const { error } = await coreUpdateOrderStatus({
        order_id: orderId,
        restaurant_id: restaurantId,
        new_status: "IN_PREP",
        origin: "KDS",
      });
      if (error) throw new Error(error.message);
      loadOrders(true);
    } catch (err) {
      globalUI.setScreenError(
        toUserMessage(err, "Erro ao atualizar pedido. Tente novamente."),
      );
    } finally {
      setUpdating(null);
    }
  };

  if (readiness.loading) {
    return (
      <GlobalLoadingView
        message="Verificando estado operacional..."
        layout="operational"
        variant="fullscreen"
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
  if (
    !readiness.ready &&
    readiness.uiDirective === "REDIRECT" &&
    readiness.redirectTo
  ) {
    return <Navigate to={readiness.redirectTo} replace />;
  }

  if (deviceGate.loading) {
    return (
      <GlobalLoadingView
        message="A verificar dispositivo..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }
  if (!deviceGate.allowed) {
    return <DeviceBlockedScreen reason={deviceGate.reason} />;
  }

  // Vincular dispositivo (PIN) ou instalar no portal — CODE_AND_DEVICE_PAIRING_CONTRACT
  if (hasNoIdentity && !CONFIG.DEBUG_DIRECT_FLOW) {
    return (
      <>
        <DevicePairingView deviceType="kds" />
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <Link
            to="/admin/modules"
            style={{
              fontSize: 14,
              color: VPC.textMuted,
              textDecoration: "underline",
            }}
          >
            Ou instalar KDS no portal
          </Link>
        </div>
      </>
    );
  }

  // Core Docker com restaurante (ex.: seed): mostrar lista de pedidos para TPV→KDS funcionar.
  const showOrderListWithoutInstall =
    isDockerBackend() && !!runtime?.restaurant_id;
  if (
    !installedKdsRestaurantId &&
    !CONFIG.DEBUG_DIRECT_FLOW &&
    bootstrap.operationMode !== "operacao-real" &&
    !showOrderListWithoutInstall
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: VPC.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          color: VPC.text,
          padding: VPC.space,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, color: VPC.text }}>KDS — Pedidos ativos</h1>
        <p style={{ color: VPC.textMuted, textAlign: "center", maxWidth: 400 }}>
          Complete o bootstrap e tenha o Core online para ver pedidos.
        </p>
        <Link
          to="/bootstrap"
          style={{
            color: "#22c55e",
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          Ir ao Bootstrap
        </Link>
      </div>
    );
  }

  if (
    !installedKdsRestaurantId &&
    !CONFIG.DEBUG_DIRECT_FLOW &&
    bootstrap.coreStatus !== "online"
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: VPC.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          color: VPC.text,
          padding: VPC.space,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, color: VPC.text }}>KDS — Pedidos ativos</h1>
        <p style={{ color: VPC.textMuted, textAlign: "center", maxWidth: 400 }}>
          KDS disponível em operação real. Complete o bootstrap e tenha o Core
          online para ver pedidos.
        </p>
        <Link
          to="/bootstrap"
          style={{
            color: VPC.accent,
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          Ir para Bootstrap
        </Link>
      </div>
    );
  }

  if (globalUI.isLoadingCritical) {
    return (
      <div style={{ minHeight: "100vh", padding: "100px 20px" }}>
        <TPVStateDisplay type="generic" title="A carregar pedidos..." />
      </div>
    );
  }

  if (globalUI.isError && globalUI.errorMessage) {
    return (
      <div style={{ minHeight: "100vh", padding: "100px 20px" }}>
        <TPVStateDisplay
          type="error"
          title="Problema ao carregar"
          description={globalUI.errorMessage}
          onRetry={() => loadOrders(false)}
        />
      </div>
    );
  }

  if (globalUI.isEmpty) {
    return (
      <div style={{ minHeight: "100vh", padding: "100px 20px" }}>
        <TPVStateDisplay
          type="empty_orders"
          title="Nenhum pedido ativo"
          description="Os pedidos aparecerão aqui quando forem criados no TPV ou no app. Pedidos já pagos (fechados) não aparecem — crie um pedido no TPV e clique em Actualizar antes de pagar para ver na cozinha."
          onRetry={() => loadOrders(false)}
          actionLabel="Actualizar"
        />
      </div>
    );
  }

  const filteredOrders = filterOrdersByStation(orders, stationFilter);

  // KDS_LAYOUT_UX_CONTRACT §4: activeOnly — excluir READY/CLOSED da lista principal (não poluir com concluídos)
  const activeOnly = filteredOrders.filter(
    (o) =>
      String(o.status ?? "").toUpperCase() !== "READY" &&
      String(o.status ?? "").toUpperCase() !== "CLOSED",
  );

  // KDS_LAYOUT_UX_CONTRACT §2: root flex column + área lista com flex:1 minHeight:0 — sem barra preta no rodapé
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        backgroundColor: VPC.bg,
        fontFamily: "Inter, system-ui, sans-serif",
        color: VPC.text,
        padding: VPC.space,
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: VPC.space, flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: VPC.space,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <RestaurantLogo
              logoUrl={identity.logoUrl}
              name={identity.name || "Restaurante"}
              size={44}
            />
            <h1
              style={{
                margin: 0,
                fontSize: VPC.fontSizeLarge,
                fontWeight: 700,
                color: VPC.text,
              }}
            >
              {identity.name
                ? `${identity.name} — KDS`
                : "KDS — Pedidos ativos"}
            </h1>
          </div>
          {/* B4: sem ruído técnico (Docker/Supabase/realtime); mostrar apenas um estado de ligação simples */}
          <div
            style={{
              fontSize: VPC.fontSizeBase,
              color:
                realtimeStatus === "SUBSCRIBED" ? VPC.accent : VPC.textMuted,
            }}
          >
            {realtimeStatus === "SUBSCRIBED"
              ? "🟢 Atualização em tempo real"
              : "Atualização periódica"}
          </div>
        </div>

        {/* Tabs por Estação */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: `2px solid ${VPC.border}`,
            marginBottom: VPC.space,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab("ALL");
              setStationFilter("ALL");
            }}
            style={{
              padding: "12px 24px",
              minHeight: VPC.btnMinHeight,
              fontSize: VPC.fontSizeBase,
              fontWeight: activeTab === "ALL" ? 700 : 400,
              border: "none",
              borderBottom:
                activeTab === "ALL"
                  ? `2px solid ${VPC.accent}`
                  : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: activeTab === "ALL" ? VPC.accent : VPC.textMuted,
            }}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("KITCHEN");
              setStationFilter("KITCHEN");
            }}
            style={{
              padding: "12px 24px",
              minHeight: VPC.btnMinHeight,
              fontSize: VPC.fontSizeBase,
              fontWeight: activeTab === "KITCHEN" ? 700 : 400,
              border: "none",
              borderBottom:
                activeTab === "KITCHEN"
                  ? `2px solid ${VPC.accent}`
                  : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: activeTab === "KITCHEN" ? VPC.accent : VPC.textMuted,
            }}
          >
            🍳 Cozinha
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("BAR");
              setStationFilter("BAR");
            }}
            style={{
              padding: "12px 24px",
              minHeight: VPC.btnMinHeight,
              fontSize: VPC.fontSizeBase,
              fontWeight: activeTab === "BAR" ? 700 : 400,
              border: "none",
              borderBottom:
                activeTab === "BAR"
                  ? `2px solid ${VPC.accent}`
                  : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: activeTab === "BAR" ? VPC.accent : VPC.textMuted,
            }}
          >
            🍺 Bar
          </button>
        </div>
      </div>

      {/* TASK ENGINE: Painel de Tarefas Automáticas */}
      {activeTab === "KITCHEN" && (
        <div style={{ flexShrink: 0 }}>
          <TaskPanel
            restaurantId={restaurantId}
            station="KITCHEN"
            onTaskAcknowledged={(taskId) => {
              console.log("Tarefa reconhecida:", taskId);
              loadOrders(true);
            }}
          />
        </div>
      )}

      {activeOnly.length === 0 && filteredOrders.length > 0 && (
        <p
          style={{
            color: VPC.textMuted,
            marginBottom: VPC.space,
            flexShrink: 0,
          }}
        >
          Nenhum pedido em preparação (todos prontos ou fechados).
        </p>
      )}
      {/* KDS_LAYOUT_UX_CONTRACT §2: área lista — flex:1 minHeight:0 overflowY:auto (único scroll; sem barra preta) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          paddingRight: 8,
          scrollbarGutter: "stable",
        }}
      >
        {activeOnly.map((order) => {
          // NOVA LÓGICA: Calcular status baseado nos itens (não no pedido)
          // O pedido herda o estado do item mais crítico
          const orderStatus: OrderStatusResult = calculateOrderStatus(
            order,
            order.items,
          );

          return (
            <div
              key={order.id}
              style={{
                border: `1px solid ${VPC.border}`,
                marginBottom: VPC.space,
                padding: VPC.space,
                backgroundColor: VPC.surface,
                borderRadius: VPC.radius,
                color: VPC.text,
              }}
            >
              <div>
                <strong style={{ color: VPC.text }}>
                  Pedido #
                  {order.number || order.short_id || order.id.slice(0, 8)}
                </strong>
                <OriginBadge
                  origin={order.sync_metadata?.origin as string | undefined}
                  createdByRole={
                    order.sync_metadata?.created_by_role as string | undefined
                  }
                  tableNumber={order.table_number ?? undefined}
                />
                {/* Status do pedido baseado no item mais crítico */}
                {orderStatus.state === "delay" && (
                  <span
                    style={{
                      color: "#ef4444",
                      marginLeft: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    🔴{" "}
                    {orderStatus.dominantStation === "BAR" ? "BAR" : "COZINHA"}{" "}
                    Atrasado
                  </span>
                )}
                {orderStatus.state === "attention" && (
                  <span style={{ color: "#eab308", marginLeft: "8px" }}>
                    🟡{" "}
                    {orderStatus.dominantStation === "BAR" ? "BAR" : "COZINHA"}{" "}
                    Atenção
                  </span>
                )}
                {orderStatus.state === "normal" && (
                  <span style={{ color: "#22c55e", marginLeft: "8px" }}>
                    🟢 No prazo
                  </span>
                )}
              </div>
              <div>
                Status: {order.status ?? "—"}
                {order._unknownStatus && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: "#eab308",
                      fontWeight: 600,
                    }}
                    title="Status desconhecido (ORDER_STATUS_CONTRACT_v1)"
                  >
                    ⚠️ Status desconhecido
                  </span>
                )}
              </div>
              {order.table_number && <div>Mesa: {order.table_number}</div>}
              {/* MENU_DERIVATIONS: KDS não exibe preço (apenas product_id + nome). */}
              {/* FASE 6: Ação única - botão para iniciar preparo */}
              {String(order.status ?? "")
                .toUpperCase()
                .trim() === "OPEN" && (
                <div style={{ marginTop: VPC.space }}>
                  <button
                    type="button"
                    onClick={() => handleStartPreparation(order.id)}
                    disabled={updating === order.id}
                    style={{
                      minHeight: VPC.btnMinHeight,
                      padding: "12px 24px",
                      fontSize: VPC.fontSizeBase,
                      fontWeight: 600,
                      backgroundColor:
                        updating === order.id ? VPC.textMuted : VPC.accent,
                      color: "#fff",
                      border: "none",
                      borderRadius: VPC.radius,
                      cursor: updating === order.id ? "wait" : "pointer",
                    }}
                  >
                    {updating === order.id
                      ? "A processar..."
                      : "Iniciar preparo"}
                  </button>
                </div>
              )}
              {/* Itens agrupados por estação — sempre mostrar Cozinha e Bar para divisão clara */}
              <div>
                <strong>Itens:</strong>

                {(() => {
                  const itemsByStation = order.items.reduce((acc, item) => {
                    const station =
                      (item.station ?? "KITCHEN").toString().toUpperCase() ===
                      "BAR"
                        ? "BAR"
                        : "KITCHEN";
                    if (!acc[station]) acc[station] = [];
                    acc[station].push(item);
                    return acc;
                  }, {} as Record<string, typeof order.items>);

                  const kitchenItems = itemsByStation["KITCHEN"] ?? [];
                  const barItems = itemsByStation["BAR"] ?? [];

                  return (
                    <>
                      <div key="KITCHEN" style={{ marginTop: "16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: VPC.textMuted,
                            marginBottom: "8px",
                            paddingBottom: "4px",
                            borderBottom: `1px solid ${VPC.border}`,
                          }}
                        >
                          🍳 COZINHA ({kitchenItems.length} item
                          {kitchenItems.length !== 1 ? "s" : ""})
                        </div>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                          {kitchenItems.map((item) => {
                            const itemCreated = new Date(item.created_at);
                            const now = new Date();
                            const prepTimeSeconds =
                              item.prep_time_seconds || 300;
                            const expectedReadyAt = new Date(
                              itemCreated.getTime() + prepTimeSeconds * 1000,
                            );
                            const delaySeconds =
                              (now.getTime() - expectedReadyAt.getTime()) /
                              1000;
                            const delayRatio =
                              prepTimeSeconds > 0
                                ? delaySeconds / prepTimeSeconds
                                : 0;

                            // Item já está pronto?
                            const isItemReady = item.ready_at !== null;

                            // Calcular tempo real vs esperado (métrica)
                            const actualTimeSeconds =
                              isItemReady && item.ready_at
                                ? Math.floor(
                                    (new Date(item.ready_at).getTime() -
                                      itemCreated.getTime()) /
                                      1000,
                                  )
                                : Math.floor(
                                    (now.getTime() - itemCreated.getTime()) /
                                      1000,
                                  );
                            const timeDifference =
                              actualTimeSeconds - prepTimeSeconds;
                            const timeDifferenceMinutes = Math.floor(
                              Math.abs(timeDifference) / 60,
                            );

                            // Status do item individual
                            let itemStatus:
                              | "ready"
                              | "normal"
                              | "attention"
                              | "delay" = "normal";
                            if (isItemReady) {
                              itemStatus = "ready";
                            } else if (delayRatio < 0.1) {
                              itemStatus = "normal";
                            } else if (delayRatio < 0.25) {
                              itemStatus = "attention";
                            } else {
                              itemStatus = "delay";
                            }

                            const itemColors = {
                              ready: "#6b7280",
                              normal: "#22c55e",
                              attention: "#eab308",
                              delay: "#ef4444",
                            };

                            // Verificar se item tem tarefa aberta
                            const itemTask = tasks.find(
                              (t) =>
                                t.order_item_id === item.id &&
                                t.status === "OPEN",
                            );
                            const hasTask = !!itemTask;

                            return (
                              <li
                                key={item.id}
                                style={{
                                  marginBottom: "8px",
                                  padding: "12px",
                                  backgroundColor: isItemReady
                                    ? "rgba(34,197,94,0.1)"
                                    : hasTask
                                    ? "rgba(220,38,38,0.1)"
                                    : VPC.surface,
                                  borderRadius: "4px",
                                  border: isItemReady
                                    ? "1px solid #22c55e"
                                    : hasTask
                                    ? "2px solid #dc2626"
                                    : `1px solid ${VPC.border}`,
                                  boxShadow: hasTask
                                    ? "0 0 0 2px rgba(220, 38, 38, 0.2)"
                                    : "none",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: itemColors[itemStatus],
                                      fontSize: "16px",
                                    }}
                                  >
                                    {isItemReady
                                      ? "✅"
                                      : itemStatus === "delay"
                                      ? "🔴"
                                      : itemStatus === "attention"
                                      ? "🟡"
                                      : "🟢"}
                                  </span>
                                  {hasTask && (
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        color: "#dc2626",
                                        backgroundColor: "rgba(220,38,38,0.15)",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      🧠 TAREFA
                                    </span>
                                  )}
                                  <span style={{ flex: 1, fontWeight: "500" }}>
                                    {item.name_snapshot} x{item.quantity}
                                  </span>
                                  {!isItemReady && <ItemTimer item={item} />}
                                  {isItemReady && (
                                    <span
                                      style={{
                                        color: "#22c55e",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      ✅ Pronto
                                    </span>
                                  )}
                                  {/* MENU_DERIVATIONS: KDS não exibe preço por item. */}
                                </div>

                                {/* Métrica: Tempo real vs esperado */}
                                {isItemReady && (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: VPC.textDim,
                                      marginTop: "4px",
                                    }}
                                  >
                                    {timeDifference >= 0
                                      ? `⏱️ ${timeDifferenceMinutes} min acima do esperado (${Math.floor(
                                          actualTimeSeconds / 60,
                                        )} min real vs ${Math.floor(
                                          prepTimeSeconds / 60,
                                        )} min esperado)`
                                      : `⏱️ ${timeDifferenceMinutes} min abaixo do esperado (${Math.floor(
                                          actualTimeSeconds / 60,
                                        )} min real vs ${Math.floor(
                                          prepTimeSeconds / 60,
                                        )} min esperado)`}
                                  </div>
                                )}

                                {/* Botão "Item Pronto" — só permitido quando o pedido já está IN_PREP/PREPARING (evita OPEN→READY rejeitado pelo Core) */}
                                {!isItemReady && (
                                  <div style={{ marginTop: "8px" }}>
                                    <button
                                      onClick={() =>
                                        handleMarkItemReady(
                                          item.id,
                                          restaurantId,
                                        )
                                      }
                                      disabled={
                                        markingItem === item.id ||
                                        (order.status !== "IN_PREP" &&
                                          order.status !== "PREPARING")
                                      }
                                      title={
                                        order.status === "OPEN"
                                          ? "Inicie o preparo primeiro"
                                          : undefined
                                      }
                                      style={{
                                        minHeight: 40,
                                        padding: "8px 16px",
                                        fontSize: VPC.fontSizeBase,
                                        fontWeight: 600,
                                        backgroundColor:
                                          markingItem === item.id ||
                                          (order.status !== "IN_PREP" &&
                                            order.status !== "PREPARING")
                                            ? VPC.textMuted
                                            : VPC.accent,
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: VPC.radius,
                                        cursor:
                                          markingItem === item.id ||
                                          (order.status !== "IN_PREP" &&
                                            order.status !== "PREPARING")
                                            ? "wait"
                                            : "pointer",
                                      }}
                                    >
                                      {markingItem === item.id
                                        ? "A marcar..."
                                        : order.status === "OPEN"
                                        ? "⏳ Inicie o preparo primeiro"
                                        : "✅ Item pronto"}
                                    </button>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div key="BAR" style={{ marginTop: "16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: VPC.textMuted,
                            marginBottom: "8px",
                            paddingBottom: "4px",
                            borderBottom: `1px solid ${VPC.border}`,
                          }}
                        >
                          🍺 BAR ({barItems.length} item
                          {barItems.length !== 1 ? "s" : ""})
                        </div>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                          {barItems.map((item) => {
                            const itemCreated = new Date(item.created_at!);
                            const now = new Date();
                            const prepTimeSeconds =
                              item.prep_time_seconds || 300;
                            const expectedReadyAt = new Date(
                              itemCreated.getTime() + prepTimeSeconds * 1000,
                            );
                            const delaySeconds =
                              (now.getTime() - expectedReadyAt.getTime()) /
                              1000;
                            const delayRatio =
                              prepTimeSeconds > 0
                                ? delaySeconds / prepTimeSeconds
                                : 0;
                            const isItemReady = item.ready_at !== null;
                            const actualTimeSeconds =
                              isItemReady && item.ready_at
                                ? Math.floor(
                                    (new Date(item.ready_at).getTime() -
                                      itemCreated.getTime()) /
                                      1000,
                                  )
                                : Math.floor(
                                    (now.getTime() - itemCreated.getTime()) /
                                      1000,
                                  );
                            const timeDifference =
                              actualTimeSeconds - prepTimeSeconds;
                            const timeDifferenceMinutes = Math.floor(
                              Math.abs(timeDifference) / 60,
                            );
                            let itemStatus:
                              | "ready"
                              | "normal"
                              | "attention"
                              | "delay" = "normal";
                            if (isItemReady) itemStatus = "ready";
                            else if (delayRatio < 0.1) itemStatus = "normal";
                            else if (delayRatio < 0.25)
                              itemStatus = "attention";
                            else itemStatus = "delay";
                            const itemColors = {
                              ready: "#6b7280",
                              normal: "#22c55e",
                              attention: "#eab308",
                              delay: "#ef4444",
                            };
                            const itemTask = tasks.find(
                              (t) =>
                                t.order_item_id === item.id &&
                                t.status === "OPEN",
                            );
                            const hasTask = !!itemTask;
                            return (
                              <li
                                key={item.id}
                                style={{
                                  marginBottom: "8px",
                                  padding: "12px",
                                  backgroundColor: isItemReady
                                    ? "rgba(34,197,94,0.1)"
                                    : hasTask
                                    ? "rgba(220,38,38,0.1)"
                                    : VPC.surface,
                                  borderRadius: "4px",
                                  border: isItemReady
                                    ? "1px solid #22c55e"
                                    : hasTask
                                    ? "2px solid #dc2626"
                                    : `1px solid ${VPC.border}`,
                                  boxShadow: hasTask
                                    ? "0 0 0 2px rgba(220, 38, 38, 0.2)"
                                    : "none",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: itemColors[itemStatus],
                                      fontSize: "16px",
                                    }}
                                  >
                                    {isItemReady
                                      ? "✅"
                                      : itemStatus === "delay"
                                      ? "🔴"
                                      : itemStatus === "attention"
                                      ? "🟡"
                                      : "🟢"}
                                  </span>
                                  {hasTask && (
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        color: "#dc2626",
                                        backgroundColor: "rgba(220,38,38,0.15)",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      🧠 TAREFA
                                    </span>
                                  )}
                                  <span style={{ flex: 1, fontWeight: "500" }}>
                                    {item.name_snapshot} x{item.quantity}
                                  </span>
                                  {!isItemReady && <ItemTimer item={item} />}
                                  {isItemReady && (
                                    <span
                                      style={{
                                        color: "#22c55e",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      ✅ Pronto
                                    </span>
                                  )}
                                </div>
                                {isItemReady && (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: VPC.textDim,
                                      marginTop: "4px",
                                    }}
                                  >
                                    {timeDifference >= 0
                                      ? `⏱️ ${timeDifferenceMinutes} min acima do esperado`
                                      : `⏱️ ${timeDifferenceMinutes} min abaixo do esperado`}
                                  </div>
                                )}
                                {!isItemReady && (
                                  <div style={{ marginTop: "8px" }}>
                                    <button
                                      onClick={() =>
                                        handleMarkItemReady(
                                          item.id,
                                          restaurantId,
                                        )
                                      }
                                      disabled={
                                        markingItem === item.id ||
                                        (order.status !== "IN_PREP" &&
                                          order.status !== "PREPARING")
                                      }
                                      title={
                                        order.status === "OPEN"
                                          ? "Inicie o preparo primeiro"
                                          : undefined
                                      }
                                      style={{
                                        minHeight: 40,
                                        padding: "8px 16px",
                                        fontSize: VPC.fontSizeBase,
                                        fontWeight: 600,
                                        backgroundColor:
                                          markingItem === item.id ||
                                          (order.status !== "IN_PREP" &&
                                            order.status !== "PREPARING")
                                            ? VPC.textMuted
                                            : VPC.accent,
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: VPC.radius,
                                        cursor:
                                          markingItem === item.id ||
                                          (order.status !== "IN_PREP" &&
                                            order.status !== "PREPARING")
                                            ? "wait"
                                            : "pointer",
                                      }}
                                    >
                                      {markingItem === item.id
                                        ? "A marcar..."
                                        : order.status === "OPEN"
                                        ? "⏳ Inicie o preparo primeiro"
                                        : "✅ Item pronto"}
                                    </button>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
          @keyframes vpc-fade {
            from { opacity: 0.6; }
            to { opacity: 1; }
          }
        `}</style>
    </div>
  );
}
