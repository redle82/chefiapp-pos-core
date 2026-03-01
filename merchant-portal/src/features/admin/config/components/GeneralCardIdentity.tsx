/**
 * Card 1 — Identidade do Restaurante (Configuração > Geral).
 * Ref: CONFIG_GENERAL_WIREFRAME.md. Guardar local só para este card.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import {
  BackendType,
  getBackendType,
} from "../../../../core/infra/backendAdapter";
import { dockerCoreClient } from "../../../../infra/docker-core/connection";
import { invalidateRestaurantReaderCache } from "../../../../infra/readers/RuntimeReader";

const TYPES = [
  { value: "RESTAURANT" },
  { value: "BAR" },
  { value: "HOTEL" },
  { value: "BEACH_CLUB" },
  { value: "CAFE" },
  { value: "OTHER" },
] as const;

const COUNTRIES = [
  { value: "BR" },
  { value: "ES" },
  { value: "PT" },
  { value: "US" },
] as const;

export function GeneralCardIdentity() {
  const { t } = useTranslation("config");
  const { runtime, refresh } = useRestaurantRuntime();
  const { refreshIdentity } = useRestaurantIdentity();
  const [form, setForm] = useState({
    name: "",
    type: "RESTAURANT" as string,
    country: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    state: "",
    logoUrl: "",
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
        .select("*")
        .eq("id", restaurantId)
        .maybeSingle();
      if (cancelled || error || !row) {
        setLoaded(true);
        return;
      }
      const r = row as Record<string, unknown>;
      setForm({
        name: (r.name as string) ?? "",
        type: (r.type as string) ?? "RESTAURANT",
        country: (r.country as string) ?? "",
        phone: (r.phone as string) ?? "",
        email: (r.email as string) ?? "",
        address: (r.address as string) ?? "",
        city: (r.city as string) ?? "",
        postalCode: (r.postal_code as string) ?? "",
        state: (r.state as string) ?? "",
        logoUrl: (r.logo_url as string) ?? "",
      });
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const handleSave = async () => {
    if (!restaurantId || getBackendType() !== BackendType.docker) {
      alert(t("generalCardIdentity.errors.coreUnavailable"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        country: form.country || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        postal_code: form.postalCode.trim() || null,
        state: form.state.trim() || null,
        logo_url: form.logoUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await dockerCoreClient
        .from("gm_restaurants")
        .update(payload)
        .eq("id", restaurantId);
      if (error) throw new Error(error.message);

      invalidateRestaurantReaderCache(restaurantId);
      await Promise.allSettled([refreshIdentity(), refresh()]);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : t("generalCardIdentity.errors.saveFailed");
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
  const gridRow = {
    display: "grid" as const,
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  };

  return (
    <section style={cardStyle} aria-labelledby="card-identity-title">
      <h2
        id="card-identity-title"
        style={{
          fontSize: 14,
          fontWeight: 600,
          margin: "0 0 4px 0",
          color: "var(--text-primary)",
        }}
      >
        {t("generalCardIdentity.title")}
      </h2>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        {t("generalCardIdentity.subtitle")}
      </p>
      {!loaded ? (
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {t("generalCardIdentity.loading")}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={gridRow}>
            <div>
              <label style={labelStyle}>
                {t("generalCardIdentity.fields.commercialName")}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder={t(
                  "generalCardIdentity.placeholders.commercialName",
                )}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("generalCardIdentity.fields.type")}
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
                style={inputStyle}
              >
                {TYPES.map((typeOption) => (
                  <option key={typeOption.value} value={typeOption.value}>
                    {t("generalCardIdentity.types." + typeOption.value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={gridRow}>
            <div>
              <label style={labelStyle}>
                {t("generalCardIdentity.fields.country")}
              </label>
              <select
                value={form.country}
                onChange={(e) =>
                  setForm((p) => ({ ...p, country: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="">
                  {t("generalCardIdentity.placeholders.select")}
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {t("generalCardIdentity.countries." + c.value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                {t("generalCardIdentity.fields.phone")}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder={t("generalCardIdentity.placeholders.phone")}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={gridRow}>
            <div>
              <label style={labelStyle}>
                {t("generalCardIdentity.fields.email")}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder={t("generalCardIdentity.placeholders.email")}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("generalCardIdentity.fields.address")}
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                placeholder={t("generalCardIdentity.placeholders.address")}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={gridRow}>
            <div>
              <label style={labelStyle}>
                {t("generalCardIdentity.fields.city")}
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("generalCardIdentity.fields.postalCode")}
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, postalCode: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>
              {t("generalCardIdentity.fields.state")}
            </label>
            <input
              type="text"
              value={form.state}
              onChange={(e) =>
                setForm((p) => ({ ...p, state: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {t("generalCardIdentity.fields.logoUrl")}
            </label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, logoUrl: e.target.value }))
              }
              placeholder={t("generalCardIdentity.placeholders.logoUrl")}
              style={inputStyle}
            />
            {form.logoUrl && (
              <div style={{ marginTop: 6 }}>
                <img
                  src={form.logoUrl}
                  alt={t("generalCardIdentity.logoAlt")}
                  style={{
                    maxWidth: 64,
                    maxHeight: 64,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={buttonStyle}
            >
              {saving
                ? t("generalCardIdentity.saving")
                : t("generalCardIdentity.save")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
