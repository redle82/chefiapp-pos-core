/**
 * EightySixBadge — Visual badge overlay for product availability.
 *
 * Shows "86'd" in red when a product is unavailable,
 * or "LOW" in amber when stock is running low.
 */

import type { ProductStockStatus } from "../../core/inventory/StockStatusService";

interface EightySixBadgeProps {
  status: ProductStockStatus;
}

const BADGE_BASE: React.CSSProperties = {
  position: "absolute",
  top: 6,
  right: 6,
  padding: "2px 8px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  lineHeight: "18px",
  pointerEvents: "none",
  zIndex: 5,
};

const BADGE_86D: React.CSSProperties = {
  ...BADGE_BASE,
  background: "rgba(239, 68, 68, 0.9)",
  color: "#fff",
};

const BADGE_LOW: React.CSSProperties = {
  ...BADGE_BASE,
  background: "rgba(245, 158, 11, 0.9)",
  color: "#fff",
};

const OVERLAY_86D: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0, 0, 0, 0.55)",
  borderRadius: "inherit",
  zIndex: 4,
  pointerEvents: "none",
};

export function EightySixBadge({ status }: EightySixBadgeProps) {
  if (status.available && !status.isLowStock) {
    return null;
  }

  if (!status.available) {
    return (
      <>
        <div style={OVERLAY_86D} />
        <div style={BADGE_86D} data-testid="badge-86d">
          86'd
        </div>
      </>
    );
  }

  if (status.isLowStock) {
    const stockLabel =
      status.currentStock !== null ? ` (${status.currentStock})` : "";
    return (
      <div style={BADGE_LOW} data-testid="badge-low-stock">
        LOW{stockLabel}
      </div>
    );
  }

  return null;
}
