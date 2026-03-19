/**
 * SoftwareTpvPage — Configuración e Modo rápido do TPV.
 * Abrir TPV em janela dedicada (sem redundância com Módulos / Tienda de dispositivos).
 * Cards Configuración e Modo rápido ativos (locale/currency/cierre + quick mode).
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  BackendType,
  getBackendType,
} from "../../../../core/infra/backendAdapter";
import { openTpvInNewWindow } from "../../../../core/operational/openOperationalWindow";
import { dockerCoreClient } from "../../../../infra/docker-core/connection";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { getTpvPreferences, setTpvPreferences } from "../tpvPreferencesStorage";

const LOCALES = [
  { value: "pt-BR", labelKey: "softwareTpv.localePtBR" },
  { value: "es-ES", labelKey: "softwareTpv.localeEsES" },
  { value: "en-US", labelKey: "softwareTpv.localeEnUS" },
  { value: "pt-PT", labelKey: "softwareTpv.localePtPT" },
  { value: "it-IT", labelKey: "softwareTpv.localeItIT" },
  { value: "fr-FR", labelKey: "softwareTpv.localeFrFR" },
  { value: "de-DE", labelKey: "softwareTpv.localeDeDE" },
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

const SHORTCUT_KEYS = [
  "softwareTpv.shortcut1",
  "softwareTpv.shortcut2",
  "softwareTpv.shortcut3",
  "softwareTpv.shortcut4",
] as const;

const cardStyle = {
  border: "1px solid var(--surface-border)",
  borderRadius: 12,
  padding: 16,
  backgroundColor: "var(--card-bg-on-dark)",
} as const;

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

export function SoftwareTpvPage() {
  const { t } = useTranslation("config");
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? null;

  const [configForm, setConfigForm] = useState({
    locale: "pt-BR",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    confirmOnClose: true,
  });
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const [quickMode, setQuickMode] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      setConfigLoaded(true);
      setPrefsLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: row, error } = await dockerCoreClient
        .from("gm_restaurants")
        .select("locale,timezone,currency")
        .eq("id", restaurantId)
        .maybeSingle();
      if (cancelled) return;
      if (!error && row) {
        const r = row as Record<string, unknown>;
        setConfigForm((prev) => ({
          ...prev,
          locale: (r.locale as string) ?? "pt-BR",
          timezone: (r.timezone as string) ?? "America/Sao_Paulo",
          currency: (r.currency as string) ?? "BRL",
        }));
      }
      setConfigLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => {
    const prefs = getTpvPreferences(restaurantId);
    setConfigForm((prev) => ({
      ...prev,
      confirmOnClose: prefs.confirmOnClose,
    }));
    setQuickMode(prefs.quickMode);
    setPrefsLoaded(true);
  }, [restaurantId]);

  const handleSaveConfig = async () => {
    if (!restaurantId || getBackendType() !== BackendType.docker) {
      alert(t("softwareTpv.errorCoreUnavailable"));
      return;
    }
    setConfigSaving(true);
    try {
      const { error } = await dockerCoreClient
        .from("gm_restaurants")
        .update({
          locale: configForm.locale,
          timezone: configForm.timezone,
          currency: configForm.currency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);
      if (error) throw new Error(error.message);
      setTpvPreferences(restaurantId, {
        confirmOnClose: configForm.confirmOnClose,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("softwareTpv.errorSave");
      alert(msg);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleToggleQuickMode = () => {
    const next = !quickMode;
    setQuickMode(next);
    setTpvPreferences(restaurantId, { quickMode: next });
  };

  return (
    <div className="page-enter admin-content-page" style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title={t("softwareTpv.title")}
        subtitle={t("softwareTpv.subtitle")}
        actions={
          <button
            type="button"
            onClick={openTpvInNewWindow}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-primary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t("softwareTpv.openInNewWindow")}
          </button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* Card Configuração */}
        <section style={cardStyle} aria-labelledby="tpv-config-title">
          <h3
            id="tpv-config-title"
            style={{
              margin: "0 0 12px 0",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {t("softwareTpv.configCardTitle")}
          </h3>
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            {t("softwareTpv.configCardDesc")}
          </p>
          {!configLoaded ? (
            <p
              style={{ margin: 0, fontSize: 13, color: "var(--text-tertiary)" }}
            >
              {t("softwareTpv.loading")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>{t("softwareTpv.languageLabel")}</label>
                <select
                  value={configForm.locale}
                  onChange={(e) =>
                    setConfigForm((p) => ({ ...p, locale: e.target.value }))
                  }
                  style={inputStyle}
                >
                  {LOCALES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {t(l.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t("softwareTpv.timezoneLabel")}</label>
                <select
                  value={configForm.timezone}
                  onChange={(e) =>
                    setConfigForm((p) => ({ ...p, timezone: e.target.value }))
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
                <label style={labelStyle}>{t("softwareTpv.currencyLabel")}</label>
                <select
                  value={configForm.currency}
                  onChange={(e) =>
                    setConfigForm((p) => ({ ...p, currency: e.target.value }))
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
                <label
                  style={{
                    ...labelStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={configForm.confirmOnClose}
                    onChange={(e) =>
                      setConfigForm((p) => ({
                        ...p,
                        confirmOnClose: e.target.checked,
                      }))
                    }
                  />
                  {t("softwareTpv.confirmOnCloseLabel")}
                </label>
              </div>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={configSaving}
                style={buttonStyle}
              >
                {configSaving ? t("common:saving") : t("common:save")}
              </button>
            </div>
          )}
        </section>

        {/* Card Modo rápido */}
        <section style={cardStyle} aria-labelledby="tpv-quick-title">
          <h3
            id="tpv-quick-title"
            style={{
              margin: "0 0 12px 0",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {t("softwareTpv.quickModeTitle")}
          </h3>
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            {t("softwareTpv.quickModeDesc")}
          </p>
          {!prefsLoaded ? (
            <p
              style={{ margin: 0, fontSize: 13, color: "var(--text-tertiary)" }}
            >
              {t("softwareTpv.loading")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={quickMode}
                  onChange={handleToggleQuickMode}
                />
                {t("softwareTpv.activateQuickMode")}
              </label>
              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {t("softwareTpv.shortcutsTitle")}
                </span>
                <ul
                  style={{
                    margin: "6px 0 0 0",
                    paddingLeft: 20,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {SHORTCUT_KEYS.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
