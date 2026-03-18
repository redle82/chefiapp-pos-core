/**
 * TipsAnalyticsPage — Gorjetas e métricas de performance.
 *
 * Secções:
 * 1. Resumo semanal (total, média, contagem)
 * 2. Top performer
 * 3. Gráfico de barras (gorjetas por dia)
 * 4. Leaderboard (ranking de gorjetas)
 * 5. Métricas de performance por colaborador
 */

import { useTipsAnalytics, formatCents, formatMinutes } from "../hooks/useTipsAnalytics";
import styles from "./TipsAnalyticsPage.module.css";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dono",
  manager: "Gerente",
  waiter: "Garçom",
  kitchen: "Cozinha",
  cleaning: "Limpeza",
  worker: "Staff",
};

export function TipsAnalyticsPage() {
  const { weekSummary, dailyChart, metrics, topPerformer } = useTipsAnalytics();

  const maxChartValue = Math.max(...dailyChart.map((d) => d.value), 1);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Gorjetas & Analytics</h2>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total semana</div>
          <div className={styles.summaryValueGreen}>
            {formatCents(weekSummary.total_amount)}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Média</div>
          <div className={styles.summaryValue}>
            {formatCents(weekSummary.average)}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Gorjetas</div>
          <div className={styles.summaryValue}>{weekSummary.count}</div>
        </div>
      </div>

      {/* Top performer */}
      {topPerformer && (
        <div className={styles.topBanner}>
          <div className={styles.topIcon}>🏆</div>
          <div className={styles.topInfo}>
            <div className={styles.topLabel}>Top performer da semana</div>
            <div className={styles.topName}>{topPerformer.employee_name}</div>
            <div className={styles.topStat}>
              {topPerformer.orders_served} pedidos • ⭐{" "}
              {topPerformer.customer_rating.toFixed(1)} •{" "}
              {formatCents(topPerformer.tips_received)} gorjetas
            </div>
          </div>
        </div>
      )}

      {/* Daily chart */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Gorjetas por dia</h3>
        <div className={styles.chartContainer}>
          <div className={styles.barChart}>
            {dailyChart.map((d) => (
              <div key={d.label} className={styles.barCol}>
                <span className={styles.barValue}>
                  {d.value > 0 ? formatCents(d.value) : ""}
                </span>
                <div
                  className={styles.bar}
                  style={{
                    height: `${Math.max((d.value / maxChartValue) * 100, 2)}%`,
                  }}
                />
                <span className={styles.barLabel}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Ranking de gorjetas</h3>
        <div className={styles.leaderboard}>
          {weekSummary.by_employee.map((emp, i) => {
            const rankClass =
              i === 0
                ? styles.leaderRankGold
                : i === 1
                  ? styles.leaderRankSilver
                  : i === 2
                    ? styles.leaderRankBronze
                    : styles.leaderRank;

            return (
              <div key={emp.employee_id} className={styles.leaderRow}>
                <span className={rankClass}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <div className={styles.leaderInfo}>
                  <div className={styles.leaderName}>{emp.employee_name}</div>
                  <div className={styles.leaderRole}>
                    {ROLE_LABELS[emp.employee_role] ?? emp.employee_role}
                  </div>
                </div>
                <span className={styles.leaderAmount}>
                  {formatCents(emp.total)}
                </span>
                <span className={styles.leaderPercent}>{emp.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance metrics */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Performance da equipa</h3>
        {metrics.map((m) => (
          <div key={m.employee_id} style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                marginBottom: 6,
              }}
            >
              {m.employee_name}{" "}
              <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
                ({ROLE_LABELS[m.employee_role] ?? m.employee_role})
              </span>
            </div>
            <div className={styles.perfGrid}>
              <div className={styles.perfCard}>
                <div className={styles.perfLabel}>Pedidos</div>
                <div className={styles.perfValue}>{m.orders_served}</div>
                <div className={styles.perfSub}>esta semana</div>
              </div>
              <div className={styles.perfCard}>
                <div className={styles.perfLabel}>Mesas</div>
                <div className={styles.perfValue}>{m.tables_attended}</div>
                <div className={styles.perfSub}>atendidas</div>
              </div>
              <div className={styles.perfCard}>
                <div className={styles.perfLabel}>Tarefas</div>
                <div className={styles.perfValue}>
                  {m.tasks_completed}/{m.tasks_assigned}
                </div>
                <div className={styles.perfSub}>
                  {Math.round((m.tasks_completed / m.tasks_assigned) * 100)}%
                  concluídas
                </div>
              </div>
              <div className={styles.perfCard}>
                <div className={styles.perfLabel}>Pontualidade</div>
                <div className={styles.perfValue}>{m.punctuality_score}%</div>
                <div className={styles.perfSub}>
                  ⭐ {m.customer_rating.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
