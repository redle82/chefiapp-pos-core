import React, { useEffect, useState } from "react";
import { useStaff } from "./context/StaffContext";
// REMOVIDO: InventoryContext foi removido na refatoração Fase 1-2
import { useToast } from "../../ui/design-system";
import { StaffLayout } from "../../ui/design-system/layouts/StaffLayout";
import { Badge } from "../../ui/design-system/primitives/Badge";
import { Button } from "../../ui/design-system/primitives/Button";
import { Card } from "../../ui/design-system/primitives/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import { usePulse } from "../../ui/hooks/usePulse";
import { LiveRosterWidget } from "./components/LiveRosterWidget";
import { MiniKDSMinimal } from "./components/MiniKDSMinimal";
import { MiniTPVMinimal } from "./components/MiniTPVMinimal";
import { QuickTaskModal } from "./components/QuickTaskModal";
import { useAppStaffPermissions } from "./hooks/useAppStaffPermissions";
import { useIntegrationBridge } from "./hooks/useIntegrationBridge";
import { exportShiftReportToPDF } from "./utils/exportToPDF"; // P3-6

// Types for Mock Brain
interface MetabolicInsight {
  itemId: string;
  burnRatePerHour: number;
  daysUntilStockout: number;
  panicScore: number;
  lastPanicEvent: number;
}

