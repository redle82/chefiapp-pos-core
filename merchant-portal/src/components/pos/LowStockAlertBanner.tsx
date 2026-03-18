/**
 * LowStockAlertBanner — Banner shown at top of POS when products hit low stock.
 *
 * Displays a dismissible amber warning listing products with low/zero stock.
 * Dark theme consistent with TPV pages.
 */

import { useState } from "react";
import type { ProductStockStatus } from "../../core/inventory/StockStatusService";

interface LowStockAlertBannerProps {
  alerts: ProductStockStatus[];
  onDismiss?: () => void;
}

const BANNER_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 16px",
  background: "rgba(245, 158, 11, 0.12)",
  border: "1px solid rgba(245, 158, 11, 0.3)",
  borderRadius: 10,
  color: "#fbbf24",
  fontSize: 13,
  fontWeight: 500,
  lineHeight: "20px",
};

const DISMISS_BTN: React.CSSProperties = {
  marginLeft: "auto",
  flexShrink: 0,
  background: "none",
  border: "none",
  color: "#a3a3a3",
  cursor: "pointer",
  fontSize: 18,
  padding: "0 4px",
  lineHeight: 1,
};

const ICON_STYLE: React.CSSProperties = {
  fontSize: 16,
  flexShrink: 0,
};

function formatAlert(status: ProductStockStatus): string {
  const name = status.productName;
  if (!status.available) {
    return `${name} (86'd)`;
  }
  if (status.currentStock !== null) {
    const unit = status.currentStock === 1 ? "restante" : "restantes";
    return `${name} (${status.currentStock} ${unit})`;
  }
  return name;
}

export function LowStockAlertBanner({
  alerts,
  onDismiss,
}: LowStockAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const unavailable = alerts.filter((a) => !a.available);
  const lowStock = alerts.filter((a) => a.available && a.isLowStock);

  const parts: string[] = [];
  if (unavailable.length > 0) {
    parts.push(unavailable.map(formatAlert).join(", "));
  }
  if (lowStock.length > 0) {
    parts.push(lowStock.map(formatAlert).join(", "));
  }

  return (
    <div style={BANNER_STYLE} data-testid="low-stock-alert-banner">
      <span style={ICON_STYLE} role="img" aria-label="warning">
        &#9888;
      </span>
      <span>
        <strong>Stock baixo: </strong>
        {parts.join("; ")}
      </span>
      <button
        style={DISMISS_BTN}
        onClick={handleDismiss}
        aria-label="Fechar alerta"
        title="Fechar"
      >
        &times;
      </button>
    </div>
  );
}
