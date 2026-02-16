/**
 * PublicQRSection — QR para página pública (FASE 4 Passo 2)
 *
 * Dono obtém QR do menu geral e QR por mesa; cliente escaneia e acede a /public/:slug ou /public/:slug/mesa/N.
 */

import React, { useState, useEffect } from "react";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { readRestaurantById } from "../../infra/readers/RestaurantReader";
import { QRCodeGenerator, buildTableQRUrl } from "../../components/QRCodeGenerator";

function buildMenuUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5175");
  return `${base}/public/${encodeURIComponent(slug)}`;
}

export function PublicQRSection() {
  const { identity } = useRestaurantIdentity();
  const restaurantId = identity?.id ?? "";

  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState(1);
  const [showMesaQR, setShowMesaQR] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    readRestaurantById(restaurantId)
      .then((r) => {
        if (!cancelled && r?.slug) setSlug(r.slug);
      })
      .catch((err) => {
        const msg = err?.message ?? String(err);
        if (!cancelled && !msg.includes("abort") && !msg.includes("Failed to fetch")) {
          console.warn("[PublicQRSection] Erro ao carregar restaurante:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

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
          Complete a configuração do restaurante (Config → Identidade) para gerar QR codes da página pública.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>A carregar...</p>
    );
  }

  if (!slug) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 20,
          backgroundColor: "var(--status-warning-bg)",
          borderRadius: 8,
          border: "1px solid var(--status-warning-border)",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: "var(--status-warning-text)" }}>
          Configure o <strong>slug</strong> do restaurante em Config → Identidade para gerar QR codes.
          O slug é o identificador da URL (ex: <code>/public/meu-restaurante</code>).
        </p>
      </div>
    );
  }

  const menuUrl = buildMenuUrl(slug);
  const mesaUrl = buildTableQRUrl(slug, tableNumber);

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
        QR para página pública
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-secondary)" }}>
        Imprima ou mostre estes QR codes para os clientes acederem ao menu (ou à mesa). O link do menu abre a página geral; o link da mesa abre o menu já associado à mesa.
      </p>

      {/* Menu geral */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          Menu geral
        </h4>
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--text-secondary)" }}>
          <a href={menuUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
            {menuUrl}
          </a>
        </p>
        <QRCodeGenerator url={menuUrl} size={160} />
      </div>

      {/* QR por mesa */}
      <div>
        <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          QR por mesa
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: "var(--text-primary)" }}>
            Número da mesa:
            <input
              type="number"
              min={1}
              max={99}
              value={tableNumber}
              onChange={(e) => setTableNumber(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))}
              style={{
                width: 64,
                marginLeft: 8,
                padding: 6,
                border: "1px solid var(--surface-border)",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => setShowMesaQR(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--color-success)",
              color: "var(--text-inverse)",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ver QR mesa {tableNumber}
          </button>
        </div>
        {showMesaQR && (
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--text-secondary)" }}>
              <a href={mesaUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                {mesaUrl}
              </a>
            </p>
            <QRCodeGenerator url={mesaUrl} size={160} />
          </div>
        )}
      </div>
    </div>
  );
}
