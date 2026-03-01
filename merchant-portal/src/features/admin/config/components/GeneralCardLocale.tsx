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
  { value: "pt-BR" },
  { value: "es-ES" },
  { value: "en-US" },
] as const;

const TIMEZONES = [
  { value: "America/Sao_Paulo" },
  { value: "Europe/Madrid" },
  { value: "Europe/Lisbon" },
  { value: "America/New_York" },
] as const;

const CURRENCIES = [
  { value: "BRL" },
  { value: "EUR" },
  { value: "USD" },
] as const;

export function GeneralCardLocale() {
  const { t } = useTranslation("config");
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
      alert(t("generalCardLocale.errors.coreUnavailable"));
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
      const msg =
        e instanceof Error
          ? e.message
          : t("generalCardLocale.errors.saveFailed");
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
        {t("generalCardLocale.title")}
      </h2>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        {t("generalCardLocale.subtitle")}
      </p>
      {!loaded ? (
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {t("generalCardLocale.loading")}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <label style={labelStyle}>
              {t("generalCardLocale.fields.locale")}
            </label>
            <select
              value={form.locale}
              onChange={(e) =>
                setForm((p) => ({ ...p, locale: e.target.value }))
              }
              style={inputStyle}
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {t("generalCardLocale.options.locales." + l.value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>
              {t("generalCardLocale.fields.timezone")}
            </label>
            <select
              value={form.timezone}
              onChange={(e) =>
                setForm((p) => ({ ...p, timezone: e.target.value }))
              }
              style={inputStyle}
            >
              {TIMEZONES.map((timezoneOption) => (
                <option key={timezoneOption.value} value={timezoneOption.value}>
                  {t(
                    "generalCardLocale.options.timezones." +
                      timezoneOption.value,
                  )}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>
              {t("generalCardLocale.fields.currency")}
            </label>
            <select
              value={form.currency}
              onChange={(e) =>
                setForm((p) => ({ ...p, currency: e.target.value }))
              }
              style={inputStyle}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t("generalCardLocale.options.currencies." + c.value)}
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
              {saving
                ? t("generalCardLocale.saving")
                : t("generalCardLocale.save")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
