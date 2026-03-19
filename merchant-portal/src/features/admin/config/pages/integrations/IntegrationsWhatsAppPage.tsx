/**
 * IntegrationsWhatsAppPage - WhatsApp Business (canal de entrada, notificações).
 * Ref: CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md
 *
 * Config (número, token), ativar/desativar, eventos que disparam notificação.
 * Persiste config no localStorage por restaurante (v1); futuro: integration_credentials.
 */

import { useCallback, useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../../context/RestaurantRuntimeContext";
import { IntegrationRegistry } from "../../../../../integrations";
import {
  createWhatsAppAdapter,
  WHATSAPP_ADAPTER_ID,
} from "../../../../../integrations/adapters/whatsapp/WhatsAppAdapter";
import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";

const NOTIFY_CANDIDATES = [
  {
    key: "order.ready",
    label: "Pedido pronto",
    desc: "Notifica quando um pedido está pronto para servir.",
  },
  {
    key: "order.completed",
    label: "Pedido concluído",
    desc: "Notifica quando um pedido é finalizado e pago.",
  },
  {
    key: "alert.raised",
    label: "Alerta operacional",
    desc: "Notifica alertas importantes (stock baixo, atraso, etc.).",
  },
  {
    key: "task.created",
    label: "Nova tarefa",
    desc: "Notifica quando uma nova tarefa é criada para a equipa.",
  },
  {
    key: "reservation.new",
    label: "Nova reserva",
    desc: "Notifica quando um cliente faz uma reserva.",
  },
];

const STORAGE_KEY = "chefiapp:whatsapp_config";

interface WhatsAppFormConfig {
  enabled: boolean;
  phone: string;
  token: string;
  notifyEvents: string[];
}

function loadConfig(restaurantId: string | null): WhatsAppFormConfig {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${restaurantId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    enabled: false,
    phone: "",
    token: "",
    notifyEvents: ["order.ready", "alert.raised"],
  };
}

function saveConfig(restaurantId: string | null, config: WhatsAppFormConfig) {
  try {
    localStorage.setItem(
      `${STORAGE_KEY}:${restaurantId}`,
      JSON.stringify(config),
    );
  } catch {
    /* ignore */
  }
}

type SaveStatus = "idle" | "saving" | "saved";

export function IntegrationsWhatsAppPage() {
  const { t } = useTranslation();
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const [config, setConfig] = useState<WhatsAppFormConfig>(() =>
    loadConfig(restaurantId),
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load config when restaurant changes
  useEffect(() => {
    setConfig(loadConfig(restaurantId));
  }, [restaurantId]);

  const registerAdapter = useCallback(() => {
    const adapter = createWhatsAppAdapter({
      enabled: config.enabled,
      notifyEvents: config.notifyEvents,
    });
    IntegrationRegistry.register(adapter).catch(() => {});
  }, [config.enabled, config.notifyEvents]);

  useEffect(() => {
    registerAdapter();
    return () => {
      IntegrationRegistry.unregister(WHATSAPP_ADAPTER_ID).catch(() => {});
    };
  }, [registerAdapter]);

  const toggleNotify = (ev: string) => {
    setConfig((prev) => ({
      ...prev,
      notifyEvents: prev.notifyEvents.includes(ev)
        ? prev.notifyEvents.filter((e) => e !== ev)
        : [...prev.notifyEvents, ev],
    }));
  };

  const handleSave = () => {
    setSaveStatus("saving");
    saveConfig(restaurantId, config);
    registerAdapter();
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 400);
  };

  const handleTestMessage = async () => {
    setTestResult(null);
    if (!config.phone) {
      setTestResult("❌ Configure um número primeiro.");
      return;
    }
    // Simulate sending a test message
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTestResult(
      `✅ Mensagem de teste enviada para ${config.phone} (simulação).`,
    );
    setTimeout(() => setTestResult(null), 5000);
  };

  const statusColor = config.enabled
    ? "var(--color-success)"
    : "var(--text-secondary)";
  const statusBg = config.enabled
    ? "var(--status-success-bg)"
    : "var(--card-bg-on-dark)";
  const testResultColor = testResult?.startsWith("✅")
    ? "var(--color-success)"
    : testResult?.startsWith("❌")
    ? "var(--color-error)"
    : "var(--text-secondary)";

  return (
    <>
      <AdminPageHeader
        title="WhatsApp Business"
        subtitle="Canal de entrada (pedidos) e notificações (pedido pronto, alertas)."
      />

      {/* ── Status + Config ── */}
      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            padding: 24,
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            backgroundColor: "var(--card-bg-on-dark)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Configuração
            </h2>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: statusBg,
                color: statusColor,
              }}
            >
              {config.enabled ? "Ativo" : "Inativo"}
            </span>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, enabled: e.target.checked }))
              }
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              Ativar integração WhatsApp Business
            </span>
          </label>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxWidth: 400,
            }}
          >
            <label style={{ fontSize: 14 }}>
              Número WhatsApp Business
              <input
                type="text"
                value={config.phone}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+351 912 345 678"
                style={{
                  display: "block",
                  marginTop: 4,
                  padding: "8px 12px",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  width: "100%",
                  backgroundColor: "var(--input-bg, #1a1a1a)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                }}
              />
            </label>
            <label style={{ fontSize: 14 }}>
              Token / App Secret (Webhook)
              <input
                type="password"
                value={config.token}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, token: e.target.value }))
                }
                placeholder="Configurar em produção"
                style={{
                  display: "block",
                  marginTop: 4,
                  padding: "8px 12px",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  width: "100%",
                  backgroundColor: "var(--input-bg, #1a1a1a)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                }}
              />
            </label>
          </div>

          <p
            style={{
              margin: "12px 0 0",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Webhook de entrada:{" "}
            <code
              style={{
                background: "var(--status-primary-bg)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              POST /api/v1/integrations/whatsapp/incoming
            </code>
          </p>

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: "#25D366",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
                opacity: saveStatus === "saving" ? 0.7 : 1,
              }}
            >
              {saveStatus === "saving"
                ? t("common:saving")
                : saveStatus === "saved"
                ? "✓ Guardado!"
                : t("common:saveConfig")}
            </button>
            <button
              onClick={handleTestMessage}
              disabled={!config.enabled}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--surface-border)",
                background: "transparent",
                color: config.enabled
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                fontSize: 13,
                cursor: config.enabled ? "pointer" : "not-allowed",
              }}
            >
              Enviar teste
            </button>
          </div>

          {testResult && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: testResultColor,
              }}
            >
              {testResult}
            </p>
          )}
        </div>
      </section>

      {/* ── Notification Events ── */}
      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            padding: 24,
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            backgroundColor: "var(--card-bg-on-dark)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: "0 0 4px 0",
              color: "var(--text-primary)",
            }}
          >
            Eventos que disparam notificação
          </h2>
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            Quando estes eventos ocorrem, o adapter envia mensagem via WhatsApp
            Business API.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {NOTIFY_CANDIDATES.map((ev) => (
              <label
                key={ev.key}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 14,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--surface-border)",
                  backgroundColor: config.notifyEvents.includes(ev.key)
                    ? "rgba(37, 211, 102, 0.05)"
                    : "transparent",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={config.notifyEvents.includes(ev.key)}
                  onChange={() => toggleNotify(ev.key)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <span
                    style={{ fontWeight: 500, color: "var(--text-primary)" }}
                  >
                    {ev.label}
                  </span>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {ev.key}
                  </span>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {ev.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ── Message Templates ── */}
      <section>
        <div
          style={{
            padding: 24,
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            backgroundColor: "var(--card-bg-on-dark)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: "0 0 12px 0",
              color: "var(--text-primary)",
            }}
          >
            Templates de mensagem
          </h2>
          <p
            style={{
              margin: "0 0 12px 0",
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            Configure os templates para cada tipo de notificação (requer
            aprovação do Meta Business).
          </p>
          <div
            style={{
              padding: 12,
              border: "1px dashed var(--surface-border)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              Em breve: editor de templates com variáveis dinâmicas (
              {"{nome_cliente}"}, {"{numero_pedido}"}, {"{nome_restaurante}"}).
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
