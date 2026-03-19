/**
 * QRCodeTableGenerator -- Reusable QR code generator for restaurant tables.
 *
 * Generates a QR code for the customer ordering URL:
 *   /order/{restaurantId}?table={tableNumber}
 *
 * Features:
 * - Shows table number prominently with the QR
 * - Print individual table QR codes
 * - Configurable QR size
 * - Dark theme (neutral-900 bg, amber accents)
 *
 * Usage:
 *   <QRCodeTableGenerator
 *     restaurantId="abc-123"
 *     tableNumber={5}
 *     size="medium"
 *   />
 */

import { useCallback, useRef } from "react";
import QRCode from "react-qr-code";
import { qrOrderingService } from "../../core/ordering/QROrderingService";

// ─── Types ───

export type QRSize = "small" | "medium" | "large";

export const QR_SIZE_CONFIG: Record<
  QRSize,
  { px: number; label: string; cm: string }
> = {
  small: { px: 96, label: "Small", cm: "3cm" },
  medium: { px: 160, label: "Medium", cm: "5cm" },
  large: { px: 256, label: "Large", cm: "8cm" },
};

export interface QRCodeTableGeneratorProps {
  restaurantId: string;
  tableNumber: number;
  /** QR code display size. Default: "medium" */
  size?: QRSize;
  /** Hide the print button. Default: false */
  hidePrint?: boolean;
  /** Label for the table (default: "Mesa") */
  tableLabel?: string;
  /** Label for the scan hint (default: "Scan to order") */
  scanLabel?: string;
  /** Label for the print button (default: "Print QR") */
  printLabel?: string;
}

// ─── Styles ───

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

const PRINT_BTN: React.CSSProperties = {
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

// ─── Print helper ───

function printSingleQR(tableNumber: number, url: string, scanText: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code - Mesa ${tableNumber}</title>
      <style>
        body {
          margin: 20mm;
          font-family: system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 40mm);
        }
        .qr-print-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          page-break-inside: avoid;
        }
        .qr-print-card h2 {
          margin: 0 0 16px;
          font-size: 28px;
          font-weight: 800;
        }
        .qr-print-card .qr-bg {
          background: #fff;
          padding: 16px;
          border-radius: 12px;
        }
        .qr-print-card .scan-text {
          font-size: 14px;
          color: #666;
          margin-top: 12px;
        }
        @media print { body { margin: 10mm; } }
      </style>
    </head>
    <body>
      <div class="qr-print-card">
        <h2>Mesa ${tableNumber}</h2>
        <div class="qr-bg">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}"
            width="300"
            height="300"
            alt="QR Code Mesa ${tableNumber}"
          />
        </div>
        <div class="scan-text">${scanText}</div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

// ─── Component ───

export function QRCodeTableGenerator({
  restaurantId,
  tableNumber,
  size = "medium",
  hidePrint = false,
  tableLabel = "Mesa",
  scanLabel = "Escaneie para pedir",
  printLabel = "Imprimir QR",
}: QRCodeTableGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const url = qrOrderingService.generateTableQR(restaurantId, tableNumber);
  const qrPx = QR_SIZE_CONFIG[size].px;

  const handlePrint = useCallback(() => {
    printSingleQR(tableNumber, url, scanLabel);
  }, [tableNumber, url, scanLabel]);

  return (
    <div ref={cardRef} style={CARD}>
      <div style={TABLE_NUM}>
        {tableLabel} {tableNumber}
      </div>
      <div style={QR_WRAPPER}>
        <QRCode
          value={url}
          size={qrPx}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <div style={SCAN_LABEL}>{scanLabel}</div>
      {!hidePrint && (
        <button type="button" style={PRINT_BTN} onClick={handlePrint}>
          {printLabel}
        </button>
      )}
    </div>
  );
}
