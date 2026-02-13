/**
 * SalesByPeriodReportPage — Relatório Vendas por período (FASE 5 Passo 4)
 *
 * Filtro por datas; listagem de turnos (get_shift_history); export CSV.
 * Ref.: docs/implementation/FASE_5_RELATORIOS.md
 */

import { useCallback, useMemo, useState } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { currencyService } from "../../core/currency/CurrencyService";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import {
  useShiftHistory,
  type ShiftHistoryItem,
} from "../../hooks/useShiftHistory";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./SalesByPeriodReportPage.module.css";

function formatCents(cents: number): string {
  return currencyService.formatAmount(cents);
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
    [data],
  );
  const totalOrders = useMemo(
    () => data.reduce((sum, row) => sum + row.orders_count, 0),
    [data],
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
      `vendas-resumo-diario-${fromStr}-${toStr}.csv`,
    );
  }, [dailyAggregates, dateFrom, dateTo]);

  const handleExportCsvMonthly = useCallback(() => {
    const fromStr = toDateInputValue(dateFrom);
    const toStr = toDateInputValue(dateTo);
    downloadCsvMonthly(
      monthlyAggregates,
      `vendas-resumo-mensal-${fromStr}-${toStr}.csv`,
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
    <div className={styles.pageRoot}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <h1 className={styles.title}>Vendas por período</h1>
      <p className={styles.subtitle}>
        Histórico de turnos no intervalo escolhido. Exporte em CSV para análise
        externa.
      </p>

      <div className={styles.filterRow}>
        <label className={styles.filterLabel}>
          De
          <input
            type="date"
            value={toDateInputValue(dateFrom)}
            onChange={(e) =>
              setDateFrom(new Date(e.target.value + "T00:00:00"))
            }
            className={styles.dateInput}
            aria-label="Data início"
          />
        </label>
        <label className={styles.filterLabel}>
          Até
          <input
            type="date"
            value={toDateInputValue(dateTo)}
            onChange={(e) => setDateTo(new Date(e.target.value + "T23:59:59"))}
            className={styles.dateInput}
            aria-label="Data fim"
          />
        </label>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className={`${styles.applyButton} ${
            loading ? styles.buttonDisabled : ""
          }`}
        >
          {loading ? "A carregar…" : "Aplicar"}
        </button>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={data.length === 0}
          className={`${styles.exportButton} ${
            data.length === 0 ? styles.buttonDisabled : ""
          }`}
        >
          Exportar CSV (turnos)
        </button>
        <button
          type="button"
          onClick={handleExportCsvDaily}
          disabled={dailyAggregates.length === 0}
          className={`${styles.exportButton} ${
            dailyAggregates.length === 0 ? styles.buttonDisabled : ""
          }`}
        >
          Exportar CSV (resumo por dia)
        </button>
        <button
          type="button"
          onClick={handleExportCsvMonthly}
          disabled={monthlyAggregates.length === 0}
          className={`${styles.exportButton} ${
            monthlyAggregates.length === 0 ? styles.buttonDisabled : ""
          }`}
        >
          Exportar CSV (resumo por mês)
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {monthlyAggregates.length > 0 && (
        <div className={`${styles.summaryCard} ${styles.summaryCardMuted}`}>
          <h2 className={styles.sectionTitle}>Resumo por mês</h2>
          <p className={styles.sectionSubtitle}>
            Agregado mensal (vendas e pedidos por mês). Comparações mensais e
            história longa.
          </p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headerRow}>
                  <th className={styles.headerCellLeft}>Mês</th>
                  <th className={styles.headerCellRight}>Vendas</th>
                  <th className={styles.headerCellRightEdge}>Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {monthlyAggregates.map((row) => (
                  <tr key={row.month} className={styles.bodyRow}>
                    <td className={styles.bodyCellLeft}>
                      {new Date(row.month + "-01T12:00:00").toLocaleDateString(
                        "pt-PT",
                        { month: "long", year: "numeric" },
                      )}
                    </td>
                    <td className={styles.bodyCellRightStrong}>
                      {formatCents(row.total_sales_cents)}
                    </td>
                    <td className={styles.bodyCellRightEdge}>
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
        <div className={`${styles.summaryCard} ${styles.summaryCardSoft}`}>
          <h2 className={styles.sectionTitle}>Resumo por dia</h2>
          <p className={styles.sectionSubtitle}>
            Agregado diário (vendas e pedidos por dia). O dia é a entidade de
            fecho.
          </p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headerRow}>
                  <th className={styles.headerCellLeft}>Dia</th>
                  <th className={styles.headerCellRight}>Vendas</th>
                  <th className={styles.headerCellRightEdge}>Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {dailyAggregates.map((row) => (
                  <tr key={row.date} className={styles.bodyRow}>
                    <td className={styles.bodyCellLeft}>
                      {new Date(row.date + "T12:00:00").toLocaleDateString(
                        "pt-PT",
                      )}
                    </td>
                    <td className={styles.bodyCellRightStrong}>
                      {formatCents(row.total_sales_cents)}
                    </td>
                    <td className={styles.bodyCellRightEdge}>
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
        <p className={styles.emptyText}>Nenhum turno no período.</p>
      ) : (
        <div className={styles.detailCard}>
          <h2 className={styles.sectionTitle}>Detalhe por turno</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headerRow}>
                  <th className={styles.headerCellLeft}>Abertura</th>
                  <th className={styles.headerCellLeftPadded}>Fecho</th>
                  <th className={styles.headerCellRight}>Vendas</th>
                  <th className={styles.headerCellRightEdge}>Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.shift_id} className={styles.bodyRow}>
                    <td className={styles.bodyCellLeft}>
                      {formatDateTime(row.opened_at)}
                    </td>
                    <td className={styles.bodyCellLeftPadded}>
                      {formatDateTime(row.closed_at)}
                    </td>
                    <td className={styles.bodyCellRightStrong}>
                      {formatCents(row.total_sales_cents)}
                    </td>
                    <td className={styles.bodyCellRightEdge}>
                      {row.orders_count}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td className={styles.totalLabel} colSpan={2}>
                    Total
                  </td>
                  <td className={styles.totalValue}>
                    {formatCents(totalCents)}
                  </td>
                  <td className={styles.totalValueEdge}>{totalOrders}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
