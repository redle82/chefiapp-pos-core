import { useRestaurantId } from "../../../ui/hooks/useRestaurantId";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
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

// NOTE: Dados estáticos apenas para DEMO. Quando as views agregadas
// `vw_revenue_by_restaurant_and_period`, `vw_tasks_by_restaurant_and_severity`,
// `vw_stock_risk_by_restaurant` e `vw_runtime_health_by_restaurant`
// estiverem disponíveis no Core, este array será substituído por dados reais
// vindos de um reader em `core/reports/hooks`.
const MOCK_UNITS: MultiUnitCard[] = [
  {
    id: "restaurante-principal",
    name: "Restaurante Principal",
    tag: "F&B Hotel · Sala principal",
    revenueToday: 1840,
    openOrders: 7,
    criticalTasks: 1,
    criticalStockItems: 2,
    shiftStatus: "OPEN",
    kdsOnline: true,
    tpvOnline: true,
  },
  {
    id: "bar-piscina",
    name: "Bar da Piscina",
    tag: "F&B Hotel · Pool bar",
    revenueToday: 920,
    openOrders: 3,
    criticalTasks: 0,
    criticalStockItems: 0,
    shiftStatus: "OPEN",
    kdsOnline: true,
    tpvOnline: true,
  },
  {
    id: "rooftop",
    name: "Rooftop & Tapas",
    tag: "Restaurante · Turno noite",
    revenueToday: 0,
    openOrders: 0,
    criticalTasks: 0,
    criticalStockItems: 1,
    shiftStatus: "CLOSED",
    kdsOnline: false,
    tpvOnline: false,
  },
];

function formatCurrencyEur(amount: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
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
  const { restaurantId } = useRestaurantId();

  // FUTURO: substituir MOCK_UNITS por hook real, ex. useMultiUnitOverview(restaurantId)
  const units = MOCK_UNITS;

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
            {formatCurrencyEur(totalRevenue)}
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
                    {formatCurrencyEur(unit.revenueToday)}
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

      <section aria-label="Nota">
        <p className={styles.note}>
          Esta vista é um **esqueleto de layout** alinhado com o{" "}
          "MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md". A ligação real às views
          agregadas de Core (faturação, tasks, stock, runtime) deve seguir o
          `QUERY_DISCIPLINE_CONTRACT.md` e será implementada numa iteração
          seguinte.
        </p>
      </section>
    </section>
  );
}
