/**
 * ShiftHistorySection - Histórico por turno (Onda 5 O5.6, FASE 2.3)
 *
 * Exibe lista de turnos: abertura, fecho, vendas, vendas por método,
 * total esperado vs declarado e diferença (só leitura). Dashboard nunca fecha caixa;
 * link "Fechar no TPV" para o ritual de fecho. Ref.: docs/plans/FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { currencyService } from "../../core/currency/CurrencyService";
import { getFormatLocale } from "../../core/i18n/regionLocaleConfig";
import {
  type CashRegister,
  CashRegisterEngine,
} from "../../core/tpv/CashRegister";
import { useShiftHistory } from "../../hooks/useShiftHistory";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { ShiftCard } from "../../ui/design-system/ShiftCard";
import { useRestaurantId } from "../../ui/hooks/useRestaurantId";
import styles from "./ShiftHistorySection.module.css";

function formatCents(cents: number): string {
  return currencyService.formatAmount(cents);
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(getFormatLocale(), {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const METHOD_LABELS: Record<string, string> = {};

export function ShiftHistorySection() {
  const { t } = useTranslation();
  const { restaurantId, loading: loadingRestaurant } = useRestaurantId();

  const { data, loading, error, refresh } = useShiftHistory(restaurantId, {
    daysBack: 7,
  });
  const [activeShift, setActiveShift] = useState<CashRegister | null>(null);
  const [loadingActive, setLoadingActive] = useState(false);

  // Fetch active shift on mount/restaurant change
  useEffect(() => {
    if (!restaurantId) return;
    setLoadingActive(true);
    CashRegisterEngine.getOpenCashRegister(restaurantId)
      .then((shift) => setActiveShift(shift))
      .catch((err) => console.error("Failed to fetch active shift:", err))
      .finally(() => setLoadingActive(false));
  }, [restaurantId]);

  // FASE 2.3: Dashboard não fecha caixa; apenas link para TPV
  const navigate = useNavigate();
  const tpvPath = "/tpv";

  if (loadingRestaurant || !restaurantId) {
    return (
      <section className={`${styles.section} ${styles.sectionMuted}`}>
        <h2 className={`${styles.heading} ${styles.headingTight}`}>
          {t("shift:history.title")}
        </h2>
        <p className={styles.paragraph}>{t("shift:history.configNeeded")}</p>
      </section>
    );
  }

  if (loading && data.length === 0) {
    return (
      <section className={`${styles.section} ${styles.sectionLight}`}>
        <h2 className={`${styles.heading} ${styles.headingSpaced}`}>
          {t("shift:history.title")}
        </h2>
        <GlobalLoadingView
          message={t("common:loading")}
          layout="portal"
          variant="inline"
        />
      </section>
    );
  }

  if (error && data.length === 0) {
    return (
      <section className={`${styles.section} ${styles.sectionError}`}>
        <h2 className={`${styles.heading} ${styles.headingTight}`}>
          {t("shift:history.title")}
        </h2>
        <p className={`${styles.paragraph} ${styles.paragraphSpaced}`}>
          {t("shift:history.loadError")}
        </p>
        <button type="button" onClick={refresh} className={styles.retryButton}>
          {t("common:tryAgain")}
        </button>
      </section>
    );
  }

  return (
    <section className={`${styles.section} ${styles.sectionLight}`}>
      <div className={styles.headerRow}>
        <h2 className={`${styles.heading} ${styles.headingInline}`}>
          {t("shift:history.titleWithDays", { days: 7 })}
        </h2>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className={styles.refreshButton}
        >
          {loading ? "…" : t("common:refresh")}
        </button>
      </div>

      {/* ACTIVE SHIFT CARD — FASE 2.3: fechar só no TPV */}
      {activeShift && (
        <div className={styles.activeCard}>
          <ShiftCard
            shiftId={activeShift.id}
            workerName={activeShift.openedBy || t("operational:roles.operator")}
            role={t("operational:roles.manager").toLowerCase()}
            status="active"
            startTime={activeShift.openedAt || new Date()}
            activeTaskCount={0}
            onAction={(action) => {
              if (action === "end") navigate(tpvPath);
            }}
          />
        </div>
      )}

      {data.length === 0 ? (
        <p className={styles.paragraph}>{t("shift:history.noShiftsYet")}</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th
                  className={`${styles.headerCell} ${styles.headerCellTightLeft}`}
                >
                  {t("shift:history.opening")}
                </th>
                <th className={styles.headerCell}>
                  {t("shift:history.closing")}
                </th>
                <th
                  className={`${styles.headerCell} ${styles.headerCellRight}`}
                >
                  {t("shift:history.sales")}
                </th>
                <th className={styles.headerCell}>
                  {t("shift:history.byMethod")}
                </th>
                <th
                  className={`${styles.headerCell} ${styles.headerCellRight}`}
                >
                  {t("shift:history.orders")}
                </th>
                <th
                  className={`${styles.headerCell} ${styles.headerCellRight}`}
                >
                  {t("shift:history.expectedDeclared")}
                </th>
                <th
                  className={`${styles.headerCell} ${styles.headerCellTightRight}`}
                >
                  {t("shift:history.difference")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const opening = row.opening_balance_cents ?? 0;
                const expectedCents = opening + row.total_sales_cents;
                const declaredCents = row.closed_at
                  ? row.closing_balance_cents ?? 0
                  : null;
                const differenceCents =
                  declaredCents !== null ? declaredCents - expectedCents : null;
                const salesByMethod = row.sales_by_method ?? {};
                const methodLabels: Record<string, string> = {
                  cash: t("shift:paymentMethod.cash"),
                  card: t("shift:paymentMethod.card"),
                  other: t("shift:paymentMethod.other"),
                };
                const methodParts = Object.entries(salesByMethod)
                  .filter(([, c]) => c > 0)
                  .map(
                    ([m, c]) =>
                      `${methodLabels[m] ?? m}: ${formatCents(Number(c))}`,
                  );
                const differenceClass =
                  differenceCents === null
                    ? styles.differenceNeutral
                    : differenceCents === 0
                    ? styles.differenceOk
                    : styles.differenceWarn;
                return (
                  <tr key={row.shift_id} className={styles.bodyRow}>
                    <td className={`${styles.cell} ${styles.cellTightLeft}`}>
                      {formatDateTime(row.opened_at)}
                    </td>
                    <td className={styles.cell}>
                      {formatDateTime(row.closed_at)}
                    </td>
                    <td
                      className={`${styles.cell} ${styles.cellRight} ${styles.cellEmphasis}`}
                    >
                      {formatCents(row.total_sales_cents)}
                    </td>
                    <td className={`${styles.cell} ${styles.cellMuted}`}>
                      {methodParts.length > 0 ? methodParts.join(" · ") : "—"}
                    </td>
                    <td className={`${styles.cell} ${styles.cellRight}`}>
                      {row.orders_count}
                    </td>
                    <td
                      className={`${styles.cell} ${styles.cellRight} ${styles.cellMuted}`}
                    >
                      {row.closed_at
                        ? `${formatCents(expectedCents)} / ${formatCents(
                            declaredCents ?? 0,
                          )}`
                        : "—"}
                    </td>
                    <td
                      className={`${styles.differenceCell} ${differenceClass}`}
                    >
                      {differenceCents === null
                        ? "—"
                        : differenceCents === 0
                        ? formatCents(0)
                        : `${differenceCents > 0 ? "+" : ""}${formatCents(
                            differenceCents,
                          )}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
