/**
 * EventMonitor - Monitor de Eventos Operacionais
 *
 * Observa pedidos e mesas para detectar eventos que geram tarefas automáticas.
 *
 * LOOP MÍNIMO: Evento → Tarefa → Saúde
 * - Detecta order_delayed e table_unattended
 * - Gera tarefas via EventTaskGenerator
 * - Funciona em DEV_STABLE_MODE com fallbacks seguros
 */

import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import { readActiveOrders } from "../../core-boundary/readers/OrderReader";
import { eventTaskGenerator } from "./EventTaskGenerator";

const CHECK_INTERVAL_MS = 60000; // 1 minuto
const ORDER_DELAY_THRESHOLD_MINUTES = 15; // Pedido atrasado após 15 min
const TABLE_UNATTENDED_THRESHOLD_MINUTES = 10; // Mesa sem atendimento após 10 min

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
  private lastCheckedOrders: Set<string> = new Set();
  private lastCheckedTables: Set<number> = new Set();

  /**
   * Iniciar monitoramento contínuo
   */
  start(restaurantId: string): void {
    if (this.intervalId) {
      this.stop();
    }

    console.log(
      "[EventMonitor] Iniciando monitoramento para restaurante",
      restaurantId,
    );

    // Primeira verificação imediata
    this.checkEvents(restaurantId).catch((error) => {
      console.error("[EventMonitor] Erro na verificação inicial:", error);
    });

    // Verificações periódicas
    this.intervalId = setInterval(() => {
      this.checkEvents(restaurantId).catch((error) => {
        console.error("[EventMonitor] Erro na verificação periódica:", error);
      });
    }, CHECK_INTERVAL_MS);
  }

  /**
   * Parar monitoramento
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[EventMonitor] Monitoramento parado");
    }
  }

  /**
   * Verificar eventos uma vez
   */
  async checkEvents(restaurantId: string): Promise<DetectedEvent[]> {
    const events: DetectedEvent[] = [];

    try {
      // 1. Verificar pedidos atrasados
      const delayedEvents = await this.checkDelayedOrders(restaurantId);
      events.push(...delayedEvents);

      // 2. Verificar mesas sem atendimento
      const unattendedEvents = await this.checkUnattendedTables(restaurantId);
      events.push(...unattendedEvents);

      // 3. Gerar tarefas apenas quando não existir tarefa OPEN para o mesmo order/evento (idempotência)
      let generated = 0;
      for (const event of events) {
        const created = await this.generateTaskFromEventIfNeeded(
          restaurantId,
          event,
        );
        if (created) generated++;
      }

      if (events.length > 0) {
        console.log(
          `[EventMonitor] ✅ ${events.length} evento(s) detectado(s), ${generated} tarefa(s) criada(s) (idempotente)`,
        );
      }
    } catch (error) {
      console.error("[EventMonitor] Erro ao verificar eventos:", error);
    }

    return events;
  }

  /**
   * Verificar pedidos atrasados
   */
  private async checkDelayedOrders(
    restaurantId: string,
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
          elapsedMinutes > ORDER_DELAY_THRESHOLD_MINUTES &&
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
      console.error(
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
        console.error("[EventMonitor] Erro ao buscar mesas:", error);
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
          elapsedMinutes > TABLE_UNATTENDED_THRESHOLD_MINUTES &&
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
      const freeTables = (tables || []).filter((t) => t.status === "free");
      for (const table of freeTables) {
        this.lastCheckedTables.delete(table.number);
      }
    } catch (error) {
      console.error("[EventMonitor] Erro ao verificar mesas:", error);
    }

    return events;
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
        console.log(
          `[EventMonitor] ✅ Tarefa gerada: ${taskId} para evento ${event.type}`,
        );
        return true;
      }
    } catch (error) {
      console.error(
        `[EventMonitor] Erro ao gerar tarefa para evento ${event.type}:`,
        error,
      );
    }
    return false;
  }
}

export const eventMonitor = new EventMonitor();
