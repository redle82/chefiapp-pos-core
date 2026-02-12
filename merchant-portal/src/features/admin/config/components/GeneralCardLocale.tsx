/**
 * Card 2 — Idioma e localização (Configuração > Geral).
 * Ref: CONFIG_GENERAL_WIREFRAME.md. Guardar local só para este card.
 */

import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../../../core-boundary/docker-core/connection";
import {
  BackendType,
  getBackendType,
} from "../../../../core/infra/backendAdapter";

const LOCALES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "en-US", label: "English (US)" },
] as const;

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (Brasil)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (España)" },
  { value: "Europe/Lisbon", label: "Europe/Lisbon (Portugal)" },
  { value: "America/New_York", label: "America/New_York (EUA)" },
] as const;

const CURRENCIES = [
  { value: "BRL", label: "BRL (R$)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
] as const;

export function GeneralCardLocale() {
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
    backgroundColor: "#ffffff",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: 14,
  };
  const labelStyle = {
    display: "block" as const,
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: "#374151",
  };
  const inputStyle = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #e5e7eb",
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
    backgroundColor: "#7c3aed",
    color: "#fff",
  };

  return (
    <section style={cardStyle} aria-labelledby="card-locale-title">
      <h2
        id="card-locale-title"
        style={{
          fontSize: 14,
          fontWeight: 600,
          margin: "0 0 4px 0",
          color: "#111827",
        }}
      >
        Idioma e localização (operacional)
      </h2>
      <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#6b7280" }}>
        Em que idioma e contexto de tempo/moeda opera o TPV neste local.
      </p>
      {!loaded ? (
        <p style={{ fontSize: 12, color: "#6b7280" }}>A carregar...</p>
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
              {saving ? "A guardar…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
