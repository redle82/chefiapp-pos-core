/**
 * SalesByPeriodReportPage — Relatório Vendas por período (FASE 5 Passo 4)
 *
 * Filtro por datas; listagem de turnos (get_shift_history); export CSV.
 * Ref.: docs/implementation/FASE_5_RELATORIOS.md
 */

import { useCallback, useMemo, useState } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import {
  useShiftHistory,
  type ShiftHistoryItem,
} from "../../hooks/useShiftHistory";
import { GlobalLoadingView } from "../../ui/design-system/components";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date): Date {
  const start = new Date(d);
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/** Agregado por mês — entidade explícita (FASE 5 relatórios). */
export interface MonthlyAggregate {
  month: string;
  total_sales_cents: number;
  orders_count: number;
}

function aggregateByMonth(items: ShiftHistoryItem[]): MonthlyAggregate[] {
  const byMonth = new Map<
    string,
    { total_sales_cents: number; orders_count: number }
  >();
  for (const row of items) {
    const key = row.opened_at
      ? new Date(row.opened_at).toISOString().slice(0, 7)
      : "";
    if (!key) continue;
    const cur = byMonth.get(key) ?? { total_sales_cents: 0, orders_count: 0 };
    cur.total_sales_cents += row.total_sales_cents;
    cur.orders_count += row.orders_count;
    byMonth.set(key, cur);
  }
  return Array.from(byMonth.entries())
    .map(([month, agg]) => ({ month, ...agg }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** Agregado por dia — entidade explícita (FASE 5 relatórios). */
export interface DailyAggregate {
  date: string;
  total_sales_cents: number;
  orders_count: number;
}

function aggregateByDay(items: ShiftHistoryItem[]): DailyAggregate[] {
  const byDay = new Map<
    string,
    { total_sales_cents: number; orders_count: number }
  >();
  for (const row of items) {
    const key = row.opened_at
      ? new Date(row.opened_at).toISOString().slice(0, 10)
      : "";
    if (!key) continue;
    const cur = byDay.get(key) ?? { total_sales_cents: 0, orders_count: 0 };
    cur.total_sales_cents += row.total_sales_cents;
    cur.orders_count += row.orders_count;
    byDay.set(key, cur);
  }
  return Array.from(byDay.entries())
    .map(([date, agg]) => ({ date, ...agg }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildCsv(data: ShiftHistoryItem[]): string {
  const headers = [
    "Data abertura",
    "Hora abertura",
    "Data fecho",
    "Hora fecho",
    "Vendas (EUR)",
    "N.º pedidos",
  ];
  const rows = data.map((row) => {
    const opened = row.opened_at ? new Date(row.opened_at) : null;
    const closed = row.closed_at ? new Date(row.closed_at) : null;
    const salesEur = (row.total_sales_cents / 100).toFixed(2);
    return [
      opened ? opened.toLocaleDateString("pt-PT") : "—",
      opened
        ? opened.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      closed ? closed.toLocaleDateString("pt-PT") : "—",
      closed
        ? closed.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      salesEur,
      String(row.orders_count),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

function buildCsvDaily(aggregates: DailyAggregate[]): string {
  const headers = ["Data", "Vendas (EUR)", "N.º pedidos"];
  const rows = aggregates.map((row) => {
    const d = new Date(row.date + "T12:00:00");
    return [
      d.toLocaleDateString("pt-PT"),
      (row.total_sales_cents / 100).toFixed(2),
      String(row.orders_count),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

function buildCsvMonthly(aggregates: MonthlyAggregate[]): string {
  const headers = ["Mês", "Vendas (EUR)", "N.º pedidos"];
  const rows = aggregates.map((row) => {
    const d = new Date(row.month + "-01T12:00:00");
    const monthLabel = d.toLocaleDateString("pt-PT", {
      month: "long",
      year: "numeric",
    });
    return [
      monthLabel,
      (row.total_sales_cents / 100).toFixed(2),
      String(row.orders_count),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

function downloadCsv(data: ShiftHistoryItem[], filename: string) {
  const csv = buildCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsvDaily(aggregates: DailyAggregate[], filename: string) {
  const csv = buildCsvDaily(aggregates);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsvMonthly(aggregates: MonthlyAggregate[], filename: string) {
  const csv = buildCsvMonthly(aggregates);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SalesByPeriodReportPage() {
  const { runtime } = useRestaurantRuntime();
  const { restaurantId, loading: loadingRestaurant } = useRestaurantId();
  const now = useMemo(() => new Date(), []);
  const [dateFrom, setDateFrom] = useState<Date>(() => startOfMonth(now));
  const [dateTo, setDateTo] = useState<Date>(() => new Date(now.getTime()));
  const { data, loading, error, refresh } = useShiftHistory(restaurantId, {
    dateFrom,
    dateTo,
  });

  const totalCents = useMemo(
    () => data.reduce((sum, row) => sum + row.total_sales_cents, 0),
    [data]
  );
  const totalOrders = useMemo(
    () => data.reduce((sum, row) => sum + row.orders_count, 0),
    [data]
  );
  const dailyAggregates = useMemo(() => aggregateByDay(data), [data]);
  const monthlyAggregates = useMemo(() => aggregateByMonth(data), [data]);

  const handleApply = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleExportCsv = useCallback(() => {
    const fromStr = toDateInputValue(dateFrom);
    const toStr = toDateInputValue(dateTo);
    downloadCsv(data, `vendas-periodo-${fromStr}-${toStr}.csv`);
  }, [data, dateFrom, dateTo]);

  const handleExportCsvDaily = useCallback(() => {
    const fromStr = toDateInputValue(dateFrom);
    const toStr = toDateInputValue(dateTo);
    downloadCsvDaily(
      dailyAggregates,
      `vendas-resumo-diario-${fromStr}-${toStr}.csv`
    );
  }, [dailyAggregates, dateFrom, dateTo]);

  const handleExportCsvMonthly = useCallback(() => {
    const fromStr = toDateInputValue(dateFrom);
    const toStr = toDateInputValue(dateTo);
    downloadCsvMonthly(
      monthlyAggregates,
      `vendas-resumo-mensal-${fromStr}-${toStr}.csv`
    );
  }, [monthlyAggregates, dateFrom, dateTo]);

  if (loadingRestaurant || !restaurantId) {
    return (
      <GlobalLoadingView
        message="A carregar..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <h1
        style={{
          fontSize: "20px",
          fontWeight: 700,
          marginBottom: 16,
          color: "#0f172a",
        }}
      >
        Vendas por período
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "#64748b",
          marginBottom: 24,
          marginTop: 0,
        }}
      >
        Histórico de turnos no intervalo escolhido. Exporte em CSV para análise
        externa.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "#475569",
          }}
        >
          De
          <input
            type="date"
            value={toDateInputValue(dateFrom)}
            onChange={(e) =>
              setDateFrom(new Date(e.target.value + "T00:00:00"))
            }
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
            }}
            aria-label="Data início"
          />
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "#475569",
          }}
        >
          Até
          <input
            type="date"
            value={toDateInputValue(dateTo)}
            onChange={(e) => setDateTo(new Date(e.target.value + "T23:59:59"))}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
            }}
            aria-label="Data fim"
          />
        </label>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "#0f172a",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "A carregar…" : "Aplicar"}
        </button>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={data.length === 0}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: "#0f172a",
            backgroundColor: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            cursor: data.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Exportar CSV (turnos)
        </button>
        <button
          type="button"
          onClick={handleExportCsvDaily}
          disabled={dailyAggregates.length === 0}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: "#0f172a",
            backgroundColor: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            cursor: dailyAggregates.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Exportar CSV (resumo por dia)
        </button>
        <button
          type="button"
          onClick={handleExportCsvMonthly}
          disabled={monthlyAggregates.length === 0}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: "#0f172a",
            backgroundColor: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            cursor: monthlyAggregates.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Exportar CSV (resumo por mês)
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 16 }}>
          {error}
        </p>
      )}

      {monthlyAggregates.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: "20px 24px",
            backgroundColor: "#f1f5f9",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              margin: 0,
              marginBottom: 12,
              color: "#0f172a",
            }}
          >
            Resumo por mês
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              margin: 0,
              marginBottom: 12,
            }}
          >
            Agregado mensal (vendas e pedidos por mês). Comparações mensais e
            história longa.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 8px 8px 0",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Mês
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: 8,
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Vendas
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0 8px 8px",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Pedidos
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyAggregates.map((row) => (
                  <tr
                    key={row.month}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "8px 8px 8px 0", color: "#1e293b" }}>
                      {new Date(row.month + "-01T12:00:00").toLocaleDateString(
                        "pt-PT",
                        { month: "long", year: "numeric" }
                      )}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: "right",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {formatCents(row.total_sales_cents)}
                    </td>
                    <td
                      style={{
                        padding: "8px 0 8px 8px",
                        textAlign: "right",
                        color: "#1e293b",
                      }}
                    >
                      {row.orders_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dailyAggregates.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: "20px 24px",
            backgroundColor: "#f8fafc",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              margin: 0,
              marginBottom: 12,
              color: "#0f172a",
            }}
          >
            Resumo por dia
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              margin: 0,
              marginBottom: 12,
            }}
          >
            Agregado diário (vendas e pedidos por dia). O dia é a entidade de
            fecho.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 8px 8px 0",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Dia
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: 8,
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Vendas
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0 8px 8px",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Pedidos
                  </th>
                </tr>
              </thead>
              <tbody>
                {dailyAggregates.map((row) => (
                  <tr
                    key={row.date}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "8px 8px 8px 0", color: "#1e293b" }}>
                      {new Date(row.date + "T12:00:00").toLocaleDateString(
                        "pt-PT"
                      )}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: "right",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {formatCents(row.total_sales_cents)}
                    </td>
                    <td
                      style={{
                        padding: "8px 0 8px 8px",
                        textAlign: "right",
                        color: "#1e293b",
                      }}
                    >
                      {row.orders_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && data.length === 0 ? (
        <GlobalLoadingView
          message="A carregar turnos..."
          layout="portal"
          variant="inline"
        />
      ) : data.length === 0 ? (
        <p style={{ fontSize: 14, color: "#64748b" }}>
          Nenhum turno no período.
        </p>
      ) : (
        <div
          style={{
            padding: "20px 24px",
            backgroundColor: "#fff",
            borderRadius: 14,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              margin: 0,
              marginBottom: 12,
              color: "#0f172a",
            }}
          >
            Detalhe por turno
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 8px 8px 0",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Abertura
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 8,
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Fecho
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: 8,
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Vendas
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0 8px 8px",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Pedidos
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.shift_id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "8px 8px 8px 0", color: "#1e293b" }}>
                      {formatDateTime(row.opened_at)}
                    </td>
                    <td style={{ padding: 8, color: "#1e293b" }}>
                      {formatDateTime(row.closed_at)}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: "right",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {formatCents(row.total_sales_cents)}
                    </td>
                    <td
                      style={{
                        padding: "8px 0 8px 8px",
                        textAlign: "right",
                        color: "#1e293b",
                      }}
                    >
                      {row.orders_count}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e2e8f0", fontWeight: 600 }}>
                  <td
                    style={{ padding: "12px 8px 12px 0", color: "#0f172a" }}
                    colSpan={2}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      padding: 12,
                      textAlign: "right",
                      color: "#0f172a",
                    }}
                  >
                    {formatCents(totalCents)}
                  </td>
                  <td
                    style={{
                      padding: "12px 0 12px 8px",
                      textAlign: "right",
                      color: "#0f172a",
                    }}
                  >
                    {totalOrders}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
