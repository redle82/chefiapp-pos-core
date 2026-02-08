/**
 * Tela "Agora" — tarefas pendentes (OPEN/ACKNOWLEDGED) + pedidos READY.
 * Acções: start_task, complete_task, reject_task; marcar pedido SERVED.
 * Conforme TASKS_CONTRACT_v1, ORDER_STATUS_CONTRACT_v1.
 */

import React, { useState } from "react";
import {
  completeTaskRpc,
  rejectTaskRpc,
  startTaskRpc,
} from "../../../core-boundary/writers/TaskWriter";
import { updateOrderStatus } from "../../../core/infra/CoreOrdersApi";
import { useToast } from "../../../ui/design-system";
import { Button } from "../../../ui/design-system/primitives/Button";
import { Card } from "../../../ui/design-system/primitives/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import { useAgoraData } from "../hooks/useAgoraData";
import { useAppStaffPermissions } from "../hooks/useAppStaffPermissions";
import { useAppStaffHaptics } from "../hooks/useAppStaffHaptics";

export interface AgoraSectionProps {
  restaurantId: string | undefined | null;
  userId?: string | null;
  station?: "BAR" | "KITCHEN" | "SERVICE" | null;
}

export const AgoraSection: React.FC<AgoraSectionProps> = ({
  restaurantId,
  userId,
  station,
}) => {
  const { pendingTasks, readyOrders, loading, error, refresh } = useAgoraData(
    restaurantId,
    userId,
    station
  );
  const perms = useAppStaffPermissions();
  const { success, error: toastError } = useToast();
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const { triggerHaptic } = useAppStaffHaptics();

  const handleStartTask = async (taskId: string) => {
    if (!restaurantId) return;
    triggerHaptic("primaryAction");
    setBusy((b) => ({ ...b, [taskId]: true }));
    try {
      await startTaskRpc(taskId, userId ?? null, restaurantId);
      success("Tarefa iniciada");
      await refresh();
    } catch (e) {
      toastError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy((b) => ({ ...b, [taskId]: false }));
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!restaurantId) return;
    triggerHaptic("taskComplete");
    setBusy((b) => ({ ...b, [taskId]: true }));
    try {
      await completeTaskRpc(taskId, userId ?? null, restaurantId);
      success("Tarefa concluída");
      await refresh();
    } catch (e) {
      toastError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy((b) => ({ ...b, [taskId]: false }));
    }
  };

  const handleRejectTask = async (taskId: string) => {
    if (!restaurantId) return;
    triggerHaptic("error");
    setBusy((b) => ({ ...b, [taskId]: true }));
    try {
      await rejectTaskRpc(
        taskId,
        "Rejeitado pelo staff",
        userId ?? null,
        restaurantId
      );
      success("Tarefa rejeitada");
      await refresh();
    } catch (e) {
      toastError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy((b) => ({ ...b, [taskId]: false }));
    }
  };

  const handleMarkServed = async (orderId: string) => {
    if (!restaurantId || !perms.canMarkServed) return;
    triggerHaptic("primaryAction");
    setBusy((b) => ({ ...b, [orderId]: true }));
    try {
      const result = await updateOrderStatus({
        order_id: orderId,
        restaurant_id: restaurantId,
        new_status: "SERVED",
      });
      if (result.error) throw new Error(result.error.message);
      success("Pedido marcado como entregue");
      await refresh();
    } catch (e) {
      toastError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy((b) => ({ ...b, [orderId]: false }));
    }
  };

  if (loading) {
    return (
      <Card surface="layer2" padding="md">
        <Text size="sm" color="tertiary">
          A carregar Agora...
        </Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        surface="layer2"
        padding="md"
        style={{ borderLeft: "4px solid var(--color-destructive, #ef4444)" }}
      >
        <Text size="sm" color="primary">
          {error}
        </Text>
        <Button
          size="sm"
          tone="neutral"
          style={{ marginTop: 8 }}
          onClick={refresh}
        >
          Retry
        </Button>
      </Card>
    );
  }

  const hasTasks = pendingTasks.length > 0;
  const hasOrders = readyOrders.length > 0;
  if (!hasTasks && !hasOrders) {
    return (
      <Card
        surface="layer2"
        padding="md"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 8,
        }}
      >
        <Text
          size="xs"
          weight="bold"
          color="tertiary"
          style={{ textTransform: "uppercase", letterSpacing: 1 }}
        >
          Agora
        </Text>
        <div style={{ fontSize: 28, marginTop: 4 }} aria-hidden>
          🌈
        </div>
        <Text size="sm" color="secondary" weight="bold">
          Tudo em dia
        </Text>
        <Text size="sm" color="tertiary">
          Nenhuma tarefa pendente nem pedido pronto neste momento. Mantenha o
          fluxo e fique atento a novos toques.
        </Text>
      </Card>
    );
  }

  return (
    <Card
      surface="layer2"
      padding="md"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Text
        size="xs"
        weight="bold"
        color="tertiary"
        style={{ textTransform: "uppercase", letterSpacing: 1 }}
      >
        Agora
      </Text>

      {hasTasks && (
        <div>
          <Text
            size="sm"
            weight="bold"
            color="secondary"
            style={{ marginBottom: 8 }}
          >
            Tarefas ({pendingTasks.length})
          </Text>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {pendingTasks.map((t) => (
              <li
                key={t.id}
                style={{
                  padding: 10,
                  background: "var(--color-surface-layer3, #1a1a1a)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <Text size="sm" weight="bold">
                  {t.message}
                </Text>
                <Text size="xs" color="tertiary">
                  {t.task_type} · {t.priority}{" "}
                  {t.station ? `· ${t.station}` : ""}
                </Text>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {t.status === "OPEN" && (
                    <Button
                      size="sm"
                      tone="action"
                      disabled={busy[t.id]}
                      onClick={() => handleStartTask(t.id)}
                    >
                      Iniciar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    tone="neutral"
                    variant="outline"
                    disabled={busy[t.id]}
                    onClick={() => handleCompleteTask(t.id)}
                  >
                    Concluir
                  </Button>
                  <Button
                    size="sm"
                    tone="destructive"
                    variant="outline"
                    disabled={busy[t.id]}
                    onClick={() => handleRejectTask(t.id)}
                  >
                    Rejeitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {perms.canSeeOrdersLite && hasOrders && (
        <div>
          <Text
            size="sm"
            weight="bold"
            color="secondary"
            style={{ marginBottom: 8 }}
          >
            Pedidos prontos ({readyOrders.length})
          </Text>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {readyOrders.map((o) => (
              <li
                key={o.id}
                style={{
                  padding: 10,
                  background: "var(--color-surface-layer3, #1a1a1a)",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <Text size="sm" weight="bold">
                    Pedido #{o.short_id ?? o.number ?? o.id.slice(0, 8)}
                  </Text>
                  <Text size="xs" color="tertiary">
                    Mesa {o.table_number ?? "—"} · READY
                  </Text>
                </div>
                {perms.canMarkServed && (
                  <Button
                    size="sm"
                    tone="action"
                    disabled={busy[o.id]}
                    onClick={() => handleMarkServed(o.id)}
                  >
                    Marcar entregue
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button size="sm" tone="neutral" variant="outline" onClick={refresh}>
        Actualizar
      </Button>
    </Card>
  );
};
