/**
 * WhatsAppAdapter — Stub for Vite build.
 * Real implementation lives in src/integrations/adapters/whatsapp/.
 */

export const WHATSAPP_ADAPTER_ID = "whatsapp";

export interface WhatsAppAdapterConfig {
  enabled: boolean;
  notifyEvents: string[];
  notifyTo?: string[];
}

interface IntegrationAdapterStub {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  onEvent: (event: unknown) => Promise<void>;
  healthCheck: () => Promise<{ status: string; lastCheckedAt: number }>;
}

export function createWhatsAppAdapter(
  _config?: Partial<WhatsAppAdapterConfig>,
): IntegrationAdapterStub {
  return {
    id: WHATSAPP_ADAPTER_ID,
    name: "WhatsApp",
    description: "Stub adapter",
    capabilities: ["orders.receive", "notifications.send"],
    async onEvent() {},
    async healthCheck() {
      return { status: "ok", lastCheckedAt: Date.now() };
    },
  };
}

export const WhatsAppAdapter = createWhatsAppAdapter();
