/**
 * PublicPresenceFields — Endereço e horários para a página pública (FASE 4 Passo 1)
 *
 * O dono preenche address_text e opening_hours_text; a página /public/:slug exibe quando preenchidos.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { isBackendUnavailable } from "../../infra/menuPilotFallback";

export function PublicPresenceFields() {
  const { identity } = useRestaurantIdentity();
  const restaurantId = identity?.id ?? "";

  const [addressText, setAddressText] = useState("");
  const [openingHoursText, setOpeningHoursText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await dockerCoreClient
        .from("gm_restaurants")
        .select("address_text, opening_hours_text")
        .eq("id", restaurantId)
        .maybeSingle();
      if (error) throw error;
      if (data != null) {
        setAddressText((data as { address_text?: string | null }).address_text ?? "");
        setOpeningHoursText((data as { opening_hours_text?: string | null }).opening_hours_text ?? "");
      }
    } catch (e) {
      const msg = isBackendUnavailable(e)
        ? "Não foi possível carregar. O servidor pode estar indisponível. Tente novamente."
        : e instanceof Error ? e.message : "Erro ao carregar dados.";
      setLoadError(msg);
      setAddressText("");
      setOpeningHoursText("");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await dockerCoreClient
        .from("gm_restaurants")
        .update({
          address_text: addressText.trim() || null,
          opening_hours_text: openingHoursText.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);
      if (error) throw error;
      setMessage({ type: "ok", text: "Guardado. A página pública será atualizada." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Erro ao guardar",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!restaurantId) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 20,
          backgroundColor: "var(--card-bg-on-dark)",
          borderRadius: 8,
          border: "1px solid var(--surface-border)",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
          Complete a configuração do restaurante para editar a página pública (endereço e horários).
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>A carregar...</p>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 20,
          backgroundColor: "var(--status-error-bg)",
          borderRadius: 8,
          border: "1px solid var(--status-error-border)",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: "var(--color-error)" }}>{loadError}</p>
        <button
          type="button"
          onClick={() => load()}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            fontSize: 13,
            backgroundColor: "var(--color-primary)",
            color: "var(--text-inverse)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        backgroundColor: "var(--card-bg-on-dark)",
        borderRadius: 8,
        border: "1px solid var(--surface-border)",
      }}
    >
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
        Página pública
      </h3>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-secondary)" }}>
        Estes campos aparecem em <strong>/public/:slug</strong> (menu online). Preencha para clientes verem localização e horários.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>
            Endereço (uma linha)
          </label>
          <input
            type="text"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder="Ex: Rua das Flores 123, 1200-195 Lisboa"
            style={{
              width: "100%",
              maxWidth: 400,
              padding: 10,
              border: "1px solid var(--surface-border)",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>
            Horários (texto livre)
          </label>
          <input
            type="text"
            value={openingHoursText}
            onChange={(e) => setOpeningHoursText(e.target.value)}
            placeholder="Ex: Seg-Sex 9h-18h; Sáb 10h-14h"
            style={{
              width: "100%",
              maxWidth: 400,
              padding: 10,
              border: "1px solid var(--surface-border)",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </div>
        {message && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: message.type === "ok" ? "var(--color-success)" : "var(--color-error)",
            }}
          >
            {message.type === "ok" ? "✅ " : "❌ "}
            {message.text}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 20px",
            backgroundColor: "var(--color-primary)",
            color: "var(--text-inverse)",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
            alignSelf: "flex-start",
          }}
        >
          {saving ? "A guardar…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
