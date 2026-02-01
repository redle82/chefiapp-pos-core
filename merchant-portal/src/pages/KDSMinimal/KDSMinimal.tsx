/**
 * KDS MINIMAL — FASE 2
 *
 * UI mínima para listar pedidos. VPC: escuro, botões grandes, tipografia clara.
 */

import { useEffect, useRef, useState } from "react";
// FASE 3.5: Migrado para OrderReader (usa dockerCoreClient)
import { DemoExplicativoCard } from "../../components/DemoExplicativo";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import type {
  CoreOrder,
  CoreOrderItem,
  CoreTask,
} from "../../core-boundary/docker-core/types";
import { isNetworkError } from "../../core-boundary/menuPilotFallback";
import {
  readActiveOrders,
  readOrderItems,
} from "../../core-boundary/readers/OrderReader";
import { readOpenTasks } from "../../core-boundary/readers/TaskReader";
import {
  markItemReady,
  updateOrderStatus,
} from "../../core-boundary/writers/OrderWriter";
import { ModeGate } from "../../runtime/ModeGate";
import { GlobalPilotBanner } from "../../ui/design-system/components";
import { toUserMessage } from "../../ui/errors";
import { TPVStateDisplay } from "../TPV/components/TPVStateDisplay";
import { ItemTimer } from "./ItemTimer";
import {
  calculateOrderStatus,
  type OrderStatusResult,
} from "./OrderStatusCalculator";
import { OriginBadge } from "./OriginBadge";
import { TaskPanel } from "./TaskPanel";

/** B4: Fallback quando runtime não tem restaurant_id (piloto). */
const DEFAULT_RESTAURANT_ID = "bbce08c7-63c0-473d-b693-ec2997f73a68";

const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 24,
  btnMinHeight: 48,
  fontSizeBase: 16,
  fontSizeLarge: 20,
} as const;

