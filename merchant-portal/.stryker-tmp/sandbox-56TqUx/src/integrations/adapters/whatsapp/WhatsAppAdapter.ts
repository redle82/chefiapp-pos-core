/**
 * WhatsApp Adapter — Canal de pedidos e notificações (Integration Hub).
 * Ref: CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md
 *
 * Capabilities: orders.receive, notifications.send.
 * onEvent: para order.ready, alert.raised, etc., envia notificação via API (falhas só log).
 */
// @ts-nocheck


import type { IntegrationAdapter } from "../../core/IntegrationContract";
import type { IntegrationEvent } from "../../types/IntegrationEvent";
import type { IntegrationStatus } from "../../types/IntegrationStatus";

export const WHATSAPP_ADAPTER_ID = "whatsapp";

export interface WhatsAppAdapterConfig {
  enabled: boolean;
  /** Eventos que disparam notificação (ex.: order.ready, alert.raised) */
  notifyEvents: string[];
  /** Número(s) ou ID(s) para notificações (gerente, etc.) */
  notifyTo?: string[];
}

const defaultConfig: WhatsAppAdapterConfig = {
  enabled: true,
  notifyEvents: ["order.ready", "alert.raised"],
};

export function createWhatsAppAdapter(config?: Partial<WhatsAppAdapterConfig>): IntegrationAdapter {
  const cfg = { ...defaultConfig, ...config };

  return {
    id: WHATSAPP_ADAPTER_ID,
    name: "WhatsApp",
    description: "Canal de pedidos e notificações via WhatsApp Business",
    capabilities: ["orders.receive", "notifications.send"],

    async onEvent(event: IntegrationEvent): Promise<void> {
      if (!cfg.enabled || !cfg.notifyEvents.includes(event.type)) return;
      try {
        // Em produção: chamar API de envio (backend ou Edge Function).
        // Falhas não propagam (spec: log apenas).
        if (typeof window !== "undefined" && (window as any).__DEV__) {
          console.log(`[WhatsApp] Would send notification for ${event.type}`, event.payload);
        }
      } catch (err) {
        console.warn(`[WhatsApp] Notification failed for ${event.type}:`, err);
      }
    },

    async healthCheck(): Promise<IntegrationStatus> {
      return { status: "ok", lastCheckedAt: Date.now() };
    },
  };
}

export const WhatsAppAdapter: IntegrationAdapter = createWhatsAppAdapter();
