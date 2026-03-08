/**
 * FiscalSyncMonitorSection — Painel de observabilidade de sync fiscal
 *
 * Mostra: contadores de sync (sucesso/falha), taxa de sucesso mensal,
 * lista das últimas falhas com detalhes.
 * Ref: OBSERVABILITY_MINIMA.md, CORE_EVENTS_CONTRACT.md
 */

import { useFormatLocale } from "@/core/i18n/useFormatLocale";
import { useFiscalSyncMonitor } from "../../../../hooks/useFiscalSyncMonitor";
import styles from "./FiscalSyncMonitorSection.module.css";

interface FiscalSyncMonitorSectionProps {
  restaurantId: string | null;
}

export function FiscalSyncMonitorSection({
  restaurantId,
}: FiscalSyncMonitorSectionProps) {
  const locale = useFormatLocale();
  const { summary, recentFailures, loading, error, tableUnavailable, refresh } =
    useFiscalSyncMonitor(restaurantId);

  if (!restaurantId) {
    return null;
  }

  const rateClass =
    summary.successRate >= 95
      ? styles.valueOk
      : summary.successRate >= 80
      ? styles.valueWarn
      : styles.valueError;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sync Fiscal (mês atual)</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className={styles.refreshButton}
        >
          {loading ? "…" : "Atualizar"}
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {tableUnavailable && (
        <p className={styles.noteText}>
          Dados de sync fiscal não disponíveis (tabela de auditoria opcional).
          Para ativar: aplique a migração 20260211_core_audit_logs (ver
          docker-core/MIGRATIONS.md).
        </p>
      )}

      <div className={styles.cardGrid}>
        {/* Syncs com sucesso */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Syncs OK</h3>
          <div className={`${styles.cardValue} ${styles.valueOk}`}>
            {summary.totalSuccess}
          </div>
        </div>

        {/* Syncs falhados */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Syncs Falhados</h3>
          <div
            className={`${styles.cardValue} ${
              summary.totalFailed > 0 ? styles.valueError : ""
            }`}
          >
            {summary.totalFailed}
          </div>
        </div>

        {/* Taxa de sucesso */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Taxa de Sucesso</h3>
          <div className={`${styles.cardValue} ${rateClass}`}>
            {summary.successRate}%
          </div>
          <p className={styles.cardNote}>SLO: ≥ 95%</p>
        </div>
      </div>

      {/* Lista de falhas recentes */}
      {recentFailures.length > 0 && (
        <div className={styles.failuresPanel}>
          <h3 className={styles.failuresTitle}>
            Últimas falhas de sync fiscal
          </h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th
                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellFirst}`}
                  >
                    Data/Hora
                  </th>
                  <th className={styles.tableHeaderCell}>Erro</th>
                </tr>
              </thead>
              <tbody>
                {recentFailures.map((f) => (
                  <tr key={f.id} className={styles.tableRow}>
                    <td
                      className={`${styles.tableCell} ${styles.tableCellFirst}`}
                    >
                      {new Date(f.created_at).toLocaleString(locale)}
                    </td>
                    <td
                      className={`${styles.tableCell} ${styles.tableCellError}`}
                      title={JSON.stringify(f.details)}
                    >
                      {(f.details?.error as string) ||
                        JSON.stringify(f.details).slice(0, 120)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentFailures.length === 0 && summary.totalFailed === 0 && (
        <p className={styles.emptyState}>
          Nenhuma falha de sync fiscal registada este mês.
        </p>
      )}
    </div>
  );
}