export function KDSMinimal() {
  const { runtime } = useRestaurantRuntime();
  const globalUI = useGlobalUIState();
  const runtimeContext = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? DEFAULT_RESTAURANT_ID;
  const coreReachable = globalUI.coreReachable;

  const [orders, setOrders] = useState<
    (CoreOrder & { items: CoreOrderItem[] })[]
  >([]);
  const [updating, setUpdating] = useState<string | null>(null); // ID do pedido sendo atualizado
  const [markingItem, setMarkingItem] = useState<string | null>(null); // ID do item sendo marcado como pronto
  const [realtimeStatus, setRealtimeStatus] = useState<string>("DISCONNECTED");
  const [stationFilter, setStationFilter] = useState<"ALL" | "BAR" | "KITCHEN">(
    "ALL",
  ); // Filtro por station
  const [activeTab, setActiveTab] = useState<"ALL" | "BAR" | "KITCHEN">("ALL"); // Tab ativa (ALL, BAR, KITCHEN)
  const [tasks, setTasks] = useState<CoreTask[]>([]); // Tarefas abertas
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Função para carregar tarefas (B4: em erro não bloquear UI; tasks = [] é aceitável)
  const loadTasks = async () => {
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
      await loadTasks();
    } catch (err) {
      if (isNetworkError(err)) {
        setOrders([]);
        globalUI.setScreenEmpty(true);
        globalUI.setScreenError(null);
      } else {
        globalUI.setScreenError(
          toUserMessage(err, "Erro ao carregar pedidos. Tente novamente."),
        );
      }
    } finally {
      if (!isBackground) {
        globalUI.setScreenLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOrders(false);
    setRealtimeStatus("CLOSED"); // B4: realtime desativado; UI mostra "Modo Piloto"

    const pollingInterval = setInterval(() => {
      loadOrders(true);
    }, 30000);

    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
      clearInterval(pollingInterval);
    };
  }, [restaurantId]);

  // FASE 6: Ação única - mudar status para "em preparo"
  // FASE 1: Marcar item como pronto
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

  const handleStartPreparation = async (orderId: string) => {
    try {
      setUpdating(orderId);
      globalUI.setScreenError(null);
      await updateOrderStatus(orderId, "IN_PREP", restaurantId);
      loadOrders(true);
    } catch (err) {
      globalUI.setScreenError(
        toUserMessage(err, "Erro ao atualizar pedido. Tente novamente."),
      );
    } finally {
      setUpdating(null);
    }
  };

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
          onRetry={() => loadOrders(true)}
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
          description="Os pedidos aparecerão aqui quando forem criados no TPV ou no app."
        />
      </div>
    );
  }

  // Filtrar pedidos/itens por station
  const filteredOrders = orders
    .map((order) => {
      const filteredItems =
        stationFilter === "ALL"
          ? order.items
          : order.items.filter((item) => item.station === stationFilter);

      return {
        ...order,
        items: filteredItems,
      };
    })
    .filter((order) => order.items.length > 0); // Só mostrar pedidos com itens após filtro

  return (
    <ModeGate
      allow={["pilot", "live"]}
      moduleId="kds"
      fallback={<DemoExplicativoCard moduleId="kds" />}
    >
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: VPC.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          color: VPC.text,
          padding: VPC.space,
        }}
      >
        {/* Contingency Mode Banner */}
        {!coreReachable && (
          <div
            style={{
              background: "#ff453a",
              color: "#fff",
              padding: "12px 24px",
              textAlign: "center",
              fontWeight: 600,
              fontSize: "14px",
              marginBottom: VPC.space,
              borderRadius: VPC.radius,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <span>🚨 Modo de Contingência: O Core não está acessível.</span>
            <button
              onClick={() => runtimeContext?.refresh()}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.4)",
                color: "white",
                padding: "4px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Tentar Reconectar
            </button>
          </div>
        )}

        {globalUI.isPilot && (
          <div style={{ marginBottom: VPC.space }}>
            <GlobalPilotBanner />
          </div>
        )}
        <div style={{ marginBottom: VPC.space }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: VPC.space,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: VPC.fontSizeLarge,
                fontWeight: 700,
                color: VPC.text,
              }}
            >
              KDS — Pedidos ativos
            </h1>
            {/* B4: sem ruído técnico (Docker/Supabase/realtime); mostrar apenas "Modo Piloto" quando não realtime */}
            <div
              style={{
                fontSize: VPC.fontSizeBase,
                color:
                  realtimeStatus === "SUBSCRIBED" ? VPC.accent : VPC.textMuted,
              }}
            >
              {realtimeStatus === "SUBSCRIBED"
                ? "🟢 Realtime ativo"
                : "Modo Piloto"}
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
          <TaskPanel
            restaurantId={restaurantId}
            station="KITCHEN"
            onTaskAcknowledged={(taskId) => {
              console.log("Tarefa reconhecida:", taskId);
              // Recarregar pedidos para atualizar highlights
              loadOrders(true);
            }}
          />
        )}

        <div>
          {filteredOrders.map((order) => {
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
                  <OriginBadge origin={order.sync_metadata?.origin} />
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
                      {orderStatus.dominantStation === "BAR"
                        ? "BAR"
                        : "COZINHA"}{" "}
                      Atrasado
                    </span>
                  )}
                  {orderStatus.state === "attention" && (
                    <span style={{ color: "#eab308", marginLeft: "8px" }}>
                      🟡{" "}
                      {orderStatus.dominantStation === "BAR"
                        ? "BAR"
                        : "COZINHA"}{" "}
                      Atenção
                    </span>
                  )}
                  {orderStatus.state === "normal" && (
                    <span style={{ color: "#22c55e", marginLeft: "8px" }}>
                      🟢 No prazo
                    </span>
                  )}
                </div>
                <div>Status: {order.status}</div>
                {order.table_number && <div>Mesa: {order.table_number}</div>}
                <div>Total: € {(order.total_cents / 100).toFixed(2)}</div>
                {/* FASE 6: Ação única - botão para iniciar preparo */}
                {order.status === "OPEN" && (
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
                {/* Itens agrupados por estação */}
                <div>
                  <strong>Itens:</strong>

                  {/* Agrupar itens por estação */}
                  {(() => {
                    const itemsByStation = order.items.reduce((acc, item) => {
                      const station = item.station || "KITCHEN";
                      if (!acc[station]) {
                        acc[station] = [];
                      }
                      acc[station].push(item);
                      return acc;
                    }, {} as Record<string, typeof order.items>);

                    return Object.entries(itemsByStation).map(
                      ([station, items]) => (
                        <div key={station} style={{ marginTop: "16px" }}>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "bold",
                              color: "#6b7280",
                              marginBottom: "8px",
                              paddingBottom: "4px",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {station === "BAR" ? "🍺 BAR" : "🍳 COZINHA"} (
                            {items.length} item{items.length !== 1 ? "s" : ""})
                          </div>
                          <ul style={{ listStyle: "none", padding: 0 }}>
                            {items.map((item) => {
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
                                      ? "#f0fdf4"
                                      : hasTask
                                      ? "#fef2f2"
                                      : "#f9fafb",
                                    borderRadius: "4px",
                                    border: isItemReady
                                      ? "1px solid #22c55e"
                                      : hasTask
                                      ? "2px solid #dc2626"
                                      : "1px solid #e5e7eb",
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
                                          backgroundColor: "#fee2e2",
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                        }}
                                      >
                                        🧠 TAREFA
                                      </span>
                                    )}
                                    <span
                                      style={{ flex: 1, fontWeight: "500" }}
                                    >
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
                                    <span
                                      style={{
                                        marginLeft: "8px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      € {(item.subtotal_cents / 100).toFixed(2)}
                                    </span>
                                  </div>

                                  {/* Métrica: Tempo real vs esperado */}
                                  {isItemReady && (
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#6b7280",
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

                                  {/* Botão "Item Pronto" */}
                                  {!isItemReady && (
                                    <div style={{ marginTop: "8px" }}>
                                      <button
                                        onClick={() =>
                                          handleMarkItemReady(
                                            item.id,
                                            restaurantId,
                                          )
                                        }
                                        disabled={markingItem === item.id}
                                        style={{
                                          minHeight: 40,
                                          padding: "8px 16px",
                                          fontSize: VPC.fontSizeBase,
                                          fontWeight: 600,
                                          backgroundColor:
                                            markingItem === item.id
                                              ? VPC.textMuted
                                              : VPC.accent,
                                          color: "#fff",
                                          border: "none",
                                          borderRadius: VPC.radius,
                                          cursor:
                                            markingItem === item.id
                                              ? "wait"
                                              : "pointer",
                                        }}
                                      >
                                        {markingItem === item.id
                                          ? "A marcar..."
                                          : "✅ Item pronto"}
                                      </button>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ),
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
    </ModeGate>
  );
}
