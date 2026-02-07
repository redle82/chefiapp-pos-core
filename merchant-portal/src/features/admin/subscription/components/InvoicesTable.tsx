/**
 * InvoicesTable — Histórico de faturas: filtros (período, cantidad) + lista ou empty state.
 * Ref: Historial de facturación — (futuro) download PDF, export CSV.
 */

import { useState } from "react";
import type { Invoice } from "../types";

interface InvoicesTableProps {
  invoices: Invoice[];
  onApplyFilters?: (opts: { periodStart?: string; periodEnd?: string; limit?: number }) => void;
  onDownloadPdf?: (invoiceId: string) => void;
}

const PERIOD_PRESETS = [
  { label: "Últimos 3 meses", months: 3 },
  { label: "Último año", months: 12 },
];

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(s: Invoice["status"]) {
  switch (s) {
    case "paid":
      return "Pagado";
    case "pending":
      return "Pendiente";
    case "failed":
      return "Fallido";
    default:
      return s;
  }
}

export function InvoicesTable({
  invoices,
  onApplyFilters,
  onDownloadPdf,
}: InvoicesTableProps) {
  const [periodPreset, setPeriodPreset] = useState<string>("");
  const [limit, setLimit] = useState(10);

  const handleApply = () => {
    if (periodPreset) {
      const preset = PERIOD_PRESETS.find((p) => p.label === periodPreset);
      if (preset) {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - preset.months);
        onApplyFilters?.({
          periodStart: start.toISOString().slice(0, 10),
          periodEnd: end.toISOString().slice(0, 10),
          limit,
        });
      }
    } else {
      onApplyFilters?.({ limit });
    }
  };

  const isEmpty = invoices.length === 0;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "#fff",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: 16,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Historial de facturación
      </h3>
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <select
          value={periodPreset}
          onChange={(e) => setPeriodPreset(e.target.value)}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            border: "1px solid #d1d5db",
            borderRadius: 8,
            minWidth: 160,
          }}
        >
          <option value="">Período</option>
          {PERIOD_PRESETS.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            border: "1px solid #d1d5db",
            borderRadius: 8,
            minWidth: 80,
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <button
          type="button"
          onClick={handleApply}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#7c3aed",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Aplicar
        </button>
      </div>

      {isEmpty ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <p style={{ margin: 0 }}>Aún no hay facturas.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "8px 0", color: "#6b7280", fontWeight: 600 }}>
                  Fecha
                </th>
                <th style={{ padding: "8px 0", color: "#6b7280", fontWeight: 600 }}>
                  Importe
                </th>
                <th style={{ padding: "8px 0", color: "#6b7280", fontWeight: 600 }}>
                  Estado
                </th>
                <th style={{ padding: "8px 0", color: "#6b7280", fontWeight: 600 }}>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: "10px 0", color: "#374151" }}>
                    {formatDate(inv.date)}
                  </td>
                  <td style={{ padding: "10px 0", color: "#374151" }}>
                    {formatEur(inv.amountEur)}
                  </td>
                  <td style={{ padding: "10px 0" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color:
                          inv.status === "paid"
                            ? "#059669"
                            : inv.status === "failed"
                              ? "#dc2626"
                              : "#6b7280",
                      }}
                    >
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 0" }}>
                    {inv.downloadUrl && (
                      <a
                        href={inv.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 13,
                          color: "#7c3aed",
                          fontWeight: 500,
                        }}
                      >
                        Descargar PDF
                      </a>
                    )}
                    {!inv.downloadUrl && onDownloadPdf && (
                      <button
                        type="button"
                        onClick={() => onDownloadPdf(inv.id)}
                        style={{
                          fontSize: 13,
                          color: "#7c3aed",
                          fontWeight: 500,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Descargar PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
