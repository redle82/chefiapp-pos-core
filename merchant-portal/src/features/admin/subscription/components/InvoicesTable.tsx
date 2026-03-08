/**
 * InvoicesTable — Histórico de faturas: filtros (período, cantidad) + lista ou empty state.
 * Ref: Historial de facturación — (futuro) download PDF, export CSV.
 */

import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { currencyService } from "../../../../core/currency/CurrencyService";
import type { Invoice } from "../types";

interface InvoicesTableProps {
  invoices: Invoice[];
  onApplyFilters?: (opts: {
    periodStart?: string;
    periodEnd?: string;
    limit?: number;
  }) => void;
  onDownloadPdf?: (invoiceId: string) => void;
}

function formatCurrency(amountCents: number, currency: string) {
  const value = amountCents / 100;
  return new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: currency.toUpperCase() || currencyService.getDefaultCurrency(),
  }).format(value);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(getFormatLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function InvoicesTable({
  invoices,
  onApplyFilters,
  onDownloadPdf,
}: InvoicesTableProps) {
  const { t } = useTranslation("billing");
  const [periodPreset, setPeriodPreset] = useState<string>("");
  const [limit, setLimit] = useState(10);

  const periodPresets: { labelKey: "periodPresets.last3Months" | "periodPresets.lastYear"; months: number }[] = [
    { labelKey: "periodPresets.last3Months", months: 3 },
    { labelKey: "periodPresets.lastYear", months: 12 },
  ];

  const statusLabel = (s: Invoice["status"]) => {
    if (s === "paid") return t("invoiceStatus.paid");
    if (s === "pending") return t("invoiceStatus.pending");
    if (s === "failed") return t("invoiceStatus.failed");
    return s;
  };

  const handleApply = () => {
    if (periodPreset) {
      const preset = periodPresets.find((p) => p.labelKey === periodPreset);
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
        border: "1px solid var(--surface-border)",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "var(--card-bg-on-dark)",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
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
            border: "1px solid var(--surface-border)",
            borderRadius: 8,
            minWidth: 160,
          }}
        >
          <option value="">{t("periodLabel", "Período")}</option>
          {periodPresets.map((p) => (
            <option key={p.labelKey} value={p.labelKey}>
              {t(p.labelKey)}
            </option>
          ))}
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            border: "1px solid var(--surface-border)",
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
            color: "var(--text-inverse)",
            backgroundColor: "var(--color-primary)",
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
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <p style={{ margin: 0 }}>Aún no hay facturas.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--surface-border)",
                  textAlign: "left",
                }}
              >
                <th
                  style={{
                    padding: "8px 0",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Fecha
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Importe
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Estado
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: "1px solid var(--surface-border)" }}
                >
                  <td
                    style={{ padding: "10px 0", color: "var(--text-primary)" }}
                  >
                    {formatDate(inv.date)}
                  </td>
                  <td
                    style={{ padding: "10px 0", color: "var(--text-primary)" }}
                  >
                    {formatCurrency(inv.amountCents, inv.currency)}
                  </td>
                  <td style={{ padding: "10px 0" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color:
                          inv.status === "paid"
                            ? "var(--color-success)"
                            : inv.status === "failed"
                            ? "var(--color-error)"
                            : "var(--text-secondary)",
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
                          color: "var(--color-primary)",
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
                          color: "var(--color-primary)",
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
