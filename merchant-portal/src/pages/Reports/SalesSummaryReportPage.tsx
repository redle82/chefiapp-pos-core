import { useCallback, useMemo, useState } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { currencyService } from "../../core/currency/CurrencyService";
import { centsToDecimal, exportCsv } from "../../core/reports/csvExport";
import { useSalesSummaryReport } from "../../core/reports/hooks/useSalesSummaryReport";
import type { TimeRange } from "../../core/reports/reportTypes";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./SalesSummaryReportPage.module.css";

function dateRangeToTimeRange(from: Date, to: Date): TimeRange {
  return {
    from: from.getTime(),
    to: to.getTime(),
  };
}

function formatCurrency(cents: number): string {
  return currencyService.formatAmount(cents);
}

export function SalesSummaryReportPage() {
  const { runtime } = useRestaurantRuntime();
  const now = useMemo(() => new Date(), []);
  const start = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);
  const end = useMemo(() => {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [now]);

  const [dateFrom, setDateFrom] = useState<Date>(start);
  const [dateTo, setDateTo] = useState<Date>(end);

  const period = dateRangeToTimeRange(dateFrom, dateTo);
  const { data, loading, error, reload } = useSalesSummaryReport(period);

  const handleApply = () => {
    reload();
  };

  const hasData = !!data && data.ordersCount > 0;

  const toInput = (d: Date) => d.toISOString().slice(0, 10);

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    const fromStr = toInput(dateFrom);
    const toStr = toInput(dateTo);
    exportCsv(
      ["Vendas Brutas", "Ticket Médio", "Contas Fechadas", "Cancelamentos"],
      [
        [
          centsToDecimal(data.grossTotalCents),
          centsToDecimal(data.averageTicketCents),
          data.ordersCount - data.cancelledOrdersCount,
          data.cancelledOrdersCount,
        ],
      ],
      `resumo-vendas-${fromStr}-${toStr}.csv`,
    );
  }, [data, dateFrom, dateTo]);

  if (!runtime) {
    return (
      <GlobalLoadingView
        message="A carregar..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  return (
    <div className={styles.pageRoot}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <h1 className={styles.title}>Resumo de Vendas</h1>
      <p className={styles.subtitle}>
        Visão rápida de faturação por período: total de vendas, cancelamentos e
        ticket médio. Ideal para responder “como foi o dia?” em segundos.
      </p>

      <div className={styles.filterRow}>
        <label className={styles.filterLabel}>
          De
          <input
            type="date"
            value={toInput(dateFrom)}
            onChange={(e) =>
              setDateFrom(new Date(e.target.value + "T00:00:00"))
            }
            className={styles.dateInput}
          />
        </label>
        <label className={styles.filterLabel}>
          Até
          <input
            type="date"
            value={toInput(dateTo)}
            onChange={(e) => setDateTo(new Date(e.target.value + "T23:59:59"))}
            className={styles.dateInput}
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
        {hasData && (
          <button
            type="button"
            onClick={handleExportCsv}
            className={styles.exportButton}
          >
            ⬇ Exportar CSV
          </button>
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {!hasData && !loading && !error && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Ainda não há dados suficientes.</h2>
          <p className={styles.emptyText}>
            Assim que começar a fechar contas regularmente, este painel mostra o
            total vendido, cancelamentos e ticket médio do período escolhido.
          </p>
        </div>
      )}

      {hasData && data && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCardPrimary}>
            <p className={styles.summaryLabelPrimary}>Vendas brutas</p>
            <p className={styles.summaryValuePrimary}>
              {formatCurrency(data.grossTotalCents)}
            </p>
          </div>
          <div className={styles.summaryCardMuted}>
            <p className={styles.summaryLabel}>Ticket médio</p>
            <p className={styles.summaryValue}>
              {formatCurrency(data.averageTicketCents)}
            </p>
          </div>
          <div className={styles.summaryCardMuted}>
            <p className={styles.summaryLabel}>Contas fechadas</p>
            <p className={styles.summaryValue}>
              {data.ordersCount - data.cancelledOrdersCount}
            </p>
          </div>
          <div className={styles.summaryCardAlert}>
            <p className={styles.summaryLabelAlert}>Cancelamentos</p>
            <p className={styles.summaryValueAlert}>
              {data.cancelledOrdersCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
