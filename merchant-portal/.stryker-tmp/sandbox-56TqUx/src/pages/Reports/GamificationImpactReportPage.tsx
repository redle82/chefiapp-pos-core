// @ts-nocheck
import { useCallback, useMemo, useState } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { currencyService } from "../../core/currency/CurrencyService";
import { centsToDecimal, exportCsv } from "../../core/reports/csvExport";
import { useGamificationImpactReport } from "../../core/reports/hooks/useGamificationImpactReport";
import type {
  GamificationImpactPoint,
  TimeRange,
} from "../../core/reports/reportTypes";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./GamificationImpactReportPage.module.css";

function dateRangeToTimeRange(from: Date, to: Date): TimeRange {
  return {
    from: from.getTime(),
    to: to.getTime(),
  };
}

function formatCurrency(cents: number): string {
  return currencyService.formatAmount(cents);
}

export function GamificationImpactReportPage() {
  const { runtime } = useRestaurantRuntime();
  const now = useMemo(() => new Date(), []);
  const start = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 13);
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

  const globalPeriod = dateRangeToTimeRange(dateFrom, dateTo);

  const mid = useMemo(() => {
    const half = new Date(dateFrom.getTime());
    half.setDate(
      half.getDate() +
        Math.floor((dateTo.getTime() - dateFrom.getTime()) / (2 * 86400000)),
    );
    return half;
  }, [dateFrom, dateTo]);

  const windows = useMemo(
    () => [
      {
        id: "before",
        label: "Antes",
        period: dateRangeToTimeRange(dateFrom, mid),
      },
      {
        id: "after",
        label: "Depois",
        period: dateRangeToTimeRange(mid, dateTo),
      },
    ],
    [dateFrom, mid, dateTo],
  );

  const { data, loading, error, reload } = useGamificationImpactReport(
    windows,
    globalPeriod,
  );

  const toInput = (d: Date) => d.toISOString().slice(0, 10);
  const hasData =
    !!data &&
    data.points.some((p: GamificationImpactPoint) => p.ordersCount > 0);

  const handleApply = () => {
    reload();
  };

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    const fromStr = toInput(dateFrom);
    const toStr = toInput(dateTo);
    exportCsv(
      ["Período", "Pedidos", "Ticket Médio"],
      data.points.map((p: GamificationImpactPoint) => [
        p.windowLabel,
        p.ordersCount,
        centsToDecimal(p.averageTicketCents),
      ]),
      `gamificacao-impacto-${fromStr}-${toStr}.csv`,
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
      <h1 className={styles.title}>Impacto da Gamificação</h1>
      <p className={styles.subtitle}>
        Compara pedido médio e volume de vendas antes e depois de um período
        (por exemplo, o início de uma campanha ou missões para a equipa).
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
          <h2 className={styles.emptyTitle}>
            Ainda não dá para medir o efeito.
          </h2>
          <p className={styles.emptyText}>
            Quando tiver pedidos suficientes antes e depois do período
            escolhido, este painel mostra se a equipa e a gamificação estão a
            empurrar o ticket médio para cima.
          </p>
        </div>
      )}

      {hasData && data && (
        <div className={styles.summaryGrid}>
          {data.points.map((p: GamificationImpactPoint) => (
            <div
              key={p.windowLabel}
              className={`${styles.summaryCard} ${
                p.windowLabel === "Depois"
                  ? styles.summaryCardPositive
                  : styles.summaryCardNeutral
              }`}
            >
              <p className={styles.summaryLabel}>{p.windowLabel}</p>
              <p className={styles.summaryMeta}>Pedidos</p>
              <p className={styles.summaryValue}>{p.ordersCount}</p>
              <p className={styles.summaryMeta}>Ticket médio</p>
              <p className={styles.summaryValueSmall}>
                {formatCurrency(p.averageTicketCents)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
