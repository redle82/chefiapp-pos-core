/**
 * TaskDetailPage - Página de Detalhes da Tarefa
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { taskAnalytics } from "../../core/tasks/TaskAnalytics";
import {
  fetchTaskByIdFromCoreTODO,
  updateTaskStatusFromCoreTODO,
} from "../../core/tasks/TaskDetailCoreTODO";
import { taskFeedback } from "../../core/tasks/TaskFeedback";
import type { Task } from "../../core/tasks/TaskFiltering";

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(3);

  useEffect(() => {
    if (!taskId) return;

    const fetchTask = async () => {
      const taskData = await fetchTaskByIdFromCoreTODO(taskId);

      setTask(taskData);

      // Buscar histórico
      const taskHistory = await taskAnalytics.getTaskHistory(taskId);
      setHistory(taskHistory);

      setLoading(false);
    };

    fetchTask();
  }, [taskId]);

  const handleUpdateStatus = async (newStatus: Task["status"]) => {
    if (!taskId) return;

    try {
      await updateTaskStatusFromCoreTODO(taskId, newStatus);

      // Recarregar tarefa
      window.location.reload();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!taskId || !feedback) return;

    try {
      await taskFeedback.addFeedback({
        taskId,
        feedback,
        rating,
      });

      // Recarregar tarefa
      window.location.reload();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <p style={{ color: "#666" }}>Carregando tarefa...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <p style={{ color: "#666" }}>Tarefa não encontrada</p>
        <button onClick={() => navigate("/tasks")}>Voltar</button>
      </div>
    );
  }

  const slaImpact = taskFeedback.calculateSlaImpact(task);

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/tasks")}
        style={{
          marginBottom: "16px",
          padding: "8px 16px",
          backgroundColor: "#f0f0f0",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ← Voltar
      </button>

      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
        {task.title}
      </h1>

      {task.description && (
        <p style={{ marginBottom: "24px", color: "#666" }}>
          {task.description}
        </p>
      )}

      {/* Status e Ações */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "8px" }}>
        {task.status === "pending" && (
          <button
            onClick={() => handleUpdateStatus("in_progress")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Iniciar Tarefa
          </button>
        )}
        {task.status === "in_progress" && (
          <button
            onClick={() => handleUpdateStatus("completed")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Concluir Tarefa
          </button>
        )}
      </div>

      {/* Informações */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
          Informações
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div>
            <strong>Status:</strong> {task.status}
          </div>
          <div>
            <strong>Prioridade:</strong> {task.priority}
          </div>
          <div>
            <strong>Categoria:</strong> {task.category}
          </div>
          <div>
            <strong>Prazo:</strong> {task.dueAt.toLocaleString()}
          </div>
          {slaImpact.delayMinutes > 0 && (
            <div style={{ color: "#dc3545" }}>
              <strong>Atraso:</strong> {Math.round(slaImpact.delayMinutes)}{" "}
              minutos
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {task.status === "completed" && !task.feedback && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}
          >
            Adicionar Feedback
          </h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Como foi a execução desta tarefa?"
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              marginBottom: "8px",
            }}
          />
          <div style={{ marginBottom: "8px" }}>
            <label>Avaliação: </label>
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                style={{
                  margin: "0 4px",
                  padding: "4px 8px",
                  backgroundColor: rating >= r ? "#ffc107" : "#f0f0f0",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ⭐
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmitFeedback}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Enviar Feedback
          </button>
        </div>
      )}

      {task.feedback && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}
          >
            Feedback
          </h2>
          <p>{task.feedback}</p>
          {task.feedbackRating && (
            <div>Avaliação: {"⭐".repeat(task.feedbackRating)}</div>
          )}
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <div>
          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}
          >
            Histórico
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {history.map((entry, index) => (
              <div
                key={index}
                style={{
                  padding: "8px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <div>
                  <strong>{entry.action}</strong> por {entry.actorName}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {entry.timestamp.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
