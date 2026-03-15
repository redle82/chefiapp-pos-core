/**
 * TiendaOnlineConfigPage → Página Web do Restaurante
 *
 * Gateway central para a presença web do restaurante:
 *  1. URL pública (copiar/abrir/preview)
 *  2. Dados públicos (endereço, horários) via PublicPresenceFields
 *  3. QR Codes (menu geral + por mesa) via PublicQRSection
 *
 * Rota: /admin/config/website
 */

import { useCallback, useEffect, useState } from "react";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { readProductAssets } from "../../../../infra/readers/ProductAssetReader";
import { readRestaurantById } from "../../../../infra/readers/RestaurantReader";
import { PublicPresenceFields } from "../../../../pages/Config/PublicPresenceFields";
import { PublicQRSection } from "../../../../pages/Config/PublicQRSection";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

/* ── helpers ─────────────────────────────────────────────── */

function buildPublicUrl(slug: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5175";
  return `${base}/public/${encodeURIComponent(slug)}`;
}

/* ── main component ──────────────────────────────────────── */

export function TiendaOnlineConfigPage() {
  const { identity } = useRestaurantIdentity();
  const restaurantId = identity?.id ?? "";

  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [assets, setAssets] = useState<
    Array<{
      id: string;
      category: string;
      label: string;
      image_url: string;
    }>
  >([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  const loadSlug = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const r = await readRestaurantById(restaurantId);
      if (r?.slug) setSlug(r.slug);
    } catch {
      /* ignore — page still usable without slug */
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadSlug();
  }, [loadSlug]);

  useEffect(() => {
    let mounted = true;
    const loadAssets = async () => {
      setAssetsLoading(true);
      const data = await readProductAssets();
      if (mounted) {
        setAssets(data);
        setAssetsLoading(false);
      }
    };
    loadAssets();
    return () => {
      mounted = false;
    };
  }, []);

  const publicUrl = slug ? buildPublicUrl(slug) : null;

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API may fail in non-secure contexts */
    }
  };

  return (
    <div className="page-enter admin-content-page" style={{ maxWidth: 720 }}>
      <AdminPageHeader
        title="Página web do restaurante"
        subtitle="Gerencie a presença online: URL pública, dados de contacto, QR codes."
      />

      {/* ── Section 1: URL pública ── */}
      <div
        style={{
          padding: 24,
          border: "1px solid var(--surface-border)",
          borderRadius: 12,
          backgroundColor: "var(--card-bg-on-dark)",
        }}
      >
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          URL pública
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          Esta é a página web do restaurante que os clientes podem aceder.
          Partilhe o link ou imprima o QR code.
        </p>

        {loading ? (
          <p
            style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}
          >
            A carregar…
          </p>
        ) : publicUrl ? (
          <div>
            {/* URL display */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: "var(--surface-elevated, #1c2333)",
                border: "1px solid var(--surface-border)",
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontFamily: "monospace",
                  color: "var(--color-primary, #22c55e)",
                  wordBreak: "break-all",
                }}
              >
                {publicUrl}
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 6,
                  cursor: "pointer",
                  backgroundColor: copied
                    ? "var(--color-success, #22c55e)"
                    : "transparent",
                  color: copied
                    ? "var(--text-inverse, #000)"
                    : "var(--text-primary)",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "Copiado!" : "Copiar link"}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 6,
                  textDecoration: "none",
                  color: "var(--text-primary)",
                  backgroundColor: "transparent",
                }}
              >
                Abrir página ↗
              </a>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              backgroundColor: "var(--status-warning-bg, #332b00)",
              border: "1px solid var(--status-warning-border, #665500)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--status-warning-text, #fbbf24)",
              }}
            >
              Configure o <strong>slug</strong> do restaurante em Config →
              General para ter uma URL pública. O slug é o nome na URL (ex:{" "}
              <code>/public/meu-restaurante</code>).
            </p>
          </div>
        )}
      </div>

      {/* ── Section 2: Dados públicos (endereço, horários) ── */}
      <PublicPresenceFields />

      {/* ── Section 3: Biblioteca de Imagens ── */}
      <div
        style={{
          padding: 24,
          border: "1px solid var(--surface-border)",
          borderRadius: 12,
          backgroundColor: "var(--card-bg-on-dark)",
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Biblioteca de Imagens
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          Imagens genericas prontas para acelerar o setup do menu. Pode usar
          como base e substituir depois por imagens proprias.
        </p>

        {assetsLoading ? (
          <p
            style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}
          >
            A carregar biblioteca...
          </p>
        ) : assets.length === 0 ? (
          <p
            style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}
          >
            Nenhum asset disponivel.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {assets.map((asset) => (
              <div
                key={asset.id}
                style={{
                  border: "1px solid var(--surface-border)",
                  borderRadius: 10,
                  padding: 12,
                  backgroundColor: "var(--surface-elevated, #1c2333)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: "var(--surface-muted, #111827)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={asset.image_url}
                    alt={asset.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {asset.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {asset.category}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 4: QR Codes ── */}
      <PublicQRSection />
    </div>
  );
}
