/**
 * EventMonitor - Monitor de Eventos Operacionais
 *
 * Observa pedidos e mesas para detectar eventos que geram tarefas automáticas.
 *
 * LOOP MÍNIMO: Evento → Tarefa → Saúde
 * - Detecta order_delayed e table_unattended
 * - Detecta restaurante ocioso (RESTAURANT_IDLE) — CONTRATO_DE_ATIVIDADE_OPERACIONAL
 * - Gera tarefas via EventTaskGenerator
 * - Funciona em DEV_STABLE_MODE com fallbacks seguros
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import {
  getLastOrderCreatedAt,
  readActiveOrders,
} from "../../infra/readers/OrderReader";
import { alertEngine } from "../alerts/AlertEngine";
import { getAlertThresholds } from "../alerts/alertThresholds";
import { Logger } from "../logger";
import { CashRegisterEngine } from "../tpv/CashRegister";
import { eventTaskGenerator } from "./EventTaskGenerator";

interface DetectedEvent {
  type: "order_delayed" | "table_unattended";
  restaurantId: string;
  data: Record<string, any>;
  detectedAt: Date;
}

/**
 * Monitor que observa pedidos e mesas, detecta eventos e gera tarefas.
 */
export class EventMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private currentRestaurantId: string | null = null;
  private lastCheckedOrders: Set<string> = new Set();
  private lastCheckedTables: Set<number> = new Set();

  // Relaxed UUID regex: accepts any UUID-shaped string (incl. seed/nil UUIDs)
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Iniciar monitoramento contínuo (idempotente: se já a correr para o mesmo restaurantId, não relançar).
   */
  start(restaurantId: string): void {
    if (!EventMonitor.UUID_REGEX.test(restaurantId)) {
      if (import.meta.env.DEV) {
        Logger.debug(
          `[EventMonitor] Skipped: restaurantId is not a valid UUID: ${restaurantId}`,
        );
      }
      return;
    }
    if (this.intervalId && this.currentRestaurantId === restaurantId) {
      return;
    }
    if (this.intervalId) {
      this.stop();
    }

    this.currentRestaurantId = restaurantId;

    const thresholds = getAlertThresholds(restaurantId);

    // Primeira verificação imediata
    this.checkEvents(restaurantId).catch((error) => {
      Logger.error("[EventMonitor] Erro na verificação inicial:", error);
    });

    // Verificações periódicas
    this.intervalId = setInterval(() => {
      this.checkEvents(restaurantId).catch((error) => {
        Logger.error("[EventMonitor] Erro na verificação periódica:", error);
      });
    }, thresholds.event_check_interval_ms);
  }

  /**
   * Parar monitoramento
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.currentRestaurantId = null;
    }
  }

  /**
   * Verificar eventos uma vez
   */
  async checkEvents(restaurantId: string): Promise<DetectedEvent[]> {
    const events: DetectedEvent[] = [];
    const thresholds = getAlertThresholds(restaurantId);

    try {
      // 1. Verificar pedidos atrasados
      const delayedEvents = await this.checkDelayedOrders(
        restaurantId,
        thresholds.order_delayed_minutes,
      );
      events.push(...delayedEvents);

      // 2. Verificar mesas sem atendimento
      const unattendedEvents = await this.checkUnattendedTables(
        restaurantId,
        thresholds.table_unattended_minutes,
      );
      events.push(...unattendedEvents);

      // 2b. Sensor de ociosidade (CONTRATO_DE_ATIVIDADE_OPERACIONAL): turno aberto + zero pedidos ativos + tempo desde último pedido >= X → RESTAURANT_IDLE
      await this.checkIdle(restaurantId);

      // 3. Gerar tarefas apenas quando não existir tarefa OPEN para o mesmo order/evento (idempotência)
      let generated = 0;
      for (const event of events) {
        const created = await this.generateTaskFromEventIfNeeded(
          restaurantId,
          event,
        );
        if (created) generated++;
      }

      // 4. Criar alertas reais para eventos detectados (FASE 5 triggers)
      for (const event of events) {
        if (event.type === "order_delayed") {
          await alertEngine.createFromEvent(restaurantId, "order_delayed", {
            orderId: event.data.orderId,
            orderNumber: event.data.orderNumber,
            delayMinutes: event.data.delayMinutes,
            entityType: "order",
            entityId: event.data.orderId,
          });
          if (event.data.delayMinutes >= thresholds.order_sla_breach_minutes) {
            await alertEngine.createFromEvent(
              restaurantId,
              "order_sla_breach",
              {
                orderId: event.data.orderId,
                orderNumber: event.data.orderNumber,
                delayMinutes: event.data.delayMinutes,
                entityType: "order",
                entityId: event.data.orderId,
              },
            );
          }
        } else if (event.type === "table_unattended") {
          await alertEngine.createFromEvent(restaurantId, "table_unattended", {
            tableId: event.data.tableId,
            tableNumber: event.data.tableNumber,
            orderId: event.data.orderId,
            minutesUnattended: event.data.minutesUnattended,
            entityType: "table",
            entityId: event.data.tableId,
          });
        }
      }

      // 5. Salão sobrecarregado: quando 2+ mesas sem atendimento (dining_overloaded)
      const unattendedCount = events.filter(
        (e) => e.type === "table_unattended",
      ).length;
      if (unattendedCount >= 2) {
        const unattendedTables = events
          .filter((e) => e.type === "table_unattended")
          .map((e) => e.data.tableNumber);
        await alertEngine.createFromEvent(restaurantId, "dining_overloaded", {
          count: unattendedCount,
          tableNumbers: unattendedTables,
          entityType: "dining",
        });
      }

      if (events.length > 0) {
        Logger.info(
          `[EventMonitor] ✅ ${events.length} evento(s) detectado(s), ${generated} tarefa(s) criada(s) (idempotente)`,
        );
      }
    } catch (error) {
      Logger.error("[EventMonitor] Erro ao verificar eventos:", error);
    }

    return events;
  }

  /**
   * Verificar pedidos atrasados
   */
  private async checkDelayedOrders(
    restaurantId: string,
    orderDelayedThresholdMinutes: number,
  ): Promise<DetectedEvent[]> {
    const events: DetectedEvent[] = [];

    try {
      const activeOrders = await readActiveOrders(restaurantId);
      const now = Date.now();

      for (const order of activeOrders) {
        // Ignorar pedidos já pagos ou cancelados
        if (order.status === "PAID" || order.status === "CANCELLED") {
          continue;
        }

        // Calcular tempo decorrido desde criação
        const createdAt = new Date(order.created_at).getTime();
        const elapsedMinutes = (now - createdAt) / (1000 * 60);

        // Se passou do threshold e ainda não detectamos este pedido
        if (
          elapsedMinutes > orderDelayedThresholdMinutes &&
          !this.lastCheckedOrders.has(order.id)
        ) {
          events.push({
            type: "order_delayed",
            restaurantId,
            data: {
              orderId: order.id,
              orderNumber: order.number || order.short_id,
              tableNumber: order.table_number,
              delayMinutes: Math.floor(elapsedMinutes),
              status: order.status,
            },
            detectedAt: new Date(),
          });

          this.lastCheckedOrders.add(order.id);
        }

        // Limpar pedidos resolvidos do cache
        if (order.status === "PAID" || order.status === "CANCELLED") {
          this.lastCheckedOrders.delete(order.id);
        }
      }
    } catch (error) {
      Logger.error(
        "[EventMonitor] Erro ao verificar pedidos atrasados:",
        error,
      );
    }

    return events;
  }

  /**
   * Verificar mesas sem atendimento
   */
  private async checkUnattendedTables(
    restaurantId: string,
    tableUnattendedThresholdMinutes: number,
  ): Promise<DetectedEvent[]> {
    const events: DetectedEvent[] = [];

    try {
      // Buscar mesas ocupadas
      const { data: tables, error } = await dockerCoreClient
        .from("gm_tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("status", "occupied");

      if (error) {
        // Suppress abort/timeout and connection errors — backend is slow or offline
        const msg =
          typeof error === "object" && error !== null && "message" in error
            ? String((error as any).message)
            : "";
        const isSilent =
          msg.includes("aborted") ||
          msg.includes("Failed to fetch") ||
          msg.includes("Backend indisponível");
        if (!isSilent) {
          Logger.error("[EventMonitor] Erro ao buscar mesas:", error);
        }
        return events;
      }

      const now = Date.now();

      for (const table of tables || []) {
        // Buscar pedido ativo da mesa
        const { data: orderData } = await dockerCoreClient
          .from("gm_orders")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("table_id", table.id)
          .in("status", ["OPEN", "IN_PREP"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!orderData) {
          continue;
        }

        // Calcular tempo desde criação do pedido
        const orderCreatedAt = new Date(orderData.created_at).getTime();
        const elapsedMinutes = (now - orderCreatedAt) / (1000 * 60);

        // Se passou do threshold e ainda não detectamos esta mesa
        if (
          elapsedMinutes > tableUnattendedThresholdMinutes &&
          !this.lastCheckedTables.has(table.number)
        ) {
          events.push({
            type: "table_unattended",
            restaurantId,
            data: {
              tableId: table.id,
              tableNumber: table.number,
              orderId: orderData.id,
              minutesUnattended: Math.floor(elapsedMinutes),
            },
            detectedAt: new Date(),
          });

          this.lastCheckedTables.add(table.number);
        }
      }

      // Limpar mesas livres do cache
      const freeTables = (tables || []).filter(
        (t: Record<string, any>) => t.status === "free",
      );
      for (const table of freeTables) {
        this.lastCheckedTables.delete(table.number);
      }
    } catch (error) {
      Logger.error("[EventMonitor] Erro ao verificar mesas:", error);
    }

    return events;
  }

  /**
   * Sensor de ociosidade (CONTRATO_DE_ATIVIDADE_OPERACIONAL).
   * IF turno_aberto AND pedidos_ativos == 0 AND minutos_desde_ultimo_pedido >= X THEN emit RESTAURANT_IDLE.
   * Idempotência: no máximo uma tarefa OPEN com source_event = restaurant_idle por restaurante.
   */
  private async checkIdle(restaurantId: string): Promise<void> {
    const thresholds = getAlertThresholds(restaurantId);
    const idleMinutes = thresholds.restaurant_idle_minutes ?? 15;

    try {
      // 1. Turno tem de estar aberto
      const register = await CashRegisterEngine.getOpenCashRegister(
        restaurantId,
      );
      if (!register) return;

      // 2. Zero pedidos ativos
      const activeOrders = await readActiveOrders(restaurantId);
      if (activeOrders.length > 0) return;

      // 3. Tempo desde último pedido >= idleMinutes
      const lastOrderCreatedAt = await getLastOrderCreatedAt(restaurantId);
      const now = Date.now();
      const minutesSinceLastOrder = lastOrderCreatedAt
        ? (now - new Date(lastOrderCreatedAt).getTime()) / (1000 * 60)
        : Infinity;
      if (minutesSinceLastOrder < idleMinutes) return;

      // 4. Idempotência: já existe tarefa OPEN restaurant_idle para este restaurante?
      const hasExisting = await this.hasExistingOpenTaskForRestaurantIdle(
        restaurantId,
      );
      if (hasExisting) return;

      const taskId = await eventTaskGenerator.generateFromEvent(
        restaurantId,
        "restaurant_idle",
        {
          minutesSinceLastOrder: Math.floor(minutesSinceLastOrder),
          shiftOpenAt: register.openedAt?.toISOString?.() ?? undefined,
        },
      );
      if (taskId) {
        Logger.info(
          `[EventMonitor] ✅ RESTAURANT_IDLE: tarefa ${taskId} criada (modo interno)`,
        );
      }
    } catch (error) {
      // Suppress abort/timeout errors — CashRegister already returns null for these
      const msg = error instanceof Error ? error.message : String(error);
      const isSilent =
        msg.includes("aborted") ||
        msg.includes("Failed to fetch") ||
        msg.includes("Backend indisponível");
      if (!isSilent) {
        Logger.error("[EventMonitor] Erro ao verificar ociosidade:", error);
      }
    }
  }

  /**
   * Verifica se já existe tarefa OPEN com source_event = restaurant_idle para o restaurante (idempotência).
   */
  private async hasExistingOpenTaskForRestaurantIdle(
    restaurantId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await dockerCoreClient
        .from("gm_tasks")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("source_event", "restaurant_idle")
        .eq("status", "OPEN")
        .limit(1)
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Verifica se já existe tarefa OPEN para o mesmo pedido e tipo de evento (idempotência).
   */
  private async hasExistingOpenTaskForOrder(
    restaurantId: string,
    sourceEvent: string,
    orderId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await dockerCoreClient
        .from("gm_tasks")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("order_id", orderId)
        .eq("source_event", sourceEvent)
        .eq("status", "OPEN")
        .limit(1)
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Gera tarefa apenas se ainda não existir OPEN para o mesmo order/evento (idempotência).
   */
  private async generateTaskFromEventIfNeeded(
    restaurantId: string,
    event: DetectedEvent,
  ): Promise<boolean> {
    const orderId = event.data?.orderId;
    if (orderId) {
      const exists = await this.hasExistingOpenTaskForOrder(
        restaurantId,
        event.type,
        orderId,
      );
      if (exists) return false;
    }

    try {
      const taskId = await eventTaskGenerator.generateFromEvent(
        event.restaurantId,
        event.type,
        event.data,
      );

      if (taskId) {
        Logger.info(
          `[EventMonitor] ✅ Tarefa gerada: ${taskId} para evento ${event.type}`,
        );
        return true;
      }
    } catch (error) {
      Logger.error(
        `[EventMonitor] Erro ao gerar tarefa para evento ${event.type}:`,
        error,
      );
    }
    return false;
  }
}

export const eventMonitor = new EventMonitor();
