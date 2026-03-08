/**
 * Card 3 — Texto fiscal / recibo (Configuração > Geral).
 * Ref: CONFIG_GENERAL_WIREFRAME.md.
 * Persistência: coluna receipt_extra_text em gm_restaurants (DB).
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  BackendType,
  getBackendType,
} from "../../../../core/infra/backendAdapter";
import { dockerCoreClient } from "../../../../infra/docker-core/connection";

export function GeneralCardReceipt() {
  const { t } = useTranslation();
  const { runtime } = useRestaurantRuntime();
  const [value, setValue] = useState("");
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
      setValue((r.receipt_extra_text as string) ?? "");
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
          receipt_extra_text: value.trim() || null,
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
  const textareaStyle = {
    width: "100%",
    minHeight: 52,
    padding: "6px 10px",
    border: "1px solid var(--surface-border)",
    borderRadius: 6,
    fontSize: 13,
    resize: "vertical" as const,
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
    <section style={cardStyle} aria-labelledby="card-receipt-title">
      <h2
        id="card-receipt-title"
        style={{
          fontSize: 14,
          fontWeight: 600,
          margin: "0 0 4px 0",
          color: "var(--text-primary)",
        }}
      >
        Texto fiscal / recibo
      </h2>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        Informação opcional que aparecerá nos recibos impressos (dados fiscais,
        agradecimento, política de devoluções).
      </p>
      {!loaded ? (
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          A carregar...
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <label style={labelStyle}>Informação adicional</label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ex.: NIF B-12345678. Obrigado pela sua visita."
              style={textareaStyle}
              rows={2}
            />
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
