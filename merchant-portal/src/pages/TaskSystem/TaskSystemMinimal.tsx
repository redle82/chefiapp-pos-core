/**
 * TASK SYSTEM MINIMAL — Visualização e Gestão de Tarefas
 *
 * Tela completa para visualizar e gerenciar tarefas do Task Engine:
 * - Tarefas abertas (por estação, prioridade)
 * - Histórico de tarefas resolvidas
 * - Filtros e busca
 * - Ações: reconhecer, resolver, dispensar
 */

import { useEffect, useState } from "react";
import { ShiftChecklistSection } from "../../components/Tasks/ShiftChecklistSection";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import type { CoreTask } from "../../core-boundary/docker-core/types";
import { getActiveTurnSessionIdFromStorage } from "../../core-boundary/readers/ShiftChecklistReader";
import { readOpenTasks } from "../../core-boundary/readers/TaskReader";
import {
  generateScheduledTasks,
  generateTasks,
} from "../../core-boundary/writers/TaskWriter";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { deduplicateCoreTasks } from "../../core/tasks/TaskFiltering";

type TaskFilter = "all" | "BAR" | "KITCHEN" | "SERVICE";
type TaskStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
type PriorityFilter = "all" | "CRITICA" | "ALTA" | "MEDIA" | "LOW";

