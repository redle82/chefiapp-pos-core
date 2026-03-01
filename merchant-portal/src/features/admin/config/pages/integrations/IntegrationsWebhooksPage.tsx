/**
 * IntegrationsWebhooksPage - APIs & Webhooks (OUT e IN).
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md §3.2, §6, §7; CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md
 * CRUD webhook_out_config; listagem webhook_out_delivery_log.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../../context/RestaurantRuntimeContext";
import { INTEGRATION_EVENT_TYPES } from "../../../../../integrations";
import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  type ApiKeyRow,
} from "../../api/apiKeysApi";
import {
  createWebhookConfig,
  deleteWebhookConfig,
  generateWebhookSecret,
  listDeliveryLogs,
  listWebhookConfigs,
  updateWebhookConfig,
  type WebhookOutConfigRow,
  type WebhookOutDeliveryLogRow,
} from "../../api/webhookOutApi";

export function IntegrationsWebhooksPage() {
  const { t } = useTranslation("config");
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [configs, setConfigs] = useState<WebhookOutConfigRow[]>([]);
  const [logs, setLogs] = useState<WebhookOutDeliveryLogRow[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newApiKeyRevealed, setNewApiKeyRevealed] = useState<string | null>(
    null,
  );
  const [apiKeyName, setApiKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [formSecret, setFormSecret] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formEnabled, setFormEnabled] = useState(true);
  const [formDescription, setFormDescription] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [newSecretRevealed, setNewSecretRevealed] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!restaurantId) {
      setConfigs([]);
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [c, l, k] = await Promise.all([
        listWebhookConfigs(restaurantId),
        listDeliveryLogs(restaurantId, 30),
        listApiKeys(restaurantId),
      ]);
      setConfigs(c);
      setLogs(l);
      setApiKeys(k);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setFormUrl("");
    const secret = generateWebhookSecret();
    setFormSecret(secret);
    setNewSecretRevealed(secret);
    setFormEvents([]);
    setFormEnabled(true);
    setFormDescription("");
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((row: WebhookOutConfigRow) => {
    setEditingId(row.id);
    setFormUrl(row.url);
    setFormSecret(row.secret ? "********" : "");
    setNewSecretRevealed(null);
    setFormEvents(Array.isArray(row.events) ? row.events : []);
    setFormEnabled(row.enabled);
    setFormDescription(row.description ?? "");
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    setNewSecretRevealed(null);
  }, []);

  const saveForm = useCallback(async () => {
    if (!restaurantId) return;
    setFormSaving(true);
    setError(null);
    try {
      if (editingId) {
        const payload: Parameters<typeof updateWebhookConfig>[1] = {
          url: formUrl,
          events: formEvents,
          enabled: formEnabled,
          description: formDescription || undefined,
        };
        if (formSecret && formSecret !== "********")
          payload.secret = formSecret;
        const { error: err } = await updateWebhookConfig(editingId, payload);
        if (err) throw new Error(err);
      } else {
        const secret =
          formSecret && formSecret !== "********"
            ? formSecret
            : generateWebhookSecret();
        const { id, error: err } = await createWebhookConfig(restaurantId, {
          url: formUrl,
          secret,
          events: formEvents,
          enabled: formEnabled,
          description: formDescription || undefined,
        });
        if (err) throw new Error(err);
        if (id) setNewSecretRevealed(secret);
      }
      closeForm();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setFormSaving(false);
    }
  }, [
    restaurantId,
    editingId,
    formUrl,
    formSecret,
    formEvents,
    formEnabled,
    formDescription,
    closeForm,
    load,
  ]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(t("integrationsWebhooksPage.confirms.removeWebhook")))
        return;
      const { error: err } = await deleteWebhookConfig(id);
      if (err) setError(err);
      else load();
    },
    [load, t],
  );

  const toggleEvent = useCallback((ev: string) => {
    setFormEvents((prev) => {
      if (prev.length === 0) {
        return INTEGRATION_EVENT_TYPES.filter((e) => e !== ev);
      }
      if (prev.includes(ev)) return prev.filter((e) => e !== ev);
      return [...prev, ev];
    });
  }, []);

  const handleCreateApiKey = useCallback(async () => {
    if (!restaurantId) return;
    setCreatingKey(true);
    setError(null);
    try {
      const {
        id,
        key,
        error: err,
      } = await createApiKey(
        restaurantId,
        apiKeyName || t("integrationsWebhooksPage.defaultApiKeyName"),
      );
      if (err) throw new Error(err);
      if (key) setNewApiKeyRevealed(key);
      setApiKeyName("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreatingKey(false);
    }
  }, [restaurantId, apiKeyName, load, t]);

  const handleRevokeApiKey = useCallback(
    async (id: string) => {
      if (!window.confirm(t("integrationsWebhooksPage.confirms.revokeApiKey")))
        return;
      const { error: err } = await deleteApiKey(id);
      if (err) setError(err);
      else load();
    },
    [load, t],
  );

  if (!restaurantId) {
    return (
      <>
        <AdminPageHeader
          title={t("integrationsWebhooksPage.header.title")}
          subtitle={t("integrationsWebhooksPage.header.subtitle")}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {t("integrationsWebhooksPage.selectRestaurant")}
        </p>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={t("integrationsWebhooksPage.header.title")}
        subtitle={t("integrationsWebhooksPage.header.subtitle")}
      />

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "var(--status-error-bg)",
            border: "1px solid var(--status-error-border)",
            borderRadius: 8,
            color: "var(--color-error)",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
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
            {t("integrationsWebhooksPage.webhooksOut.title")}
          </h2>
          <button
            type="button"
            onClick={openCreate}
            style={{
              padding: "8px 16px",
              background: "var(--color-primary)",
              color: "var(--text-inverse)",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t("integrationsWebhooksPage.webhooksOut.add")}
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {t("integrationsWebhooksPage.loading")}
          </p>
        ) : configs.length === 0 ? (
          <div
            style={{
              padding: 24,
              border: "1px solid var(--surface-border)",
              borderRadius: 12,
              backgroundColor: "var(--card-bg-on-dark)",
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            {t("integrationsWebhooksPage.webhooksOut.empty")}
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {configs.map((c) => (
              <li
                key={c.id}
                style={{
                  padding: 16,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 12,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--text-primary)",
                    }}
                  >
                    {c.description || c.url}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      marginTop: 4,
                    }}
                  >
                    {c.url} ·{" "}
                    {c.events?.length === 0
                      ? t("integrationsWebhooksPage.webhooksOut.allEvents")
                      : t("integrationsWebhooksPage.webhooksOut.eventsCount", {
                          count: c.events?.length ?? 0,
                        })}{" "}
                    ·{" "}
                    {c.enabled
                      ? t("integrationsWebhooksPage.webhooksOut.active")
                      : t("integrationsWebhooksPage.webhooksOut.inactive")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--card-bg-on-dark)",
                      border: "1px solid var(--surface-border)",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                      color: "var(--text-primary)",
                    }}
                  >
                    {t("integrationsWebhooksPage.actions.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--status-error-bg)",
                      border: "1px solid var(--status-error-border)",
                      borderRadius: 6,
                      fontSize: 13,
                      color: "var(--color-error)",
                      cursor: "pointer",
                    }}
                  >
                    {t("integrationsWebhooksPage.actions.remove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
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
            {t("integrationsWebhooksPage.apiIn.title")}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              value={apiKeyName}
              onChange={(e) => setApiKeyName(e.target.value)}
              placeholder={t(
                "integrationsWebhooksPage.apiIn.keyNamePlaceholder",
              )}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--surface-border)",
                borderRadius: 8,
                fontSize: 14,
                width: 160,
              }}
            />
            <button
              type="button"
              onClick={handleCreateApiKey}
              disabled={creatingKey}
              style={{
                padding: "8px 16px",
                background: "var(--color-primary)",
                color: "var(--text-inverse)",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                cursor: creatingKey ? "wait" : "pointer",
              }}
            >
              {creatingKey
                ? t("integrationsWebhooksPage.apiIn.creatingKey")
                : t("integrationsWebhooksPage.apiIn.createKey")}
            </button>
          </div>
        </div>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          {t("integrationsWebhooksPage.apiIn.usagePrefix")}{" "}
          <code
            style={{
              background: "var(--status-primary-bg)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            X-API-Key
          </code>{" "}
          {t("integrationsWebhooksPage.apiIn.usageOr")}{" "}
          <code
            style={{
              background: "var(--status-primary-bg)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Authorization: Bearer &lt;key&gt;
          </code>
          . {t("integrationsWebhooksPage.apiIn.usageLimit")}
        </p>
        {apiKeys.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {t("integrationsWebhooksPage.apiIn.empty")}
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {apiKeys.map((k) => (
              <li
                key={k.id}
                style={{
                  padding: 12,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 500, fontSize: 14 }}>{k.name}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {t("integrationsWebhooksPage.apiIn.lastUsed")}:{" "}
                  {k.last_used_at
                    ? new Date(k.last_used_at).toLocaleString()
                    : t("integrationsWebhooksPage.apiIn.never")}
                </span>
                <button
                  type="button"
                  onClick={() => handleRevokeApiKey(k.id)}
                  style={{
                    padding: "6px 12px",
                    background: "var(--status-error-bg)",
                    border: "1px solid var(--status-error-border)",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "var(--color-error)",
                    cursor: "pointer",
                  }}
                >
                  {t("integrationsWebhooksPage.actions.revoke")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {newApiKeyRevealed && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
          onClick={() => setNewApiKeyRevealed(null)}
        >
          <div
            style={{
              background: "var(--card-bg-on-dark)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>
              {t("integrationsWebhooksPage.apiIn.keyCreatedTitle")}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--text-secondary)",
              }}
            >
              {t("integrationsWebhooksPage.apiIn.keyCreatedHint")}
            </p>
            <pre
              style={{
                margin: "12px 0",
                padding: 12,
                background: "var(--card-bg-on-dark)",
                border: "1px solid var(--surface-border)",
                borderRadius: 8,
                fontSize: 13,
                overflow: "auto",
                wordBreak: "break-all",
              }}
            >
              {newApiKeyRevealed}
            </pre>
            <button
              type="button"
              onClick={() => setNewApiKeyRevealed(null)}
              style={{
                padding: "8px 16px",
                background: "var(--color-primary)",
                color: "var(--text-inverse)",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {t("integrationsWebhooksPage.actions.close")}
            </button>
          </div>
        </div>
      )}

      {formOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeForm}
        >
          <div
            style={{
              background: "var(--card-bg-on-dark)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow:
                "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18 }}>
              {editingId
                ? t("integrationsWebhooksPage.form.editTitle")
                : t("integrationsWebhooksPage.form.newTitle")}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>
                {t("integrationsWebhooksPage.form.url")}
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder={t(
                    "integrationsWebhooksPage.form.urlPlaceholder",
                  )}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 6,
                  }}
                />
              </label>
              <label style={{ fontSize: 14, fontWeight: 500 }}>
                {t("integrationsWebhooksPage.form.secret")}
                {editingId && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: "var(--text-secondary)",
                      fontWeight: 400,
                    }}
                  >
                    {t("integrationsWebhooksPage.form.keepBlank")}
                  </span>
                )}
                <input
                  type="text"
                  value={formSecret}
                  onChange={(e) => setFormSecret(e.target.value)}
                  placeholder={
                    editingId
                      ? "********"
                      : t("integrationsWebhooksPage.form.generatedOnCreate")
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 6,
                  }}
                />
                {newSecretRevealed && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "var(--status-warning-text)",
                    }}
                  >
                    {t("integrationsWebhooksPage.form.secretHint")}
                  </p>
                )}
              </label>
              <label style={{ fontSize: 14, fontWeight: 500 }}>
                {t("integrationsWebhooksPage.form.description")}
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t(
                    "integrationsWebhooksPage.form.descriptionPlaceholder",
                  )}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 6,
                  }}
                />
              </label>
              <div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {t("integrationsWebhooksPage.form.events")}
                </span>
                <span
                  style={{
                    marginLeft: 8,
                    color: "var(--text-secondary)",
                    fontSize: 13,
                  }}
                >
                  {t("integrationsWebhooksPage.form.eventsHint")}
                </span>
                <div
                  style={{
                    marginTop: 8,
                    maxHeight: 160,
                    overflow: "auto",
                    border: "1px solid var(--surface-border)",
                    borderRadius: 6,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {INTEGRATION_EVENT_TYPES.map((ev) => (
                    <label
                      key={ev}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          formEvents.length === 0 || formEvents.includes(ev)
                        }
                        onChange={() => toggleEvent(ev)}
                      />
                      {ev}
                    </label>
                  ))}
                </div>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                />
                {t("integrationsWebhooksPage.form.active")}
              </label>
            </div>
            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={closeForm}
                style={{
                  padding: "8px 16px",
                  background: "var(--card-bg-on-dark)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                {t("integrationsWebhooksPage.actions.cancel")}
              </button>
              <button
                type="button"
                onClick={saveForm}
                disabled={formSaving || !formUrl.trim()}
                style={{
                  padding: "8px 16px",
                  background: "var(--color-primary)",
                  color: "var(--text-inverse)",
                  border: "none",
                  borderRadius: 8,
                  cursor: formSaving ? "wait" : "pointer",
                }}
              >
                {formSaving
                  ? t("integrationsWebhooksPage.form.saving")
                  : editingId
                  ? t("integrationsWebhooksPage.actions.save")
                  : t("integrationsWebhooksPage.actions.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 12px 0",
            color: "var(--text-primary)",
          }}
        >
          {t("integrationsWebhooksPage.logs.title")}
        </h2>
        {logs.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {t("integrationsWebhooksPage.logs.empty")}
          </p>
        ) : (
          <div
            style={{
              overflow: "auto",
              border: "1px solid var(--surface-border)",
              borderRadius: 12,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--card-bg-on-dark)",
                    borderBottom: "1px solid var(--surface-border)",
                  }}
                >
                  <th style={{ textAlign: "left", padding: 10 }}>
                    {t("integrationsWebhooksPage.logs.headers.event")}
                  </th>
                  <th style={{ textAlign: "left", padding: 10 }}>
                    {t("integrationsWebhooksPage.logs.headers.url")}
                  </th>
                  <th style={{ textAlign: "left", padding: 10 }}>
                    {t("integrationsWebhooksPage.logs.headers.status")}
                  </th>
                  <th style={{ textAlign: "left", padding: 10 }}>
                    {t("integrationsWebhooksPage.logs.headers.attempt")}
                  </th>
                  <th style={{ textAlign: "left", padding: 10 }}>
                    {t("integrationsWebhooksPage.logs.headers.date")}
                  </th>
                  <th style={{ textAlign: "left", padding: 10 }}>
                    {t("integrationsWebhooksPage.logs.headers.error")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    style={{ borderBottom: "1px solid var(--surface-border)" }}
                  >
                    <td style={{ padding: 10 }}>{l.event}</td>
                    <td
                      style={{
                        padding: 10,
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {l.url}
                    </td>
                    <td style={{ padding: 10 }}>
                      {l.status_code != null ? (
                        <span
                          style={{
                            color:
                              l.status_code >= 200 && l.status_code < 300
                                ? "var(--color-success)"
                                : "var(--color-error)",
                          }}
                        >
                          {l.status_code}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: 10 }}>{l.attempt}</td>
                    <td style={{ padding: 10 }}>
                      {new Date(l.attempted_at).toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {l.error_message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p
        style={{ marginTop: 24, fontSize: 13, color: "var(--text-secondary)" }}
      >
        {t("integrationsWebhooksPage.contract")}
      </p>
    </>
  );
}
