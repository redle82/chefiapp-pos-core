import { useCallback, useMemo, useState } from "react";
import { ExportButtons } from "../../components/common/ExportButtons";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useExportBranding } from "../../core/export/useExportBranding";
import { exportCsv } from "../../core/reports/csvExport";
import { useOperationalActivityReport } from "../../core/reports/hooks/useOperationalActivityReport";
import type {
  OperationalActivityBucket,
  TimeRange,
} from "../../core/reports/reportTypes";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./OperationalActivityReportPage.module.css";

function dateRangeToTimeRange(from: Date, to: Date): TimeRange {
  return {
    from: from.getTime(),
    to: to.getTime(),
  };
}

export function OperationalActivityReportPage() {
  const { runtime } = useRestaurantRuntime();
  const branding = useExportBranding();
  const now = useMemo(() => new Date(), []);
  const start = useMemo(() => {
    const d = new Date(now);
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
  const { data, loading, error, reload } = useOperationalActivityReport(period);

  const handleApply = () => {
    reload();
  };

  const hasData = !!data && data.buckets.length > 0;
  const toInput = (d: Date) => d.toISOString().slice(0, 10);

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    exportCsv(
      ["Hora", "Abertas", "Fechadas", "Canceladas", "Duração média (min)"],
      data.buckets.map((b: OperationalActivityBucket) => [
        b.bucketLabel,
        b.ordersOpened,
        b.ordersClosed,
        b.ordersCancelled,
        b.averageDurationSeconds != null
          ? (b.averageDurationSeconds / 60).toFixed(1)
          : "",
      ]),
      `atividade-operacional-${toInput(dateFrom)}.csv`,
    );
  }, [data, dateFrom]);

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
      <h1 className={styles.title}>Atividade da Operação</h1>
      <p className={styles.subtitle}>
        Contas abertas, fechadas e canceladas por hora, mais duração média das
        contas. Feito para sentir a energia do turno, não para burocracia.
      </p>

      <div className={styles.filterRow}>
        <label className={styles.filterLabel}>
          Dia
          <input
            type="date"
            value={toInput(dateFrom)}
            onChange={(e) => {
              const d = new Date(e.target.value + "T00:00:00");
              setDateFrom(d);
              const endOfDay = new Date(d);
              endOfDay.setHours(23, 59, 59, 999);
              setDateTo(endOfDay);
            }}
            className={styles.dateInput}
          />
        </label>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className={`${styles.applyButton} ${
            loading ? styles.applyButtonDisabled : ""
          }`}
        >
          {loading ? "A carregar…" : "Atualizar"}
        </button>
        {hasData && (
          <button
            type="button"
            onClick={handleExportCsv}
            className={styles.exportButton}
          >
            Exportar CSV
          </button>
        )}
        {hasData && data && (
          <ExportButtons
            title="Atividade da Operacao"
            subtitle="Contas abertas, fechadas e canceladas por hora"
            dateRange={toInput(dateFrom)}
            filename={`atividade-operacional-${toInput(dateFrom)}`}
            branding={branding}
            formats={["pdf", "excel"]}
            datasets={[
              {
                name: "Atividade por hora",
                columns: [
                  { header: "Hora" },
                  { header: "Abertas", align: "right", format: "number" },
                  { header: "Fechadas", align: "right", format: "number" },
                  { header: "Canceladas", align: "right", format: "number" },
                  { header: "Duracao media (min)", align: "right", format: "number" },
                ],
                rows: data.buckets.map((b: OperationalActivityBucket) => [
                  b.bucketLabel,
                  b.ordersOpened,
                  b.ordersClosed,
                  b.ordersCancelled,
                  b.averageDurationSeconds != null
                    ? (b.averageDurationSeconds / 60).toFixed(1)
                    : "",
                ]),
              },
            ]}
          />
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {!hasData && !loading && !error && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>
            Ainda não dá para sentir o turno.
          </h2>
          <p className={styles.emptyText}>
            Quando começar a abrir e fechar contas ao longo do dia, esta tela
            mostra em que horas a operação ganha ou perde ritmo.
          </p>
        </div>
      )}

      {hasData && data && (
        <div className={styles.dataCard}>
          <h2 className={styles.sectionTitle}>Contas por hora</h2>
          <p className={styles.sectionSubtitle}>
            Use como mapa de calor mental: mais contas = mais energia.
            Cancelamentos frequentes em certos horários podem indicar sobrecarga
            ou falhas de processo.
          </p>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headerRow}>
                  <th className={styles.headerCellLeft}>Hora</th>
                  <th className={styles.headerCellRight}>Abertas</th>
                  <th className={styles.headerCellRight}>Fechadas</th>
                  <th className={styles.headerCellRight}>Canceladas</th>
                  <th className={styles.headerCellRightEdge}>
                    Duração média (min)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.buckets.map((b: OperationalActivityBucket) => (
                  <tr key={b.bucketStart} className={styles.bodyRow}>
                    <td className={styles.bodyCellLeft}>{b.bucketLabel}</td>
                    <td className={styles.bodyCellRight}>{b.ordersOpened}</td>
                    <td className={styles.bodyCellRight}>{b.ordersClosed}</td>
                    <td className={styles.bodyCellRightAlert}>
                      {b.ordersCancelled}
                    </td>
                    <td className={styles.bodyCellRightEdge}>
                      {b.averageDurationSeconds != null
                        ? (b.averageDurationSeconds / 60).toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
