/**
 * Card 2 — Idioma e localização (Configuração > Geral).
 * Ref: CONFIG_GENERAL_WIREFRAME.md. Guardar local só para este card.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  BackendType,
  getBackendType,
} from "../../../../core/infra/backendAdapter";
import { dockerCoreClient } from "../../../../infra/docker-core/connection";

const LOCALES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "en-CA", label: "English (Canada)" },
  { value: "en-AU", label: "English (Australia)" },
  { value: "it-IT", label: "Italiano (Italia)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
] as const;

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (Brasil)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (España)" },
  { value: "Europe/Lisbon", label: "Europe/Lisbon (Portugal)" },
  { value: "Europe/London", label: "Europe/London (UK)" },
  { value: "America/New_York", label: "America/New_York (US East)" },
  { value: "America/Chicago", label: "America/Chicago (US Central)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (US West)" },
  { value: "America/Mexico_City", label: "America/Mexico_City (México)" },
  { value: "America/Toronto", label: "America/Toronto (Canada)" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "Europe/Rome", label: "Europe/Rome (Italia)" },
  { value: "Europe/Paris", label: "Europe/Paris (France)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (Deutschland)" },
] as const;

const CURRENCIES = [
  { value: "BRL", label: "BRL (R$)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "MXN", label: "MXN ($)" },
  { value: "CAD", label: "CAD ($)" },
  { value: "AUD", label: "AUD ($)" },
] as const;

export function GeneralCardLocale() {
  const { t } = useTranslation();
  const { runtime } = useRestaurantRuntime();
  const [form, setForm] = useState({
    locale: "pt-BR",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const restaurantId = runtime.restaurant_id ?? null;

  useEffect(() => {
    if (!restaurantId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: row, error } = await dockerCoreClient
        .from("gm_restaurants")
        .select("locale,timezone,currency")
        .eq("id", restaurantId)
        .maybeSingle();
      if (cancelled || error || !row) {
        setLoaded(true);
        return;
      }
      const r = row as Record<string, unknown>;
      setForm({
        locale: (r.locale as string) ?? "pt-BR",
        timezone: (r.timezone as string) ?? "America/Sao_Paulo",
        currency: (r.currency as string) ?? "BRL",
      });
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const handleSave = async () => {
    if (!restaurantId || getBackendType() !== BackendType.docker) {
      alert("Core indisponível ou restaurante não selecionado.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await dockerCoreClient
        .from("gm_restaurants")
        .update({
          locale: form.locale,
          timezone: form.timezone,
          currency: form.currency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);
      if (error) throw new Error(error.message);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao guardar.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    backgroundColor: "var(--card-bg-on-dark)",
    borderRadius: 10,
    border: "1px solid var(--surface-border)",
    padding: 14,
  };
  const labelStyle = {
    display: "block" as const,
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: "var(--text-secondary)",
  };
  const inputStyle = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid var(--surface-border)",
    borderRadius: 6,
    fontSize: 13,
  };
  const buttonStyle = {
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "var(--color-primary)",
    color: "var(--text-inverse)",
  };

  return (
    <section style={cardStyle} aria-labelledby="card-locale-title">
      <h2
        id="card-locale-title"
        style={{
          fontSize: 14,
          fontWeight: 600,
          margin: "0 0 4px 0",
          color: "var(--text-primary)",
        }}
      >
        Idioma e localização (operacional)
      </h2>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        Em que idioma e contexto de tempo/moeda opera o TPV neste local.
      </p>
      {!loaded ? (
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          A carregar...
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <label style={labelStyle}>Idioma do TPV *</label>
            <select
              value={form.locale}
              onChange={(e) =>
                setForm((p) => ({ ...p, locale: e.target.value }))
              }
              style={inputStyle}
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fuso horário *</label>
            <select
              value={form.timezone}
              onChange={(e) =>
                setForm((p) => ({ ...p, timezone: e.target.value }))
              }
              style={inputStyle}
            >
              {TIMEZONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Moeda *</label>
            <select
              value={form.currency}
              onChange={(e) =>
                setForm((p) => ({ ...p, currency: e.target.value }))
              }
              style={inputStyle}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={buttonStyle}
            >
              {saving ? t("common:saving") : t("common:save")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
