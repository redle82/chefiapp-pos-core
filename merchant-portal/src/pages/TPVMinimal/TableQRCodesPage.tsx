/**
 * TableQRCodesPage — Generates and prints QR codes for restaurant tables.
 *
 * Route: /op/tpv/qr-codes
 * Features:
 * - Grid of table cards with QR codes
 * - Print per table or all tables
 * - QR size selector (small/medium/large)
 * - Dark theme consistent with TPV
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { qrOrderingService } from "../../core/ordering/QROrderingService";
import { useTables, TableProvider } from "../TPV/context/TableContext";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

// ─── QR Size presets ───

type QRSize = "small" | "medium" | "large";

const QR_SIZES: Record<QRSize, { px: number; label: string; cm: string }> = {
  small: { px: 96, label: "Pequeno", cm: "3cm" },
  medium: { px: 160, label: "Medio", cm: "5cm" },
  large: { px: 256, label: "Grande", cm: "8cm" },
};

// ─── Styles ───

const PAGE: React.CSSProperties = {
  padding: 24,
  minHeight: "100vh",
  background: "#0a0a0a",
  color: "#f4f4f5",
};

const HEADER: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 24,
};

const TITLE: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#f4f4f5",
};

const CONTROLS: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const SIZE_BTN = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: active ? "2px solid #f97316" : "1px solid #3f3f46",
  background: active ? "rgba(249,115,22,0.15)" : "#18181b",
  color: active ? "#f97316" : "#a1a1aa",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
});

const PRINT_BTN: React.CSSProperties = {
  padding: "10px 20px",
  background: "#f97316",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240, 1fr))",
  gap: 16,
};

const CARD: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 14,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
};

const TABLE_NUM: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#f4f4f5",
};

const QR_WRAPPER: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 10,
  padding: 12,
  display: "inline-flex",
};

const SCAN_LABEL: React.CSSProperties = {
  fontSize: 11,
  color: "#a1a1aa",
  textAlign: "center",
  fontWeight: 500,
};

const TABLE_PRINT_BTN: React.CSSProperties = {
  padding: "8px 14px",
  background: "#27272a",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  color: "#e4e4e7",
  fontWeight: 500,
  fontSize: 12,
  cursor: "pointer",
  width: "100%",
};

const EMPTY: React.CSSProperties = {
  textAlign: "center",
  color: "#71717a",
  padding: 60,
  fontSize: 15,
};

// ─── Print helpers ───

function printElements(elements: HTMLElement[], title: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = elements
    .map((el) => el.outerHTML)
    .join('<div style="page-break-after:always;margin-bottom:20px;"></div>');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { margin: 20px; font-family: system-ui, sans-serif; }
        .qr-print-card {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          margin: 10px;
          border: 1px solid #ddd;
          border-radius: 12px;
          page-break-inside: avoid;
        }
        .qr-print-card h3 { margin: 0 0 8px; font-size: 18px; }
        .qr-print-card .scan-text { font-size: 12px; color: #666; margin-top: 8px; }
        @media print {
          body { margin: 10mm; }
        }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

// ─── Main Component ───

export function TableQRCodesPage() {
  const restaurantId = useTPVRestaurantId();

  return (
    <TableProvider restaurantId={restaurantId}>
      <TableQRCodesContent restaurantId={restaurantId} />
    </TableProvider>
  );
}

function TableQRCodesContent({ restaurantId }: { restaurantId: string }) {
  const { t } = useTranslation(["operational", "common"]);
  const { tables, loading } = useTables();
  const [qrSize, setQrSize] = useState<QRSize>("medium");
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const sortedTables = useMemo(
    () =>
      [...tables].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [tables],
  );

  const handlePrintAll = useCallback(() => {
    const cards: HTMLElement[] = [];
    for (const table of sortedTables) {
      const num = table.number ?? 0;
      const url = qrOrderingService.generateTableQR(restaurantId, num);
      const card = document.createElement("div");
      card.className = "qr-print-card";
      card.innerHTML = `
        <h3>Mesa ${num}</h3>
        <div style="background:#fff;padding:12px;border-radius:8px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" width="200" height="200" />
        </div>
        <div class="scan-text">Escaneie para pedir</div>
      `;
      cards.push(card);
    }
    printElements(cards, "QR Codes - Todas as Mesas");
  }, [sortedTables, restaurantId]);

  const handlePrintSingle = useCallback(
    (tableNumber: number) => {
      const url = qrOrderingService.generateTableQR(restaurantId, tableNumber);
      const card = document.createElement("div");
      card.className = "qr-print-card";
      card.innerHTML = `
        <h3>Mesa ${tableNumber}</h3>
        <div style="background:#fff;padding:12px;border-radius:8px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}" width="300" height="300" />
        </div>
        <div class="scan-text">Escaneie para pedir</div>
      `;
      printElements([card], `QR Code - Mesa ${tableNumber}`);
    },
    [restaurantId],
  );

  if (loading) {
    return (
      <div style={PAGE}>
        <div style={EMPTY}>A carregar mesas...</div>
      </div>
    );
  }

  if (sortedTables.length === 0) {
    return (
      <div style={PAGE}>
        <div style={{ ...HEADER }}>
          <h1 style={TITLE}>QR Codes das Mesas</h1>
        </div>
        <div style={EMPTY}>
          Nenhuma mesa encontrada. Configure mesas na area de mesas primeiro.
        </div>
      </div>
    );
  }

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={HEADER}>
        <h1 style={TITLE}>QR Codes das Mesas</h1>
        <div style={CONTROLS}>
          {(Object.keys(QR_SIZES) as QRSize[]).map((size) => (
            <button
              key={size}
              style={SIZE_BTN(qrSize === size)}
              onClick={() => setQrSize(size)}
            >
              {QR_SIZES[size].label} ({QR_SIZES[size].cm})
            </button>
          ))}
          <button style={PRINT_BTN} onClick={handlePrintAll}>
            Imprimir Todos
          </button>
        </div>
      </div>

      {/* Table Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${QR_SIZES[qrSize].px + 80}px, 1fr))`,
          gap: 16,
        }}
      >
        {sortedTables.map((table) => {
          const num = table.number ?? 0;
          const url = qrOrderingService.generateTableQR(restaurantId, num);
          return (
            <div
              key={table.id}
              style={CARD}
              ref={(el) => {
                if (el) cardRefs.current.set(table.id, el);
              }}
            >
              <div style={TABLE_NUM}>Mesa {num}</div>
              <div style={QR_WRAPPER}>
                <QRCode
                  value={url}
                  size={QR_SIZES[qrSize].px}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div style={SCAN_LABEL}>Escaneie para pedir</div>
              <button
                style={TABLE_PRINT_BTN}
                onClick={() => handlePrintSingle(num)}
              >
                Imprimir QR
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