export function TaskSystemMinimal() {
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState(true);

  // FIXME: Hardcoded restaurant ID - será removido na próxima fase
  // Usando Restaurante Alpha do teste massivo para validação
  const DEFAULT_RESTAURANT_ID = "bbce08c7-63c0-473d-b693-ec2997f73a68"; // Restaurante Alpha

  useEffect(() => {
    // Obter restaurantId (mesmo padrão do KDSMinimal)
    const id =
      identity.id ||
      getTabIsolated("chefiapp_restaurant_id") ||
      DEFAULT_RESTAURANT_ID;
    console.log(
      "[TaskSystem] Restaurant ID resolved:",
      id,
      "identity.loading:",
      identity.loading
    );
    setRestaurantId(id);
    setLoadingIdentity(identity.loading);
  }, [identity.id, identity.loading]);

  const finalRestaurantId = restaurantId || DEFAULT_RESTAURANT_ID;

  const [tasks, setTasks] = useState<CoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [stationFilter, setStationFilter] = useState<TaskFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("OPEN");

  // Load tasks
  useEffect(() => {
    if (loadingIdentity || !finalRestaurantId) return;

    // Fail-fast: não configurar polling nem Realtime se o Core estiver em baixo.
    if (runtime.loading || !runtime.coreReachable) return;

    loadTasks();

    // Realtime subscription (opcional - fallback para polling)
    let channel: ReturnType<typeof dockerCoreClient.channel> | null = null;

    try {
      channel = dockerCoreClient
        .channel(`task_system_${finalRestaurantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "gm_tasks",
            filter: `restaurant_id=eq.${finalRestaurantId}`,
          },
          (payload) => {
            // Debounce: recarregar após 500ms
            setTimeout(() => {
              loadTasks();
            }, 500);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[TaskSystem] Realtime subscription active");
          } else if (status === "CHANNEL_ERROR") {
            console.warn(
              "[TaskSystem] Realtime subscription failed, using polling fallback"
            );
          }
        });
    } catch (err) {
      console.warn(
        "[TaskSystem] Failed to setup Realtime, using polling fallback:",
        err
      );
    }

    // Polling de fallback a cada 10 segundos (garantia)
    const interval = setInterval(loadTasks, 10000);

    return () => {
      if (channel) {
        dockerCoreClient.removeChannel(channel);
      }
      clearInterval(interval);
    };
  }, [
    finalRestaurantId,
    stationFilter,
    statusFilter,
    loadingIdentity,
    runtime.loading,
    runtime.coreReachable,
  ]);

  const loadTasks = async () => {
    // Fail-fast: evitar rajadas de gm_tasks quando o Core está offline.
    if (runtime.loading || !runtime.coreReachable) {
      console.log("[TaskSystem] Core indisponível, skip loadTasks");
      return;
    }

    if (!finalRestaurantId) {
      console.log("[TaskSystem] No restaurantId, skipping load");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(
        "[TaskSystem] Loading tasks for restaurant:",
        finalRestaurantId
      );

      let tasksData: CoreTask[] = [];

      if (statusFilter === "OPEN") {
        const turnSessionId = getActiveTurnSessionIdFromStorage();
        tasksData = await readOpenTasks(
          finalRestaurantId,
          stationFilter !== "all" ? stationFilter : undefined,
          turnSessionId ?? undefined
        );
        console.log(
          "[TaskSystem] Loaded",
          tasksData.length,
          "open tasks",
          turnSessionId ? "(turno ativo)" : ""
        );
      } else {
        // Para outros status, buscar todas e filtrar
        const { data, error: err } = await dockerCoreClient
          .from("gm_tasks")
          .select("*")
          .eq("restaurant_id", finalRestaurantId)
          .eq("status", statusFilter)
          .order("created_at", { ascending: false });

        if (err) throw err;
        tasksData = (data || []) as CoreTask[];

        if (stationFilter !== "all") {
          tasksData = tasksData.filter((t) => t.station === stationFilter);
        }
      }

      // Aplicar filtro de prioridade
      if (priorityFilter !== "all") {
        tasksData = tasksData.filter((t) => t.priority === priorityFilter);
      }

      // Deduplicar por (order_id, order_item_id, task_type) para evitar tarefas idênticas
      tasksData = deduplicateCoreTasks(tasksData);

      setTasks(tasksData);
      console.log("[TaskSystem] Tasks set:", tasksData.length);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao carregar tarefas";
      console.error("[TaskSystem] Error loading tasks:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleAcknowledge = async (taskId: string) => {
    try {
      await dockerCoreClient
        .from("gm_tasks")
        .update({
          status: "ACKNOWLEDGED",
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      await loadTasks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao reconhecer tarefa"
      );
    }
  };

  const handleResolve = async (taskId: string) => {
    try {
      await dockerCoreClient
        .from("gm_tasks")
        .update({
          status: "RESOLVED",
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao resolver tarefa");
    }
  };

  const handleDismiss = async (taskId: string) => {
    try {
      await dockerCoreClient
        .from("gm_tasks")
        .update({
          status: "DISMISSED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao dispensar tarefa");
    }
  };

  const handleGenerateTasks = async () => {
    if (!finalRestaurantId) return;

    try {
      setGenerating(true);
      setError(null);

      // Gerar tarefas de pedidos e agendadas
      await generateTasks(finalRestaurantId);
      await generateScheduledTasks(finalRestaurantId);

      // Recarregar tarefas
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar tarefas");
    } finally {
      setGenerating(false);
    }
  };

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICA":
        return "#dc2626";
      case "ALTA":
        return "#ea580c";
      case "MEDIA":
        return "#ca8a04";
      case "LOW":
        return "#65a30d";
      default:
        return "#6b7280";
    }
  };

  // Task type icons
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "ATRASO_ITEM":
        return "⏱️";
      case "ACUMULO_BAR":
        return "🍺";
      case "ENTREGA_PENDENTE":
        return "📦";
      case "ITEM_CRITICO":
        return "🚨";
      case "PEDIDO_ESQUECIDO":
        return "⚠️";
      case "ESTOQUE_CRITICO":
        return "📉";
      case "RUPTURA_PREVISTA":
        return "🔴";
      case "EQUIPAMENTO_CHECK":
        return "🔧";
      default:
        return "📋";
    }
  };

  // Station colors
  const getStationColor = (station?: string) => {
    switch (station) {
      case "BAR":
        return "#3b82f6";
      case "KITCHEN":
        return "#ea580c";
      case "SERVICE":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  if (loadingIdentity) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Carregando identidade do restaurante...</p>
      </div>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Carregando tarefas...</p>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
          Restaurant ID: {finalRestaurantId?.slice(0, 8)}...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}
      >
        📋 Sistema de Tarefas
      </h1>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* FASE 3 Passo 2: Checklist do turno */}
      <div style={{ marginBottom: "24px" }}>
        <ShiftChecklistSection
          restaurantId={finalRestaurantId}
          variant="full"
        />
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
          padding: "16px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Estação
          </label>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value as TaskFilter)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            <option value="all">Todas</option>
            <option value="BAR">Bar</option>
            <option value="KITCHEN">Cozinha</option>
            <option value="SERVICE">Serviço</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Prioridade
          </label>
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as PriorityFilter)
            }
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            <option value="all">Todas</option>
            <option value="CRITICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="LOW">Baixa</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            <option value="OPEN">Abertas</option>
            <option value="ACKNOWLEDGED">Reconhecidas</option>
            <option value="RESOLVED">Resolvidas</option>
            <option value="DISMISSED">Dispensadas</option>
          </select>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <button
            onClick={handleGenerateTasks}
            disabled={generating}
            style={{
              padding: "8px 16px",
              backgroundColor: generating ? "#9ca3af" : "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: generating ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            {generating ? "⏳ Gerando..." : "✨ Gerar Tarefas"}
          </button>
          <button
            onClick={loadTasks}
            style={{
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fca5a5",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#dc2626" }}
          >
            {tasks.filter((t) => t.priority === "CRITICA").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Críticas</div>
        </div>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fff7ed",
            borderRadius: "8px",
            border: "1px solid #fdba74",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#ea580c" }}
          >
            {tasks.filter((t) => t.priority === "ALTA").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Altas</div>
        </div>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#374151" }}
          >
            {tasks.length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Total</div>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: "grid", gap: "12px" }}>
        {tasks.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              color: "#666",
            }}
          >
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>
              {statusFilter === "OPEN"
                ? "✅ Nenhuma tarefa aberta"
                : "Nenhuma tarefa encontrada"}
            </p>
            <p style={{ fontSize: "14px", marginBottom: "16px" }}>
              {statusFilter === "OPEN"
                ? "Todas as tarefas foram resolvidas ou não há tarefas geradas ainda."
                : "Nenhuma tarefa com este status."}
            </p>
            {statusFilter === "OPEN" && (
              <div
                style={{ fontSize: "12px", color: "#999", marginTop: "16px" }}
              >
                <p>💡 Dica: Tarefas são geradas automaticamente quando:</p>
                <ul
                  style={{
                    textAlign: "left",
                    display: "inline-block",
                    marginTop: "8px",
                  }}
                >
                  <li>Itens de pedido estão atrasados</li>
                  <li>Estoque fica abaixo do mínimo</li>
                  <li>Há ruptura prevista de ingredientes</li>
                </ul>
                <button
                  onClick={handleGenerateTasks}
                  disabled={generating}
                  style={{
                    marginTop: "16px",
                    padding: "8px 16px",
                    backgroundColor: generating ? "#9ca3af" : "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: generating ? "not-allowed" : "pointer",
                    fontSize: "14px",
                  }}
                >
                  {generating ? "⏳ Gerando..." : "✨ Gerar Tarefas de Teste"}
                </button>
              </div>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: "20px",
                backgroundColor: "#fff",
                border: `2px solid ${getPriorityColor(task.priority)}`,
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>
                      {getTaskTypeIcon(task.task_type)}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: getStationColor(task.station || undefined),
                        backgroundColor: `${getStationColor(
                          task.station || undefined
                        )}20`,
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {task.station || "N/A"}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: getPriorityColor(task.priority),
                        backgroundColor: `${getPriorityColor(task.priority)}20`,
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {task.priority}
                    </span>
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {task.task_type}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {task.message}
                  </p>
                  {task.context && Object.keys(task.context).length > 0 && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        backgroundColor: "#f9fafb",
                        padding: "8px",
                        borderRadius: "4px",
                        marginTop: "8px",
                      }}
                    >
                      <strong>Contexto:</strong>{" "}
                      {JSON.stringify(task.context, null, 2)}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "8px",
                    }}
                  >
                    Criada em:{" "}
                    {new Date(task.created_at).toLocaleString("pt-BR")}
                    {task.auto_generated && (
                      <span style={{ marginLeft: "8px", color: "#3b82f6" }}>
                        🤖 Automática
                      </span>
                    )}
                  </div>
                </div>
                {statusFilter === "OPEN" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexDirection: "column",
                    }}
                  >
                    <button
                      onClick={() => handleAcknowledge(task.id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ✓ Reconhecer
                    </button>
                    <button
                      onClick={() => handleResolve(task.id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ✅ Resolver
                    </button>
                    <button
                      onClick={() => handleDismiss(task.id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#6b7280",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ✗ Dispensar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
