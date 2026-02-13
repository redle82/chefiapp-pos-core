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
import { ShiftChecklistSection } from "../../components/tasks/ShiftChecklistSection";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import type { CoreTask } from "../../infra/docker-core/types";
import { getActiveTurnSessionIdFromStorage } from "../../infra/readers/ShiftChecklistReader";
import { readOpenTasks } from "../../infra/readers/TaskReader";
import {
  generateScheduledTasks,
  generateTasks,
} from "../../infra/writers/TaskWriter";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { isDockerBackend } from "../../core/infra/backendAdapter";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { deduplicateCoreTasks } from "../../core/tasks/TaskFiltering";
import styles from "./TaskSystemMinimal.module.css";

type TaskFilter = "all" | "BAR" | "KITCHEN" | "SERVICE";
type TaskStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
type PriorityFilter = "all" | "CRITICA" | "ALTA" | "MEDIA" | "LOW";

/** Seed do Core Docker (06-seed-enterprise). */
const SEED_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

export function TaskSystemMinimal() {
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState(true);

  /** Fallback: Docker → seed restaurant; Supabase → Restaurante Alpha. */
  const DEFAULT_RESTAURANT_ID = isDockerBackend()
    ? SEED_RESTAURANT_ID
    : "bbce08c7-63c0-473d-b693-ec2997f73a68";

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
      identity.loading,
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
          (_payload) => {
            // Debounce: recarregar após 500ms
            setTimeout(() => {
              loadTasks();
            }, 500);
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[TaskSystem] Realtime subscription active");
          } else if (status === "CHANNEL_ERROR") {
            console.warn(
              "[TaskSystem] Realtime subscription failed, using polling fallback",
            );
          }
        });
    } catch (err) {
      console.warn(
        "[TaskSystem] Failed to setup Realtime, using polling fallback:",
        err,
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
        finalRestaurantId,
      );

      let tasksData: CoreTask[] = [];

      if (statusFilter === "OPEN") {
        const turnSessionId = getActiveTurnSessionIdFromStorage();
        tasksData = await readOpenTasks(
          finalRestaurantId,
          stationFilter !== "all" ? stationFilter : undefined,
          turnSessionId ?? undefined,
        );
        console.log(
          "[TaskSystem] Loaded",
          tasksData.length,
          "open tasks",
          turnSessionId ? "(turno ativo)" : "",
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
        err instanceof Error ? err.message : "Erro ao reconhecer tarefa",
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
      <div className={styles.loadingState}>
        <p>Carregando identidade do restaurante...</p>
      </div>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <div className={styles.loadingState}>
        <p>Carregando tarefas...</p>
        <p className={styles.loadingDetail}>
          Restaurant ID: {finalRestaurantId?.slice(0, 8)}...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📋 Sistema de Tarefas</h1>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* FASE 3 Passo 2: Checklist do turno */}
      <div className={styles.checklistSection}>
        <ShiftChecklistSection
          restaurantId={finalRestaurantId}
          variant="full"
        />
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div>
          <label className={styles.filterLabel}>Estação</label>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value as TaskFilter)}
            className={styles.filterSelect}
            aria-label="Filtro de estação"
          >
            <option value="all">Todas</option>
            <option value="BAR">Bar</option>
            <option value="KITCHEN">Cozinha</option>
            <option value="SERVICE">Serviço</option>
          </select>
        </div>

        <div>
          <label className={styles.filterLabel}>Prioridade</label>
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as PriorityFilter)
            }
            className={styles.filterSelect}
            aria-label="Filtro de prioridade"
          >
            <option value="all">Todas</option>
            <option value="CRITICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="LOW">Baixa</option>
          </select>
        </div>

        <div>
          <label className={styles.filterLabel}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus)}
            className={styles.filterSelect}
            aria-label="Filtro de status"
          >
            <option value="OPEN">Abertas</option>
            <option value="ACKNOWLEDGED">Reconhecidas</option>
            <option value="RESOLVED">Resolvidas</option>
            <option value="DISMISSED">Dispensadas</option>
          </select>
        </div>

        <div className={styles.buttonContainer}>
          <button
            onClick={handleGenerateTasks}
            disabled={generating}
            className={styles.generateButton}
            data-generating={generating ? "true" : "false"}
          >
            {generating ? "⏳ Gerando..." : "✨ Gerar Tarefas"}
          </button>
          <button onClick={loadTasks} className={styles.refreshButton}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} data-type="critical">
          <div className={styles.statValue}>
            {tasks.filter((t) => t.priority === "CRITICA").length}
          </div>
          <div className={styles.statLabel}>Críticas</div>
        </div>
        <div className={styles.statCard} data-type="high">
          <div className={styles.statValue}>
            {tasks.filter((t) => t.priority === "ALTA").length}
          </div>
          <div className={styles.statLabel}>Altas</div>
        </div>
        <div className={styles.statCard} data-type="total">
          <div className={styles.statValue}>{tasks.length}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
      </div>

      {/* Tasks List */}
      <div className={styles.tasksList}>
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              {statusFilter === "OPEN"
                ? "✅ Nenhuma tarefa aberta"
                : "Nenhuma tarefa encontrada"}
            </p>
            <p className={styles.emptyMessage}>
              {statusFilter === "OPEN"
                ? "Todas as tarefas foram resolvidas ou não há tarefas geradas ainda."
                : "Nenhuma tarefa com este status."}
            </p>
            {statusFilter === "OPEN" && (
              <div className={styles.emptyTip}>
                <p>💡 Dica: Tarefas são geradas automaticamente quando:</p>
                <ul className={styles.emptyTipList}>
                  <li>Itens de pedido estão atrasados</li>
                  <li>Estoque fica abaixo do mínimo</li>
                  <li>Há ruptura prevista de ingredientes</li>
                </ul>
                <button
                  onClick={handleGenerateTasks}
                  disabled={generating}
                  className={styles.emptyGenerateButton}
                  data-generating={generating}
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
              className={styles.taskCard}
              data-priority={task.priority.toLowerCase()}
            >
              <div className={styles.taskHeader}>
                <div className={styles.taskBody}>
                  <div className={styles.taskMeta}>
                    <span className={styles.taskIcon}>
                      {getTaskTypeIcon(task.task_type)}
                    </span>
                    <span
                      className={styles.stationBadge}
                      data-station={task.station || "default"}
                    >
                      {task.station || "N/A"}
                    </span>
                    <span
                      className={styles.priorityBadge}
                      data-priority={task.priority || "default"}
                    >
                      {task.priority}
                    </span>
                    <span className={styles.taskType}>{task.task_type}</span>
                  </div>
                  <p className={styles.taskMessage}>{task.message}</p>
                  {task.context && Object.keys(task.context).length > 0 && (
                    <div className={styles.taskContext}>
                      <strong>Contexto:</strong>{" "}
                      {JSON.stringify(task.context, null, 2)}
                    </div>
                  )}
                  <div className={styles.taskTimestamp}>
                    Criada em:{" "}
                    {new Date(task.created_at).toLocaleString("pt-BR")}
                    {task.auto_generated && (
                      <span className={styles.autoGeneratedBadge}>
                        🤖 Automática
                      </span>
                    )}
                  </div>
                </div>
                {statusFilter === "OPEN" && (
                  <div className={styles.taskActions}>
                    <button
                      onClick={() => handleAcknowledge(task.id)}
                      className={styles.acknowledgeButton}
                    >
                      ✓ Reconhecer
                    </button>
                    <button
                      onClick={() => handleResolve(task.id)}
                      className={styles.resolveButton}
                    >
                      ✅ Resolver
                    </button>
                    <button
                      onClick={() => handleDismiss(task.id)}
                      className={styles.dismissButton}
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
