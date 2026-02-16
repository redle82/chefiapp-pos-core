/**
 * IntegrationsWhatsAppPage - WhatsApp (canal de entrada, notificações).
 * Ref: CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md
 *
 * Config (número, token), ativar/desativar, eventos que disparam notificação.
 */

import { useCallback, useEffect, useState } from "react";
import { IntegrationRegistry } from "../../../../../integrations";
import { createWhatsAppAdapter, WHATSAPP_ADAPTER_ID } from "../../../../../integrations/adapters/whatsapp/WhatsAppAdapter";
import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";

const NOTIFY_CANDIDATES = ["order.ready", "order.completed", "alert.raised", "task.created"];

export function IntegrationsWhatsAppPage() {
  const [enabled, setEnabled] = useState(false);
  const [notifyEvents, setNotifyEvents] = useState<string[]>(["order.ready", "alert.raised"]);
  const [phonePlaceholder, setPhonePlaceholder] = useState("");
  const [tokenPlaceholder, setTokenPlaceholder] = useState("");

  const registerAdapter = useCallback(() => {
    const adapter = createWhatsAppAdapter({
      enabled,
      notifyEvents,
    });
    IntegrationRegistry.register(adapter).catch(() => {});
  }, [enabled, notifyEvents]);

  useEffect(() => {
    registerAdapter();
    return () => {
      IntegrationRegistry.unregister(WHATSAPP_ADAPTER_ID).catch(() => {});
    };
  }, [registerAdapter]);

  const toggleNotify = (ev: string) => {
    setNotifyEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  return (
    <>
      <AdminPageHeader
        title="WhatsApp"
        subtitle="Canal de entrada (pedidos) e notificações (pedido pronto, alertas)."
      />

      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            padding: 24,
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            backgroundColor: "var(--card-bg-on-dark)",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "var(--text-primary)" }}>
            Configuração
          </h2>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span style={{ fontSize: 14 }}>Ativar integração WhatsApp</span>
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
            <label style={{ fontSize: 14 }}>
              Número WhatsApp Business
              <input
                type="text"
                value={phonePlaceholder}
                onChange={(e) => setPhonePlaceholder(e.target.value)}
                placeholder="+351..."
                style={{
                  display: "block",
                  marginTop: 4,
                  padding: 8,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  width: "100%",
                }}
              />
            </label>
            <label style={{ fontSize: 14 }}>
              Token / App Secret (Webhook)
              <input
                type="password"
                value={tokenPlaceholder}
                onChange={(e) => setTokenPlaceholder(e.target.value)}
                placeholder="Configurar em produção"
                style={{
                  display: "block",
                  marginTop: 4,
                  padding: 8,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  width: "100%",
                }}
              />
            </label>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            Webhook de entrada: <code style={{ background: "var(--status-primary-bg)", padding: "2px 6px", borderRadius: 4 }}>POST /api/v1/integrations/whatsapp/incoming</code> (com API Key e, opcional, X-Hub-Signature-256).
          </p>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px 0", color: "var(--text-primary)" }}>
          Eventos que disparam notificação
        </h2>
        <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "var(--text-secondary)" }}>
          Quando estes eventos ocorrem, o adapter pode enviar mensagem via WhatsApp (ex.: pedido pronto, alerta).
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {NOTIFY_CANDIDATES.map((ev) => (
            <label key={ev} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={notifyEvents.includes(ev)}
                onChange={() => toggleNotify(ev)}
              />
              {ev}
            </label>
          ))}
        </div>
      </section>
    </>
  );
}
