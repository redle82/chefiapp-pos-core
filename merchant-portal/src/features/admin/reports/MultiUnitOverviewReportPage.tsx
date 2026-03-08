import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import { currencyService } from "../../../core/currency/CurrencyService";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { useMultiUnitOverview } from "../../../hooks/useMultiUnitOverview";
import styles from "./MultiUnitOverviewReportPage.module.css";

type ShiftStatus = "OPEN" | "CLOSED" | "UNKNOWN";

export type MultiUnitCard = {
  id: string;
  name: string;
  tag?: string;
  revenueToday: number;
  openOrders: number;
  criticalTasks: number;
  criticalStockItems: number;
  shiftStatus: ShiftStatus;
  kdsOnline: boolean;
  tpvOnline: boolean;
};

function formatCurrencyValue(amount: number): string {
  return new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: currencyService.getDefaultCurrency(),
    maximumFractionDigits: 0,
  }).format(amount);
}

function shiftLabel(status: ShiftStatus): string {
  if (status === "OPEN") return "Turno aberto";
  if (status === "CLOSED") return "Turno fechado";
  return "Estado de turno desconhecido";
}

function shiftStatusClass(status: ShiftStatus): string {
  if (status === "OPEN") return styles.statusOk;
  if (status === "CLOSED") return styles.statusWarn;
  return styles.statusWarn;
}

function shiftStatusDotClass(status: ShiftStatus): string {
  if (status === "OPEN") return styles.statusDotOk;
  if (status === "CLOSED") return styles.statusDotWarn;
  return styles.statusDotNeutral;
}

function onlinePillClass(online: boolean): string {
  return online ? styles.statusOk : styles.statusCrit;
}

function onlineDotClass(online: boolean): string {
  return online ? styles.statusDotOk : styles.statusDotCrit;
}

export function MultiUnitOverviewReportPage() {
  const { identity } = useRestaurantIdentity();
  const {
    data: units,
    loading,
    error,
    refresh,
  } = useMultiUnitOverview({
    periodDate: new Date(),
  });

  const totalRevenue = units.reduce((sum, u) => sum + u.revenueToday, 0);
  const totalOpenOrders = units.reduce((sum, u) => sum + u.openOrders, 0);
  const totalCriticalTasks = units.reduce((sum, u) => sum + u.criticalTasks, 0);
  const totalCriticalStock = units.reduce(
    (sum, u) => sum + u.criticalStockItems,
    0,
  );

  const groupName =
    identity.name && identity.name.trim().length > 0
      ? identity.name
      : "Grupo / Dono";

  if (loading) {
    return (
      <section aria-label="Visão multi-unidade" className={styles.page}>
        <p className={styles.note}>A carregar visão multi-unidade…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Visão multi-unidade" className={styles.page}>
        <p className={styles.errorText}>{error}</p>
        <button type="button" onClick={refresh}>
          Tentar novamente
        </button>
      </section>
    );
  }

  return (
    <section
      aria-label="Visão multi-unidade"
      data-report-id="multiunit-owner-dashboard"
      className={styles.page}
    >
      <header className={styles.header}>
        <h1 className={styles.title}>Multi‑unidade — olhar de dono</h1>
        <p className={styles.subtitle}>
          Visão consolidada das unidades ligadas ao {groupName}. Focado em
          faturação, risco operacional e saúde de turno — leitura, não comando
          em tempo real.
        </p>
      </header>

      <section aria-label="KPIs consolidados" className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Faturação total hoje</div>
          <div className={styles.kpiValue}>
            {formatCurrencyValue(totalRevenue)}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Pedidos abertos agora</div>
          <div className={styles.kpiValue}>{totalOpenOrders}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Tasks críticas abertas</div>
          <div className={styles.kpiValue}>{totalCriticalTasks}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Itens de stock em risco</div>
          <div className={styles.kpiValue}>{totalCriticalStock}</div>
        </div>
      </section>

      <section aria-label="Unidades / outlets" className={styles.unitsGrid}>
        {units.map((unit) => {
          const hasRisk = unit.criticalTasks > 0 || unit.criticalStockItems > 0;

          return (
            <article key={unit.id} className={styles.unitCard}>
              <header className={styles.unitHeader}>
                <div>
                  <div className={styles.unitName}>{unit.name}</div>
                  {unit.tag && <div className={styles.unitTag}>{unit.tag}</div>}
                </div>
                {hasRisk && (
                  <span className={styles.priorityBadge}>Prioridade agora</span>
                )}
              </header>

              <div className={styles.unitMetricsRow}>
                <div className={styles.unitMetricBlock}>
                  <div className={styles.unitMetricLabel}>Faturado hoje</div>
                  <div className={styles.unitMetricValue}>
                    {formatCurrencyValue(unit.revenueToday)}
                  </div>
                </div>
                <div className={styles.unitMetricBlock}>
                  <div className={styles.unitMetricLabel}>Pedidos abertos</div>
                  <div className={styles.unitMetricValue}>
                    {unit.openOrders}
                  </div>
                </div>
                <div className={styles.unitMetricBlock}>
                  <div className={styles.unitMetricLabel}>Tasks críticas</div>
                  <div className={styles.unitMetricValue}>
                    {unit.criticalTasks}
                  </div>
                </div>
                <div className={styles.unitMetricBlock}>
                  <div className={styles.unitMetricLabel}>Stock crítico</div>
                  <div className={styles.unitMetricValue}>
                    {unit.criticalStockItems}
                  </div>
                </div>
              </div>

              <div className={styles.statusRow}>
                <div className={styles.statusPillsRow}>
                  <span
                    className={`${styles.statusPill} ${shiftStatusClass(
                      unit.shiftStatus,
                    )}`}
                  >
                    <span
                      className={`${styles.statusDot} ${shiftStatusDotClass(
                        unit.shiftStatus,
                      )}`}
                    />
                    <span>{shiftLabel(unit.shiftStatus)}</span>
                  </span>
                  <span
                    className={`${styles.statusPill} ${onlinePillClass(
                      unit.kdsOnline,
                    )}`}
                  >
                    <span
                      className={`${styles.statusDot} ${onlineDotClass(
                        unit.kdsOnline,
                      )}`}
                    />
                    <span>KDS</span>
                  </span>
                  <span
                    className={`${styles.statusPill} ${onlinePillClass(
                      unit.tpvOnline,
                    )}`}
                  >
                    <span
                      className={`${styles.statusDot} ${onlineDotClass(
                        unit.tpvOnline,
                      )}`}
                    />
                    <span>TPV</span>
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {units.length === 0 && (
        <section aria-label="Estado vazio">
          <p className={styles.note}>
            Não há unidades acessíveis ou ainda não existem dados para o período
            selecionado. Verifique as permissões ou tente mais tarde.
          </p>
        </section>
      )}
    </section>
  );
}
