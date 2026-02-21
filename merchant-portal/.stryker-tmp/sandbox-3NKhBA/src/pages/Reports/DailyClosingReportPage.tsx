/**
 * DailyClosingReportPage — Relatório Fecho diário (FASE 5 Passo 4)
 *
 * Mostra histórico por turno (abertura, fecho, vendas, pedidos).
 * Fonte: useShiftHistory → RPC get_shift_history.
 * Ref.: docs/implementation/FASE_5_RELATORIOS.md
 */
// @ts-nocheck


import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShiftHistorySection } from "../../components/Dashboard/ShiftHistorySection";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { centsToDecimal, exportCsv } from "../../core/reports/csvExport";
import FiscalReconciliationService from "../../core/services/FiscalReconciliationService";
import {
  useFiscalReconciliation,
  type FiscalReconciliationItem,
} from "../../hooks/useFiscalReconciliation";
import { useShiftHistory } from "../../hooks/useShiftHistory";
import { useRestaurantId } from "../../ui/hooks/useRestaurantId";
import styles from "./DailyClosingReportPage.module.css";

export function DailyClosingReportPage() {
  const { t, i18n } = useTranslation("operational");
  const { runtime } = useRestaurantRuntime();
  const { restaurantId } = useRestaurantId();
  const { data } = useShiftHistory(restaurantId, { daysBack: 7 });
  const {
    data: reconciliations,
    loading: loadingRecon,
    error: errorRecon,
    refresh: refreshRecon,
  } = useFiscalReconciliation(restaurantId, { daysBack: 7 });

  const [editingRecon, setEditingRecon] =
    useState<FiscalReconciliationItem | null>(null);
  const [editReasonCode, setEditReasonCode] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleEditReconciliation = (recon: FiscalReconciliationItem) => {
    setEditingRecon(recon);
    setEditReasonCode(recon.reason_code || "");
    setEditNotes(recon.notes || "");
  };

  const handleSaveNotes = async () => {
    if (!editingRecon) return;
    setSaving(true);
    try {
      await FiscalReconciliationService.updateReconciliationNotes(
        editingRecon.id,
        editReasonCode || null,
        editNotes || null,
      );
      await refreshRecon();
      setEditingRecon(null);
    } catch (err) {
      console.error("Erro ao guardar notas:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = useCallback(() => {
    if (!data || data.length === 0) return;
    exportCsv(
      [
        t("dailyClosing.csv.shift"),
        t("dailyClosing.csv.opened"),
        t("dailyClosing.csv.closed"),
        t("dailyClosing.csv.sales"),
        t("dailyClosing.csv.orders"),
      ],
      data.map((s) => [
        s.shift_id.slice(0, 8),
        s.opened_at ? new Date(s.opened_at).toLocaleString(i18n.language) : "—",
        s.closed_at
          ? new Date(s.closed_at).toLocaleString(i18n.language)
          : t("dailyClosing.csv.open"),
        centsToDecimal(s.total_sales_cents),
        s.orders_count,
      ]),
      `fecho-diario-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }, [data]);

  const statusClassFor = (status: FiscalReconciliationItem["status"]) => {
    switch (status) {
      case "OK":
        return styles.statusOk;
      case "PENDING_DATA":
        return styles.statusPending;
      default:
        return styles.statusDivergent;
    }
  };

  const diffClassFor = (
    status: FiscalReconciliationItem["status"],
    diff: number,
  ) => {
    if (diff === 0) return styles.diffNeutral;
    switch (status) {
      case "OK":
        return styles.diffOk;
      case "PENDING_DATA":
        return styles.diffWarn;
      default:
        return styles.diffError;
    }
  };

  return (
    <div className={styles.page}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{t("dailyClosing.title")}</h1>
        {data && data.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className={styles.exportButton}
          >
            {t("dailyClosing.exportCsv")}
          </button>
        )}
      </div>
      <p className={styles.subtitle}>{t("dailyClosing.subtitle")}</p>
      <ShiftHistorySection />
      <section className={styles.reconciliationSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {t("dailyClosing.reconciliation.title")}
          </h2>
          <button
            type="button"
            onClick={refreshRecon}
            disabled={loadingRecon}
            className={styles.refreshButton}
          >
            {loadingRecon ? "…" : t("dailyClosing.reconciliation.refresh")}
          </button>
        </div>
        {errorRecon && <p className={styles.errorText}>{errorRecon}</p>}
        {reconciliations.length === 0 ? (
          <p className={styles.emptyText}>
            {t("dailyClosing.reconciliation.empty")}
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th
                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellLeft}`}
                  >
                    {t("dailyClosing.reconciliation.shift")}
                  </th>
                  <th
                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellRight}`}
                  >
                    ChefIApp
                  </th>
                  <th
                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellRight}`}
                  >
                    {t("dailyClosing.reconciliation.posFiscal")}
                  </th>
                  <th
                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellRight}`}
                  >
                    {t("dailyClosing.reconciliation.difference")}
                  </th>
                  <th
                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellLeft}`}
                  >
                    {t("dailyClosing.reconciliation.status")}
                  </th>
                  <th
                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellLeft}`}
                  >
                    {t("dailyClosing.reconciliation.notes")}
                  </th>
                  <th
                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}
                  >
                    {t("dailyClosing.reconciliation.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((r) => {
                  const diff = r.difference_cents;
                  const statusLabel =
                    r.status === "OK"
                      ? "OK"
                      : r.status === "PENDING_DATA"
                      ? t("dailyClosing.reconciliation.pendingData")
                      : t("dailyClosing.reconciliation.divergent");
                  const statusColor =
                    r.status === "OK"
                      ? "#16a34a"
                      : r.status === "PENDING_DATA"
                      ? "#b45309"
                      : "#b91c1c";
                  return (
                    <tr key={r.id} className={styles.tableRow}>
                      <td
                        className={`${styles.tableCell} ${styles.tableCellLeft}`}
                      >
                        {r.shift_id
                          ? r.shift_id.slice(0, 8)
                          : new Date(r.created_at).toLocaleString(
                              i18n.language,
                            )}
                      </td>
                      <td
                        className={`${styles.tableCell} ${styles.tableCellRight}`}
                      >
                        {centsToDecimal(r.total_operational_cents)}
                      </td>
                      <td
                        className={`${styles.tableCell} ${styles.tableCellRight}`}
                      >
                        {centsToDecimal(r.total_fiscal_cents)}
                      </td>
                      <td
                        className={`${styles.tableCell} ${
                          styles.tableCellRight
                        } ${diffClassFor(r.status, diff)}`}
                      >
                        {centsToDecimal(diff)}
                      </td>
                      <td
                        className={`${styles.tableCell} ${
                          styles.tableCellLeft
                        } ${statusClassFor(r.status)}`}
                      >
                        {statusLabel}
                      </td>
                      <td
                        className={`${styles.tableCell} ${styles.notesCell}`}
                        title={r.notes || undefined}
                      >
                        {r.reason_code && (
                          <span className={styles.reasonCode}>
                            [{r.reason_code}]
                          </span>
                        )}{" "}
                        {r.notes || "—"}
                      </td>
                      <td
                        className={`${styles.tableCell} ${styles.tableCellCenter}`}
                      >
                        {r.status === "DIVERGENT" && (
                          <button
                            type="button"
                            onClick={() => handleEditReconciliation(r)}
                            className={styles.editButton}
                          >
                            {t("dailyClosing.reconciliation.edit")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de edição de notas de reconciliação */}
      {editingRecon && (
        <div
          className={styles.modalOverlay}
          onClick={() => setEditingRecon(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>
              {t("dailyClosing.reconciliation.modalTitle")}
            </h3>
            <p className={styles.modalMeta}>
              {t("dailyClosing.reconciliation.modalMeta", {
                shiftId: editingRecon.shift_id?.slice(0, 8) || "—",
                amount: centsToDecimal(editingRecon.difference_cents),
              })}
            </p>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {t("dailyClosing.reconciliation.reasonCode")}
              </label>
              <select
                value={editReasonCode}
                onChange={(e) => setEditReasonCode(e.target.value)}
                title={t("dailyClosing.reconciliation.reasonCodeTitle")}
                className={styles.selectField}
              >
                <option value="">
                  {t("dailyClosing.reconciliation.selectPlaceholder")}
                </option>
                <option value="DIRECT_POS_SALES">
                  {t("dailyClosing.reconciliation.reasonDirectPosSales")}
                </option>
                <option value="MISSING_FISCAL_CANCELLATION">
                  {t("dailyClosing.reconciliation.reasonMissingCancellation")}
                </option>
                <option value="TAX_CONFIG_ERROR">
                  {t("dailyClosing.reconciliation.reasonTaxConfigError")}
                </option>
                <option value="MANUAL_ADJUSTMENT">
                  {t("dailyClosing.reconciliation.reasonManualAdjustment")}
                </option>
                <option value="UNDER_INVESTIGATION">
                  {t("dailyClosing.reconciliation.reasonUnderInvestigation")}
                </option>
                <option value="RESOLVED">
                  {t("dailyClosing.reconciliation.reasonResolved")}
                </option>
              </select>
            </div>
            <div className={`${styles.fieldGroup} ${styles.fieldGroupLarge}`}>
              <label className={styles.fieldLabel}>
                {t("dailyClosing.reconciliation.notesLabel")}
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                placeholder={t("dailyClosing.reconciliation.notesPlaceholder")}
                className={styles.textareaField}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setEditingRecon(null)}
                disabled={saving}
                className={styles.cancelButton}
              >
                {t("dailyClosing.reconciliation.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={saving}
                className={styles.saveButton}
              >
                {saving
                  ? t("dailyClosing.reconciliation.saving")
                  : t("dailyClosing.reconciliation.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
