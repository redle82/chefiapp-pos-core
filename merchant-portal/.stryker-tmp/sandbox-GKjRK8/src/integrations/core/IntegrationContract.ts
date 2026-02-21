/**
 * IntegrationContract — Contrato universal para adapters
 *
 * Regra de ouro:
 * - Adapters NÃO importam TPV, Staff ou Inventory
 * - Adapters APENAS reagem a eventos
 * - Falhas são isoladas (não quebram o sistema)
 */

import type { IntegrationEvent } from "../types/IntegrationEvent";
import type { IntegrationStatus } from "../types/IntegrationStatus";

// ─────────────────────────────────────────────────────────────
// CAPABILITIES
// ─────────────────────────────────────────────────────────────

export type IntegrationCapability =
  | "orders.receive" // Pode receber pedidos externos (ex.: WhatsApp)
  | "orders.send" // Pode enviar pedidos para fora
  | "orders.status" // Pode atualizar status de pedidos
  | "menu.sync" // Pode sincronizar cardápio
  | "delivery.track" // Pode rastrear entregas
  | "payments.process" // Pode processar pagamentos
  | "analytics.export" // Pode exportar dados
  | "notifications.send"; // Pode enviar notificações (ex.: WhatsApp order.ready, alertas)

// ─────────────────────────────────────────────────────────────
// ADAPTER INTERFACE
// ─────────────────────────────────────────────────────────────

export interface IntegrationAdapter {
  /**
   * Identificador único do adapter (slug)
   * Ex: 'gloriafood', 'ifood', 'whatsapp-orders'
   */
  readonly id: string;

  /**
   * Nome legível para UI
   * Ex: 'GloriaFood', 'iFood', 'WhatsApp Orders'
   */
  readonly name: string;

  /**
   * Descrição curta
   */
  readonly description?: string;

  /**
   * Lista de capacidades suportadas
   */
  readonly capabilities: IntegrationCapability[];

  /**
   * Handler de eventos — chamado pelo EventBus
   * Retorna void ou Promise<void>
   *
   * IMPORTANTE: Erros aqui são capturados e logados,
   * mas NÃO propagam para o resto do sistema.
   */
  onEvent?(event: IntegrationEvent): void | Promise<void>;

  /**
   * Health check — chamado periodicamente
   * Deve ser idempotente e rápido (<1s)
   */
  healthCheck?(): Promise<IntegrationStatus>;

  /**
   * Inicialização — chamado uma vez ao registrar
   * Use para setup de webhooks, conexões, etc.
   */
  initialize?(): Promise<void>;

  /**
   * Cleanup — chamado ao desregistrar
   * Use para fechar conexões, limpar recursos
   */
  dispose?(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// TYPE GUARDS
// ─────────────────────────────────────────────────────────────

export const hasCapability = (
  adapter: IntegrationAdapter,
  capability: IntegrationCapability,
): boolean => adapter.capabilities.includes(capability);

export const canReceiveOrders = (adapter: IntegrationAdapter): boolean =>
  hasCapability(adapter, "orders.receive");

export const canSyncMenu = (adapter: IntegrationAdapter): boolean =>
  hasCapability(adapter, "menu.sync");

export const canTrackDelivery = (adapter: IntegrationAdapter): boolean =>
  hasCapability(adapter, "delivery.track");

export const canSendNotifications = (adapter: IntegrationAdapter): boolean =>
  hasCapability(adapter, "notifications.send");
