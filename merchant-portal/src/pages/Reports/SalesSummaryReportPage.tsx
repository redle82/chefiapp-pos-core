import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExportButtons } from "../../components/common/ExportButtons";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { currencyService } from "../../core/currency/CurrencyService";
import { centsToDecimalStr } from "../../core/export/ExportService";
import { useExportBranding } from "../../core/export/useExportBranding";
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
  const { t } = useTranslation("operational");
  const { runtime } = useRestaurantRuntime();
  const branding = useExportBranding();
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
      [
        t("salesSummary.csv.grossSales"),
        t("salesSummary.csv.averageTicket"),
        t("salesSummary.csv.closedBills"),
        t("salesSummary.csv.cancellations"),
      ],
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
        message={t("salesSummary.loading")}
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  return (
    <div className={styles.pageRoot}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <h1 className={styles.title}>{t("salesSummary.title")}</h1>
      <p className={styles.subtitle}>{t("salesSummary.subtitle")}</p>

      <div className={styles.filterRow}>
        <label className={styles.filterLabel}>
          {t("salesSummary.filterFrom")}
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
          {t("salesSummary.filterTo")}
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
          {loading ? t("salesSummary.loadingFilter") : t("salesSummary.apply")}
        </button>
        {hasData && (
          <button
            type="button"
            onClick={handleExportCsv}
            className={styles.exportButton}
          >
            {t("salesSummary.exportCsv")}
          </button>
        )}
        {hasData && data && (
          <ExportButtons
            title={t("salesSummary.title")}
            subtitle={t("salesSummary.subtitle")}
            dateRange={`${toInput(dateFrom)} - ${toInput(dateTo)}`}
            filename={`resumo-vendas-${toInput(dateFrom)}-${toInput(dateTo)}`}
            branding={branding}
            formats={["pdf", "excel"]}
            datasets={[
              {
                name: t("salesSummary.title"),
                columns: [
                  { header: t("salesSummary.csv.grossSales"), align: "right", format: "currency" },
                  { header: t("salesSummary.csv.averageTicket"), align: "right", format: "currency" },
                  { header: t("salesSummary.csv.closedBills"), align: "right", format: "number" },
                  { header: t("salesSummary.csv.cancellations"), align: "right", format: "number" },
                ],
                rows: [[
                  centsToDecimalStr(data.grossTotalCents),
                  centsToDecimalStr(data.averageTicketCents),
                  data.ordersCount - data.cancelledOrdersCount,
                  data.cancelledOrdersCount,
                ]],
                summaryCards: [
                  { label: t("salesSummary.grossSales"), value: formatCurrency(data.grossTotalCents), highlight: true },
                  { label: t("salesSummary.averageTicket"), value: formatCurrency(data.averageTicketCents) },
                  { label: t("salesSummary.closedBills"), value: String(data.ordersCount - data.cancelledOrdersCount) },
                  { label: t("salesSummary.cancellations"), value: String(data.cancelledOrdersCount) },
                ],
              },
            ]}
          />
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {!hasData && !loading && !error && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>{t("salesSummary.emptyTitle")}</h2>
          <p className={styles.emptyText}>{t("salesSummary.emptyText")}</p>
        </div>
      )}

      {hasData && data && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCardPrimary}>
            <p className={styles.summaryLabelPrimary}>
              {t("salesSummary.grossSales")}
            </p>
            <p className={styles.summaryValuePrimary}>
              {formatCurrency(data.grossTotalCents)}
            </p>
          </div>
          <div className={styles.summaryCardMuted}>
            <p className={styles.summaryLabel}>
              {t("salesSummary.averageTicket")}
            </p>
            <p className={styles.summaryValue}>
              {formatCurrency(data.averageTicketCents)}
            </p>
          </div>
          <div className={styles.summaryCardMuted}>
            <p className={styles.summaryLabel}>
              {t("salesSummary.closedBills")}
            </p>
            <p className={styles.summaryValue}>
              {data.ordersCount - data.cancelledOrdersCount}
            </p>
          </div>
          <div className={styles.summaryCardAlert}>
            <p className={styles.summaryLabelAlert}>
              {t("salesSummary.cancellations")}
            </p>
            <p className={styles.summaryValueAlert}>
              {data.cancelledOrdersCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