export const ManagerDashboard: React.FC = () => {
  const {
    currentRiskLevel,
    tasks,
    checkOut,
    activeWorkerId,
    setTasks,
    notifyActivity,
    employees,
    operationalContract,
    createTask,
  } = useStaff();
  // REMOVIDO: useInventory foi removido na refatoração Fase 1-2
  const items: any[] = [];
  const hungerSignals: any[] = [];
  const { isAlive, pulseId } = usePulse();
  const { info } = useToast(); // P2-2 FIX: Toast para feedback de preview
  const perms = useAppStaffPermissions(); // RBAC: criar/atribuir tarefa só owner/manager

  // 🔌 INTEGRATION BRIDGE
  const {
    integrations,
    isInitialized: integrationsReady,
    aggregatedStatus,
    simulateOrder,
    simulateCancel,
    simulateDelay,
    simulateFailure,
    simulateRecovery,
    mockStats,
  } = useIntegrationBridge({ setTasks, notifyActivity });

  // Debug panel (só com ?debug=1; não bifurca por ambiente)
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
  const showDebugPanel =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "1";

  // P2-2 FIX: Wrappers com feedback para ações de preview
  const handleSimulateOrder = () => {
    simulateOrder();
    info("🧪 Simulação: Novo pedido criado (não salvo)");
  };

  const handleSimulateCancel = () => {
    simulateCancel();
    info("🧪 Simulação: Pedido cancelado (não salvo)");
  };

  const handleSimulateDelay = () => {
    simulateDelay();
    info("🧪 Simulação: Atraso simulado (não salvo)");
  };

  const handleSimulateFailure = () => {
    simulateFailure();
    info("🧪 Simulação: Falha simulado (não salvo)");
  };

  const handleSimulateRecovery = () => {
    simulateRecovery();
    info("🧪 Simulação: Recuperação simulado (não salvo)");
  };

  // Metabolic Radar State
  const [alerts, setAlerts] = useState<MetabolicInsight[]>([]);

  useEffect(() => {
    // Mock Brain Analysis
    setAlerts([
      {
        itemId: "COKE_ZERO",
        burnRatePerHour: 2.5,
        daysUntilStockout: 0.2,
        panicScore: 80,
        lastPanicEvent: Date.now(),
      },
      {
        itemId: "BEEF_PATTY",
        burnRatePerHour: 10,
        daysUntilStockout: 3,
        panicScore: 10,
        lastPanicEvent: Date.now() - 3600000,
      },
    ]);
  }, [items, pulseId]);

  // Risk Evaluation
  const getHealthStatus = (
    risk: number
  ): { status: "ready" | "warning" | "error"; label: string; icon: string } => {
    if (risk < 30)
      return { status: "ready", label: "Healthy Flow", icon: "🟢" };
    if (risk < 70)
      return { status: "warning", label: "High Tension", icon: "🟡" };
    return { status: "error", label: "Critical Risk", icon: "🔴" };
  };

  const health = getHealthStatus(currentRiskLevel);
  const interventionTasks = tasks.filter(
    (t) => t.riskLevel && t.riskLevel > 50 && t.status !== "done"
  );

  // P3-6: Export PDF handler
  const handleExportPDF = () => {
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const totalTasks = tasks.length;
    const shiftDuration = "8h 30m"; // TODO: Calculate from actual shift start time

    exportShiftReportToPDF({
      shiftDate: new Date().toLocaleDateString("pt-PT"),
      workerName: activeWorkerId || "Manager",
      role: "Manager",
      tasksCompleted: completedTasks,
      tasksTotal: totalTasks,
      shiftDuration,
      metrics: {
        pressure: currentRiskLevel,
        riskLevel: currentRiskLevel,
        healthStatus: health.label,
      },
    });
  };

  return (
    <StaffLayout
      title="Maestro View"
      userName={activeWorkerId || "Manager"}
      role="Manager"
      status="active"
      actions={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            tone="action"
            variant="outline"
            fullWidth
            onClick={handleExportPDF}
          >
            📄 Exportar PDF
          </Button>
          {perms.canCreateTask && (
            <Button
              tone="action"
              fullWidth
              onClick={() => setShowQuickTaskModal(true)}
            >
              ➕ Nova Tarefa
            </Button>
          )}
          <Button tone="neutral" variant="outline" fullWidth onClick={checkOut}>
            Sign Out
          </Button>
        </div>
      }
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          width: "100%",
        }}
      >
        {/* 0.5. LIVE ROSTER */}
        {operationalContract?.id && (
          <LiveRosterWidget restaurantId={operationalContract.id} />
        )}

        {/* 0.6. MINI KDS + TPV */}
        {operationalContract?.id && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <MiniKDSMinimal
              restaurantId={operationalContract.id}
              maxHeight="500px"
            />
            <MiniTPVMinimal
              restaurantId={operationalContract.id}
              maxHeight="500px"
            />
          </div>
        )}

        {/* QUICK TASK MODAL */}
        <QuickTaskModal
          isOpen={showQuickTaskModal}
          onClose={() => setShowQuickTaskModal(false)}
          employees={employees}
          onCreateTask={createTask}
        />

        {/* 1. PULSE DASHBOARD */}
        <Card
          surface="layer1"
          padding="xl"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 16,
            border: isAlive
              ? `1px solid ${colors.success.base}`
              : `1px solid ${colors.border.subtle}`,
            transition: "all 0.5s ease",
          }}
        >
          <div
            style={{
              fontSize: 48,
              filter: isAlive
                ? "drop-shadow(0 0 10px rgba(0,255,0,0.5))"
                : "none",
            }}
          >
            {health.icon}
          </div>
          <div>
            <Text size="2xl" weight="black" color="primary">
              {health.label}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Badge
                status={health.status}
                label={`RISK: ${currentRiskLevel.toFixed(1)}%`}
              />
            </div>
          </div>
        </Card>

        {/* 2. HUNGER SIGNALS */}
        {hungerSignals.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Text size="xs" weight="bold" color="destructive">
              METABOLIC HUNGER ({hungerSignals.length})
            </Text>
            {hungerSignals.map((signal) => (
              <Card
                key={signal.itemId}
                surface="layer2"
                padding="md"
                style={{ borderLeft: `4px solid ${colors.destructive.base}` }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Text size="lg" weight="bold" color="primary">
                      {signal.itemId}
                    </Text>
                    <Text size="sm" color="destructive">
                      Stock Critical
                    </Text>
                  </div>
                  <Button size="sm" tone="destructive">
                    Ack
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 3. METABOLIC INTELLIGENCE */}
        {alerts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Text size="xs" weight="bold" color="action">
              METABOLIC INTELLIGENCE
            </Text>
            {alerts.map((alert) => (
              <Card key={alert.itemId} surface="layer2" padding="md">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text size="md" weight="bold" color="primary">
                    {alert.itemId}
                  </Text>
                  <Badge status="warning" label="PREDICTION" size="sm" />
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text size="sm" color="tertiary">
                    Panic Score: {alert.panicScore.toFixed(1)}
                  </Text>
                  {alert.daysUntilStockout < 0.5 && (
                    <Text size="sm" color="destructive" weight="bold">
                      Stockout &lt; 12h
                    </Text>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 4. INTERVENTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Text size="xs" weight="bold" color="secondary">
            ACTIVE INTERVENTIONS ({interventionTasks.length})
          </Text>
          {interventionTasks.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                border: `1px dashed ${colors.border.subtle}`,
                borderRadius: 8,
              }}
            >
              <Text size="sm" color="tertiary">
                No manual interventions required.
              </Text>
            </div>
          ) : (
            interventionTasks.map((task) => (
              <Card key={task.id} surface="layer2" padding="md">
                <Text size="md" weight="bold" color="primary">
                  {task.title}
                </Text>
                <Text size="sm" color="secondary">
                  {task.assigneeRole} • {task.status}
                </Text>
              </Card>
            ))
          )}
        </div>

        {/* 5. INTEGRATION STATUS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text size="xs" weight="bold" color="secondary">
              INTEGRAÇÕES
            </Text>
            <Badge
              status={
                aggregatedStatus === "ok"
                  ? "ready"
                  : aggregatedStatus === "degraded"
                  ? "warning"
                  : "error"
              }
              label={aggregatedStatus.toUpperCase()}
              size="sm"
            />
          </div>
          {integrationsReady ? (
            integrations.map((integration) => (
              <Card
                key={integration.id}
                surface="layer2"
                padding="md"
                style={{
                  borderLeft: `4px solid ${
                    integration.status.status === "ok"
                      ? colors.success.base
                      : integration.status.status === "degraded"
                      ? colors.warning.base
                      : integration.status.status === "down"
                      ? colors.destructive.base
                      : colors.border.subtle
                  }`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Text size="md" weight="bold" color="primary">
                      {integration.name}
                    </Text>
                    <Text size="xs" color="tertiary">
                      {integration.capabilities.join(" • ")}
                    </Text>
                  </div>
                  <Badge
                    status={
                      integration.status.status === "ok"
                        ? "ready"
                        : integration.status.status === "degraded"
                        ? "warning"
                        : "error"
                    }
                    label={integration.status.status.toUpperCase()}
                    size="sm"
                  />
                </div>
              </Card>
            ))
          ) : (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                border: `1px dashed ${colors.border.subtle}`,
                borderRadius: 8,
              }}
            >
              <Text size="sm" color="tertiary">
                Carregando integrações...
              </Text>
            </div>
          )}
        </div>

        {/* 6. Debug panel (só com ?debug=1) */}
        {showDebugPanel && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Button
              tone="neutral"
              variant="outline"
              size="sm"
              onClick={() => setShowDevPanel(!showDevPanel)}
            >
              {showDevPanel ? "Fechar painel debug" : "Abrir painel debug"}
            </Button>

            {showDevPanel && (
              <Card
                surface="layer2"
                padding="lg"
                style={{
                  border: `2px dashed ${colors.action.base}40`,
                  background: `${colors.action.base}05`,
                }}
              >
                <Text
                  size="xs"
                  weight="bold"
                  color="action"
                  style={{ marginBottom: 16 }}
                >
                  Ferramentas de integração (debug)
                </Text>

                {/* Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                    marginBottom: 16,
                    padding: 12,
                    background: colors.surface.layer1,
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <Text size="xs" color="tertiary">
                      Events
                    </Text>
                    <Text size="lg" weight="bold" color="primary">
                      {mockStats.eventCount}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" color="tertiary">
                      Orders
                    </Text>
                    <Text size="lg" weight="bold" color="primary">
                      {mockStats.ordersInFlight}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" color="tertiary">
                      State
                    </Text>
                    <Text
                      size="sm"
                      weight="bold"
                      color={
                        mockStats.state === "connected"
                          ? "success"
                          : mockStats.state === "degraded"
                          ? "warning"
                          : "destructive"
                      }
                    >
                      {mockStats.state}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" color="tertiary">
                      Last Event
                    </Text>
                    <Text size="sm" color="secondary">
                      {mockStats.lastEventAt
                        ? new Date(mockStats.lastEventAt).toLocaleTimeString()
                        : "-"}
                    </Text>
                  </div>
                </div>

                {/* Simulation Buttons */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <Text size="xs" color="tertiary" style={{ marginBottom: 4 }}>
                    Simular Eventos:
                  </Text>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 8,
                    }}
                  >
                    <Button
                      tone="action"
                      variant="outline"
                      size="sm"
                      onClick={handleSimulateOrder}
                    >
                      📦 Novo Pedido
                    </Button>
                    <Button
                      tone="neutral"
                      variant="outline"
                      size="sm"
                      onClick={handleSimulateCancel}
                    >
                      ❌ Cancelar
                    </Button>
                    <Button
                      tone="warning"
                      variant="outline"
                      size="sm"
                      onClick={handleSimulateDelay}
                    >
                      🕐 Atraso
                    </Button>
                    <Button
                      tone="destructive"
                      variant="outline"
                      size="sm"
                      onClick={handleSimulateFailure}
                    >
                      💥 Falha
                    </Button>
                  </div>

                  {mockStats.state !== "connected" && (
                    <Button
                      tone="success"
                      variant="solid"
                      size="sm"
                      onClick={handleSimulateRecovery}
                      fullWidth
                    >
                      ✅ Recuperar
                    </Button>
                  )}

                  {/* P2-2 FIX: Indicador visual de modo preview */}
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      background: colors.warning.base + "20",
                      border: `1px solid ${colors.warning.base}40`,
                      borderRadius: 4,
                      textAlign: "center",
                    }}
                  >
                    <Text size="xs" color="warning" weight="bold">
                      ⚠️ Modo Preview: Ações não são salvas
                    </Text>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};
