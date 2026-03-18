/**
 * Quick86Toggle — Context menu for quick product availability management.
 *
 * Triggered by long-press or right-click on a product card in POS grid.
 * Allows: mark 86'd, set stock count manually, view current status.
 * Dark theme consistent with TPV.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductStockStatus } from "../../core/inventory/StockStatusService";

interface Quick86ToggleProps {
  productId: string;
  productName: string;
  currentStatus: ProductStockStatus | undefined;
  onToggle: (productId: string, markUnavailable: boolean, reason?: string) => Promise<void>;
  onSetStock?: (productId: string, quantity: number) => Promise<void>;
  onClose: () => void;
}

const OVERLAY: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.5)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const MENU: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 14,
  padding: 20,
  minWidth: 300,
  maxWidth: 380,
  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
};

const TITLE: React.CSSProperties = {
  color: "#f4f4f5",
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 4,
};

const SUBTITLE: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 12,
  marginBottom: 16,
};

const STATUS_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  background: "#27272a",
  borderRadius: 8,
  marginBottom: 12,
  fontSize: 13,
  color: "#d4d4d8",
};

const STATUS_DOT = (available: boolean): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: available ? "#22c55e" : "#ef4444",
  flexShrink: 0,
});

const ACTION_BTN = (
  variant: "danger" | "success" | "neutral",
): React.CSSProperties => ({
  display: "block",
  width: "100%",
  padding: "12px 16px",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  marginBottom: 8,
  color: "#fff",
  background:
    variant === "danger"
      ? "#dc2626"
      : variant === "success"
      ? "#16a34a"
      : "#27272a",
});

const INPUT_ROW: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 8,
};

const INPUT_STYLE: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  background: "#27272a",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  color: "#f4f4f5",
  fontSize: 14,
  outline: "none",
};

const SMALL_BTN: React.CSSProperties = {
  padding: "10px 16px",
  background: "#f97316",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  flexShrink: 0,
};

const CANCEL_BTN: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 16px",
  background: "none",
  border: "1px solid #3f3f46",
  borderRadius: 10,
  color: "#a1a1aa",
  fontWeight: 500,
  fontSize: 13,
  cursor: "pointer",
  marginTop: 4,
};

export function Quick86Toggle({
  productId,
  productName,
  currentStatus,
  onToggle,
  onSetStock,
  onClose,
}: Quick86ToggleProps) {
  const [stockInput, setStockInput] = useState("");
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAvailable = currentStatus?.available !== false;

  const handleToggle = useCallback(async () => {
    setBusy(true);
    try {
      await onToggle(productId, isAvailable, isAvailable ? "Desativado manualmente" : undefined);
    } finally {
      setBusy(false);
      onClose();
    }
  }, [productId, isAvailable, onToggle, onClose]);

  const handleSetStock = useCallback(async () => {
    const qty = parseInt(stockInput, 10);
    if (isNaN(qty) || qty < 0 || !onSetStock) return;
    setBusy(true);
    try {
      await onSetStock(productId, qty);
    } finally {
      setBusy(false);
      onClose();
    }
  }, [productId, stockInput, onSetStock, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      style={OVERLAY}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={MENU} ref={menuRef} data-testid="quick-86-toggle">
        <div style={TITLE}>{productName}</div>
        <div style={SUBTITLE}>Gerir disponibilidade</div>

        {/* Current status */}
        <div style={STATUS_ROW}>
          <div style={STATUS_DOT(isAvailable)} />
          <span>
            {isAvailable ? "Disponivel" : "Indisponivel (86'd)"}
          </span>
          {currentStatus?.currentStock !== null &&
            currentStatus?.currentStock !== undefined && (
              <span style={{ marginLeft: "auto", color: "#a1a1aa" }}>
                Stock: {currentStatus.currentStock}
              </span>
            )}
        </div>

        {/* Toggle button */}
        <button
          style={ACTION_BTN(isAvailable ? "danger" : "success")}
          onClick={handleToggle}
          disabled={busy}
        >
          {busy
            ? "A processar..."
            : isAvailable
            ? "Marcar como 86'd (Indisponivel)"
            : "Marcar como Disponivel"}
        </button>

        {/* Manual stock input */}
        {onSetStock && (
          <>
            <div
              style={{
                color: "#71717a",
                fontSize: 11,
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: 0.8,
                marginBottom: 6,
                marginTop: 4,
              }}
            >
              Definir stock manualmente
            </div>
            <div style={INPUT_ROW}>
              <input
                type="number"
                min={0}
                placeholder="Quantidade"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                style={INPUT_STYLE}
              />
              <button
                style={SMALL_BTN}
                onClick={handleSetStock}
                disabled={busy || !stockInput}
              >
                Definir
              </button>
            </div>
          </>
        )}

        {/* Stock info */}
        {currentStatus?.reason && (
          <div
            style={{
              fontSize: 12,
              color: "#a1a1aa",
              padding: "6px 12px",
              background: "#1c1c1e",
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            Motivo: {currentStatus.reason}
          </div>
        )}

        <button style={CANCEL_BTN} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
