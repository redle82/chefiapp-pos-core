/**
 * LiveStatsWidget — Cartão de KPI em tempo real
 *
 * Exibe um indicador operacional numérico com label, valor principal,
 * subtítulo e cor de acento. Mostra skeleton animado enquanto loading=true.
 */

import styles from "./LiveStatsWidget.module.css";

interface LiveStatsWidgetProps {
  label: string;
  value: string | number;
  /** Texto secundário, ex: "+12% vs ontem" */
  sub?: string;
  /** Cor de acento CSS (ex: "#28a745", "var(--color-warning)") */
  color?: string;
  loading?: boolean;
  /** Emoji ou ícone curto a exibir antes do label */
  icon?: string;
}

export function LiveStatsWidget({
  label,
  value,
  sub,
  color = "#667eea",
  loading = false,
  icon,
}: LiveStatsWidgetProps) {
  if (loading) {
    return (
      <div className={styles.card} style={{ borderColor: "#e0e0e0" }}>
        <div
          className={styles.skeleton}
          style={{ width: "60%", height: 12, marginBottom: 8 }}
        />
        <div className={styles.skeleton} style={{ width: "80%", height: 22 }} />
      </div>
    );
  }

  return (
    <div className={styles.card} style={{ borderTopColor: color }}>
      <div className={styles.label}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {label}
      </div>
      <div className={styles.value} style={{ color }}>
        {value}
      </div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}
