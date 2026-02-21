/**
 * EventMonitorBootstrap — Liga o sensor de ociosidade no contexto operacional
 *
 * CONTRATO_DE_ATIVIDADE_OPERACIONAL: o EventMonitor só emitia restaurant_idle
 * quando o utilizador estava em /tasks (TaskDashboardPage). Assim, o sistema
 * nunca "acordava" no Dashboard ou no TPV.
 *
 * Este componente inicia o EventMonitor quando existe restaurantId (qualquer
 * rota operacional: Dashboard, TPV, KDS, Tasks, etc.). O sensor passa a correr
 * em background e a criar tarefas MODO_INTERNO quando turno aberto + zero
 * pedidos + tempo ≥ X min.
 *
 * Referência: docs/pilots/DIAGNOSTICO_CADEIA_ATIVIDADE_OPERACIONAL.md
 */
// @ts-nocheck


import { useEffect } from "react";
import { useRestaurantId } from "../../ui/hooks/useRestaurantId";
import { eventMonitor } from "./EventMonitor";

/**
 * Componente invisível que inicia/para o EventMonitor consoante o restaurantId.
 * Montar uma vez no layout operacional (ex.: AppContentWithBilling).
 */
export function EventMonitorBootstrap() {
  const { restaurantId } = useRestaurantId();

  useEffect(() => {
    if (!restaurantId) return;
    eventMonitor.start(restaurantId);
    return () => {
      eventMonitor.stop();
    };
  }, [restaurantId]);

  return null;
}
