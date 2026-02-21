/**
 * TASK PANEL — Painel de Tarefas Automáticas
 *
 * TASK ENGINE: Exibe tarefas automáticas geradas a partir de eventos operacionais.
 * Foco inicial: Cozinha (atraso de item).
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import type { CoreTask } from "../../infra/docker-core/types";
import { readOpenTasks } from "../../infra/readers/TaskReader";
import {
  acknowledgeTask,
  resolveTask,
} from "../../infra/writers/TaskWriter";

interface TaskPanelProps {
  restaurantId: string;
  station?: "BAR" | "KITCHEN" | "SERVICE";
  onTaskAcknowledged?: (taskId: string) => void;
}

export function TaskPanel({
  restaurantId,
  station,
  onTaskAcknowledged,
}: TaskPanelProps) {
  const [tasks, setTasks] = useState<CoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [evidenceInput, setEvidenceInput] = useState<Record<string, string>>(
    {}
  ); // taskId -> value
  const { runtime } = useRestaurantRuntime();

  const loadTasks = async () => {
    try {
      setLoading(true);
      if (runtime.loading || !runtime.coreReachable) {
        setTasks([]);
        return;
      }
      const openTasks = await readOpenTasks(restaurantId, station);
      setTasks(openTasks);
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar tarefas inicialmente e a cada 5 segundos
  useEffect(() => {
    if (runtime.loading || !runtime.coreReachable) {
      setTasks([]);
      setLoading(false);
      return;
    }
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [restaurantId, station, runtime.loading, runtime.coreReachable]);

  // Criação de tarefas é do Core (backend/job) ou gerente/dono. Ver CORE_TASK_EXECUTION_CONTRACT.md.
  // O painel só lê, mostra, confirma e reporta.

  const handleAcknowledge = async (taskId: string) => {
    try {
      setAcknowledging(taskId);
      await acknowledgeTask(taskId);
      await loadTasks();
      onTaskAcknowledged?.(taskId);
    } catch (err) {
      console.error("Erro ao reconhecer tarefa:", err);
    } finally {
      setAcknowledging(null);
    }
  };

  const handleResolve = async (taskId: string, task: CoreTask) => {
    try {
      setAcknowledging(taskId);

      // Coletar evidência se necessário
      const requiredEvidence = task.context?.required_evidence;
      let evidence: any = undefined;

      if (requiredEvidence === "TEMP_LOG" && evidenceInput[taskId]) {
        const tempValue = parseFloat(evidenceInput[taskId]);
        if (!isNaN(tempValue)) {
          evidence = { temperature: tempValue };
        }
      } else if (requiredEvidence === "TEXT" && evidenceInput[taskId]) {
        evidence = { text: evidenceInput[taskId] };
      }

      await resolveTask(taskId, undefined, evidence);
      // Limpar input de evidência
      setEvidenceInput((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      await loadTasks();
      onTaskAcknowledged?.(taskId);
    } catch (err) {
      console.error("Erro ao resolver tarefa:", err);
    } finally {
      setAcknowledging(null);
    }
  };

  const getPriorityColor = (priority: CoreTask["priority"]) => {
    switch (priority) {
      case "CRITICA":
        return "#dc2626"; // Vermelho
      case "ALTA":
        return "#ea580c"; // Laranja
      case "MEDIA":
        return "#eab308"; // Amarelo
      case "LOW":
        return "#3b82f6"; // Azul
      default:
        return "#6b7280"; // Cinza
    }
  };

  const getPriorityLabel = (priority: CoreTask["priority"]) => {
    switch (priority) {
      case "CRITICA":
        return "🔴 CRÍTICA";
      case "ALTA":
        return "🟠 ALTA";
      case "MEDIA":
        return "🟡 MÉDIA";
      case "LOW":
        return "🔵 BAIXA";
      default:
        return priority;
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
        }}
      >
        <div>Carregando tarefas...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f0fdf4",
          borderRadius: "8px",
          border: "1px solid #86efac",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          ✅ Sem tarefas pendentes
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Todas as tarefas estão em dia
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
          🧠 Tarefas Automáticas ({tasks.length})
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding: "12px",
              backgroundColor: "#fff",
              border: `2px solid ${getPriorityColor(task.priority)}`,
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "8px",
              }}
            >
              <div style={{ flex: 1 }}>
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
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: getPriorityColor(task.priority),
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: `${getPriorityColor(task.priority)}20`,
                    }}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                  {task.station && (
                    <span style={{ fontSize: "10px", color: "#666" }}>
                      {task.station === "KITCHEN"
                        ? "🍳"
                        : task.station === "BAR"
                        ? "🍺"
                        : "👨‍💼"}{" "}
                      {task.station}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {task.message}
                </div>
                {task.context && (
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {task.context.delay_seconds && (
                      <span>
                        Atraso: {Math.round(task.context.delay_seconds / 60)}{" "}
                        min
                      </span>
                    )}
                    {task.context.table_number && (
                      <span style={{ marginLeft: "8px" }}>
                        Mesa: {task.context.table_number}
                      </span>
                    )}
                    {task.context.category && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "10px",
                          color: "#9ca3af",
                        }}
                      >
                        {task.context.category}
                      </span>
                    )}
                  </div>
                )}

                {/* Campo de evidência se necessário */}
                {task.context?.required_evidence === "TEMP_LOG" && (
                  <div style={{ marginTop: "8px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Temperatura (°C):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={evidenceInput[task.id] || ""}
                      onChange={(e) =>
                        setEvidenceInput((prev) => ({
                          ...prev,
                          [task.id]: e.target.value,
                        }))
                      }
                      placeholder="Ex: 4.5"
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "12px",
                        width: "100px",
                      }}
                    />
                  </div>
                )}

                {task.context?.required_evidence === "TEXT" && (
                  <div style={{ marginTop: "8px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Observações:
                    </label>
                    <textarea
                      value={evidenceInput[task.id] || ""}
                      onChange={(e) =>
                        setEvidenceInput((prev) => ({
                          ...prev,
                          [task.id]: e.target.value,
                        }))
                      }
                      placeholder="Digite observações..."
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "12px",
                        width: "100%",
                        minHeight: "60px",
                        resize: "vertical",
                      }}
                    />
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  alignItems: "flex-end",
                }}
              >
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleAcknowledge(task.id)}
                    disabled={acknowledging === task.id}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: acknowledging === task.id ? "wait" : "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {acknowledging === task.id ? "..." : "✓ Reconhecer"}
                  </button>
                  <button
                    onClick={() => handleResolve(task.id, task)}
                    disabled={
                      acknowledging === task.id ||
                      (task.context?.required_evidence === "TEMP_LOG" &&
                        !evidenceInput[task.id])
                    }
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#22c55e",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        acknowledging === task.id ||
                        (task.context?.required_evidence === "TEMP_LOG" &&
                          !evidenceInput[task.id])
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      opacity:
                        acknowledging === task.id ||
                        (task.context?.required_evidence === "TEMP_LOG" &&
                          !evidenceInput[task.id])
                          ? 0.5
                          : 1,
                    }}
                  >
                    ✓ Resolver
                  </button>
                </div>
                {task.context?.legal_weight === "AUDIT_CRITICAL" && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#dc2626",
                      fontWeight: "bold",
                    }}
                  >
                    🔒 AUDIT CRITICAL
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
