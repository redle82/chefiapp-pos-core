/**
 * Card 1 — Identidade do Restaurante (Configuração > Geral).
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

const TYPES = [
  { value: "RESTAURANT", label: "Restaurante" },
  { value: "BAR", label: "Bar" },
  { value: "HOTEL", label: "Hotel" },
  { value: "BEACH_CLUB", label: "Beach club" },
  { value: "CAFE", label: "Café" },
  { value: "OTHER", label: "Outro" },
] as const;

const COUNTRIES = [
  { value: "BR", label: "Brasil" },
  { value: "ES", label: "España" },
  { value: "PT", label: "Portugal" },
  { value: "US", label: "Estados Unidos" },
] as const;

export function GeneralCardIdentity() {
  const { t } = useTranslation();
  const { runtime } = useRestaurantRuntime();
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
      alert("Core indisponível ou restaurante não selecionado.");
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
        Identidade do Restaurante
      </h2>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        Quem somos e onde nos encontrar.
      </p>
      {!loaded ? (
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          A carregar...
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={gridRow}>
            <div>
              <label style={labelStyle}>Nome comercial *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ex: Sofia Gastrobar Ibiza"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
                style={inputStyle}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={gridRow}>
            <div>
              <label style={labelStyle}>País *</label>
              <select
                value={form.country}
                onChange={(e) =>
                  setForm((p) => ({ ...p, country: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="">Selecione</option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+34 692 054 892"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={gridRow}>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="contacto@restaurante.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Morada</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Rua, número"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={gridRow}>
            <div>
              <label style={labelStyle}>Cidade</label>
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
              <label style={labelStyle}>Código postal</label>
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
            <label style={labelStyle}>Região</label>
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
            <label style={labelStyle}>URL do logo</label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, logoUrl: e.target.value }))
              }
              placeholder="https://… (imagem do logo)"
              style={inputStyle}
            />
            {form.logoUrl && (
              <div style={{ marginTop: 6 }}>
                <img
                  src={form.logoUrl}
                  alt="Logo"
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
              {saving ? t("common:saving") : t("common:save")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
