/**
 * TPVProductCard — Card de produto na grelha (imagem, nome, descrição, preço, adicionar).
 * Usa photo_url; se falhar ou estiver vazio, usa fallbackPhotoUrl (foto de comida por categoria).
 *
 * Integração Operacional:
 * - useStockSignals: exibe badges "Estoque Crítico" / "Indisponível" e margem.
 * - Produto indisponível desabilita botão de adicionar.
 */

import { useState } from "react";
import { useStockSignals } from "../../../core/operational/hooks/useStockSignals";

export interface TPVProductCardProduct {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  photo_url?: string | null;
  original_price_cents?: number | null;
  category_id?: string | null;
}

interface TPVProductCardProps {
  product: TPVProductCardProduct;
  /** URL de foto de comida por categoria (quando photo_url falha ou está vazio) */
  fallbackPhotoUrl?: string | null;
  onAdd: () => void;
}

const PLACEHOLDER_EMOJI = "🍽️";

export function TPVProductCard({
  product,
  fallbackPhotoUrl,
  onAdd,
}: TPVProductCardProps) {
  const [primaryError, setPrimaryError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Sinais de estoque operacional
  const { isCritical, isUnavailable, marginPct } = useStockSignals(product.id);

  const primaryUrl =
    product.photo_url && !primaryError ? product.photo_url : null;
  const fallbackUrl =
    fallbackPhotoUrl && !fallbackError ? fallbackPhotoUrl : null;
  const displayUrl = primaryUrl ?? fallbackUrl;
  const showEmoji = !displayUrl;

  const price = (product.price_cents / 100).toFixed(2);
  const originalPrice = product.original_price_cents
    ? (product.original_price_cents / 100).toFixed(2)
    : null;

  // Borda reativa: vermelha se indisponível, amarela se estoque crítico
  const borderColor = isUnavailable
    ? "rgba(239, 68, 68, 0.5)"
    : isCritical
    ? "rgba(234, 179, 8, 0.5)"
    : "var(--surface-border, rgba(255,255,255,0.08))";

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg-on-dark, #262626)",
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        opacity: isUnavailable ? 0.5 : 1,
        transition: "border-color 0.3s ease, opacity 0.3s ease",
        position: "relative",
      }}
    >
      {/* Imagem rectangular no topo (aspecto 4/3) */}
      <div
        style={{
          width: "100%",
          aspectRatio: "4/3",
          backgroundColor: "var(--surface-elevated, #404040)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => {
              if (displayUrl === product.photo_url) setPrimaryError(true);
              else setFallbackError(true);
            }}
          />
        ) : (
          <span style={{ fontSize: 40 }}>{PLACEHOLDER_EMOJI}</span>
        )}
      </div>

      {/* Badges de estoque operacional */}
      {(isUnavailable || isCritical) && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
          }}
        >
          {isUnavailable ? (
            <span
              style={{
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: 4,
                backgroundColor: "rgba(239, 68, 68, 0.85)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Indisponível
            </span>
          ) : (
            <span
              style={{
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: 4,
                backgroundColor: "rgba(234, 179, 8, 0.85)",
                color: "#1a1a1a",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Estoque crítico
            </span>
          )}
        </div>
      )}
      <div
        style={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
          minHeight: 0,
        }}
      >
        <span
          style={{
            color: "var(--text-primary, #fafafa)",
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </span>
        {product.description && (
          <span
            style={{
              color: "var(--text-secondary, #a3a3a3)",
              fontSize: 12,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.description}
          </span>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                color: "var(--text-primary, #fafafa)",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              €{price}
            </span>
            {originalPrice && (
              <span
                style={{
                  color: "var(--text-tertiary, #737373)",
                  fontSize: 13,
                  textDecoration: "line-through",
                }}
              >
                €{originalPrice}
              </span>
            )}
            {marginPct != null && (
              <span
                style={{
                  color:
                    marginPct >= 50
                      ? "#22c55e"
                      : marginPct >= 20
                      ? "#eab308"
                      : "#ef4444",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {marginPct.toFixed(0)}%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={isUnavailable}
            title={
              isUnavailable ? "Produto indisponível" : "Adicionar ao pedido"
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "none",
              backgroundColor: isUnavailable
                ? "var(--surface-elevated, #404040)"
                : "var(--color-primary, #c9a227)",
              color: isUnavailable
                ? "var(--text-tertiary, #737373)"
                : "var(--text-inverse, #1a1a1a)",
              fontSize: 18,
              cursor: isUnavailable ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            🛒
          </button>
        </div>
      </div>
    </div>
  );
}
