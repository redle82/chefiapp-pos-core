/**
 * Turno — Ritual de Abertura e Fechamento (/app/staff/mode/turn).
 *
 * Esta tela é um RITUAL, não uma configuração.
 * Cada turno é um ciclo completo: checklist → operação → encerramento → relatório.
 *
 * Regras:
 *   • Menos "configuração", mais "cerimônia operacional"
 *   • Abertura = checklist antes de começar
 *   • Fechamento = resumo + PDF
 * UI: scroll é do Shell; sem duplicar layout.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { isBackendUnavailable } from "../../../infra/menuPilotFallback";
import {
  BEFORE_OPEN_TASK_KEYS,
  useBeforeOpenRitual,
} from "../../../core/ritual";
import { useShift } from "../../../core/shift/ShiftContext";
import { useToast } from "../../../ui/design-system";
import { Button } from "../../../ui/design-system/Button";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import { exportShiftReportToPDF } from "../utils/exportToPDF";

export function ManagerTurnoPage() {
  const { tasks, activeWorkerId, operationalContract, currentRiskLevel } =
    useStaff();
  const navigate = useNavigate();
  const { info } = useToast();
  const restaurantId = operationalContract?.id ?? null;
  const {
    tasks: ritualTasks,
    markDone: markRitualDone,
    refresh: refreshRitual,
  } = useBeforeOpenRitual(restaurantId);
  const shift = useShift();

  const [showOpenShiftForm, setShowOpenShiftForm] = useState(false);
  const [openShiftError, setOpenShiftError] = useState<string | null>(null);
  const [openShiftCaixa, setOpenShiftCaixa] = useState("0");
  const [openShiftSubmitting, setOpenShiftSubmitting] = useState(false);

  const getHealthStatus = (risk: number) => {
    if (risk < 30) return { label: "Healthy Flow" };
    if (risk < 70) return { label: "High Tension" };
    return { label: "Critical Risk" };
  };
  const health = getHealthStatus(currentRiskLevel);

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setOpenShiftError(null);
    const eur = parseFloat(openShiftCaixa.replace(",", "."));
    if (Number.isNaN(eur) || eur < 0) {
      setOpenShiftError("Valor de caixa inicial inválido.");
      return;
    }
    const openingBalanceCents = Math.round(eur * 100);
    setOpenShiftSubmitting(true);
    try {
      const { data, error: rpcError } = await dockerCoreClient.rpc(
        "open_cash_register_atomic",
        {
          p_restaurant_id: restaurantId,
          p_name: "Caixa Principal",
          p_opened_by: "Operador TPV",
          p_opening_balance_cents: openingBalanceCents,
        },
      );
      if (rpcError) {
        setOpenShiftError(
          "Não foi possível abrir o turno. Verifique a ligação ao servidor e tente novamente.",
        );
        return;
      }
      if (!data?.id) {
        setOpenShiftError("Não foi possível abrir o turno. Tente novamente.");
        return;
      }
      markRitualDone(BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO);
      await shift?.refreshShiftStatus();
      refreshRitual();
      setShowOpenShiftForm(false);
      setOpenShiftCaixa("0");
      info("Turno aberto.");
    } catch (err) {
      const msg = isBackendUnavailable(err)
        ? "Servidor indisponível. Verifique a ligação e tente novamente."
        : "Não foi possível abrir o turno. Tente novamente.";
      setOpenShiftError(msg);
    } finally {
      setOpenShiftSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const totalTasks = tasks.length;
    const shiftDuration = "8h 30m";

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
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
        paddingBottom: 80,
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 0,
          color: colors.text.primary,
        }}
      >
        Ritual do Turno
      </h1>

      {!shift?.isShiftOpen && (
        <Card surface="layer1" padding="md">
          <Text
            size="sm"
            weight="bold"
            color="primary"
            style={{ marginBottom: 8 }}
          >
            Turno fechado
          </Text>
          <Text size="sm" color="tertiary">
            Abra o turno para iniciar o registo operacional e o fluxo de caixa.
          </Text>
          {restaurantId ? (
            <Button
              size="sm"
              tone="action"
              style={{ marginTop: 12 }}
              onClick={() => setShowOpenShiftForm(true)}
            >
              Abrir turno
            </Button>
          ) : (
            <Button
              size="sm"
              tone="neutral"
              style={{ marginTop: 12 }}
              onClick={() => navigate("/app/staff/home")}
            >
              Voltar ao início
            </Button>
          )}
        </Card>
      )}

      {/* Antes de abrir — ritual */}
      {restaurantId && ritualTasks.length > 0 && (
        <Card
          surface="layer1"
          padding="md"
          style={{ borderLeft: `4px solid ${colors.action.base}` }}
        >
          <Text
            size="sm"
            weight="bold"
            color="primary"
            style={{ marginBottom: 12 }}
          >
            Checklist de abertura
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ritualTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 0",
                  borderBottom:
                    task.key === BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO
                      ? `1px solid ${colors.border.subtle}`
                      : "none",
                }}
              >
                <span style={{ fontSize: 18 }}>
                  {task.status === "done" ? "✅" : "⏳"}
                </span>
                <Text
                  size="sm"
                  color={task.status === "done" ? "tertiary" : "primary"}
                  style={{ flex: 1 }}
                >
                  {task.label}
                </Text>
                {task.status === "pending" &&
                  (task.key === BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO ? (
                    <>
                      {!showOpenShiftForm ? (
                        <Button
                          size="sm"
                          tone="action"
                          onClick={() => setShowOpenShiftForm(true)}
                        >
                          Abrir turno
                        </Button>
                      ) : (
                        <form
                          onSubmit={handleOpenShiftSubmit}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            minWidth: 200,
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                color: colors.text.tertiary,
                              }}
                            >
                              Caixa inicial (€)
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={openShiftCaixa}
                              onChange={(e) =>
                                setOpenShiftCaixa(e.target.value)
                              }
                              placeholder="0"
                              disabled={openShiftSubmitting}
                              style={{
                                padding: "8px 10px",
                                fontSize: 14,
                                border: `1px solid ${colors.border.subtle}`,
                                borderRadius: 6,
                                background: colors.surface.base,
                                color: colors.text.primary,
                              }}
                            />
                          </label>
                          {openShiftError && (
                            <Text size="xs" color="destructive">
                              {openShiftError}
                            </Text>
                          )}
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button
                              type="submit"
                              size="sm"
                              tone="action"
                              disabled={openShiftSubmitting}
                            >
                              {openShiftSubmitting ? "A abrir..." : "Confirmar"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowOpenShiftForm(false);
                                setOpenShiftError(null);
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      )}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      tone="action"
                      onClick={() => markRitualDone(task.key)}
                    >
                      Marcar concluída
                    </Button>
                  ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Exportar PDF */}
      <Card surface="layer1" padding="md">
        <Text
          size="sm"
          weight="bold"
          color="primary"
          style={{ marginBottom: 8 }}
        >
          Relatório de turno
        </Text>
        <Button tone="action" variant="outline" onClick={handleExportPDF}>
          📄 Exportar PDF
        </Button>
      </Card>

      {/* Linha do tempo / eventos */}
      <Card surface="layer1" padding="md">
        <Text
          size="sm"
          weight="bold"
          color="primary"
          style={{ marginBottom: 8 }}
        >
          Linha do tempo
        </Text>
        <Text size="sm" color="tertiary">
          Nenhum evento registado neste turno.
        </Text>
      </Card>
    </div>
  );
}
