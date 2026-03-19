/**
 * TPVProductCard — Product card in the POS grid.
 * Ref: POS reference layout with large photo, name, description, price, cart button.
 *
 * ChefIApp additions:
 * - useStockSignals: stock badges (Indisponível / Estoque Crítico) + margin indicator.
 */

import { useState } from "react";
import { useCurrency } from "../../../core/currency/useCurrency";
import { useStockSignals } from "../../../core/operational/hooks/useStockSignals";

const ACCENT = "#f97316";

/** SVG cart icon */
function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 1h2l1.5 9h9L15 4H5" />
      <circle cx="6.5" cy="14" r="1.5" />
      <circle cx="12.5" cy="14" r="1.5" />
    </svg>
  );
}

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

  const { symbol } = useCurrency();
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

  return (
    <div
      data-testid="sovereign-tpv-product-card"
      style={{
        backgroundColor: "#1e1e1e",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: isUnavailable ? 0.45 : 1,
        transition: "transform 0.15s ease, opacity 0.2s ease",
        position: "relative",
        cursor: isUnavailable ? "default" : "pointer",
      }}
      onClick={isUnavailable ? undefined : onAdd}
      role={isUnavailable ? undefined : "button"}
      tabIndex={isUnavailable ? undefined : 0}
      aria-label={
        isUnavailable
          ? `${product.name} - ${symbol}${price} - Unavailable`
          : `${product.name} - ${symbol}${price} - Add to order`
      }
      aria-disabled={isUnavailable || undefined}
      onKeyDown={(e) => {
        if (!isUnavailable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onAdd();
        }
      }}
    >
      {/* Image (16:10 aspect) */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/10",
          backgroundColor: "#2a2a2a",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={product.name}
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

        {/* Stock badges (ChefIApp addition) */}
        {(isUnavailable || isCritical) && (
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: 6,
                backgroundColor: isUnavailable
                  ? "rgba(239,68,68,0.9)"
                  : "rgba(234,179,8,0.9)",
                color: isUnavailable ? "#fff" : "#1a1a1a",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                backdropFilter: "blur(4px)",
              }}
            >
              {isUnavailable ? "Indisponível" : "Estoque crítico"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flex: 1,
        }}
      >
        <span
          style={{
            color: "#fafafa",
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </span>
        {product.description && (
          <span
            style={{
              color: "#8a8a8a",
              fontSize: 12,
              lineHeight: 1.4,
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
            marginTop: "auto",
            paddingTop: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ color: "#fafafa", fontWeight: 700, fontSize: 16 }}>
              {symbol}
              {price}
            </span>
            {originalPrice && (
              <span
                style={{
                  color: "#666",
                  fontSize: 13,
                  textDecoration: "line-through",
                }}
              >
                {originalPrice}
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
            onClick={(e) => {
              e.stopPropagation();
              if (!isUnavailable) onAdd();
            }}
            disabled={isUnavailable}
            aria-label={
              isUnavailable
                ? `${product.name} - Unavailable`
                : `Add ${product.name} to order`
            }
            title={
              isUnavailable ? "Produto indisponível" : "Adicionar ao pedido"
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              backgroundColor: isUnavailable ? "#333" : "#2a2a2a",
              color: isUnavailable ? "#555" : "#a3a3a3",
              cursor: isUnavailable ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background-color 0.15s ease",
            }}
          >
            <CartIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
