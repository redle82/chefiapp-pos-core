/**
 * HealthDashboardPage — Saúde do Restaurante
 *
 * Mostra health operacional baseado em tarefas críticas/altas abertas.
 * Visual: VPC (escuro, superfície, espaçamento generoso).
 */
// @ts-nocheck


import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useHealthScore } from "../../core/health/useHealthScore";
import {
  GlobalEmptyView,
  GlobalLoadingView,
} from "../../ui/design-system/components";
import styles from "./HealthDashboardPage.module.css";

const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 24,
  spaceLg: 32,
  fontSizeBase: 16,
  fontSizeLarge: 20,
  lineHeight: 1.6,
} as const;

export function HealthDashboardPage() {
  const { runtime } = useRestaurantRuntime();
  const { healthScore, loading } = useHealthScore(runtime.restaurant_id);

  if (loading || runtime.loading || !runtime.restaurant_id) {
    return (
      <GlobalLoadingView
        message="A calcular saúde do restaurante..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  if (!healthScore) {
    return (
      <GlobalEmptyView
        title="Nenhum dado de saúde disponível"
        description="Ainda não há métricas de saúde calculadas para este restaurante."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  const statusVariant =
    healthScore.status === "healthy"
      ? "healthy"
      : healthScore.status === "degraded"
      ? "degraded"
      : "critical";

  const statusLabel =
    healthScore.status === "healthy"
      ? "SAUDÁVEL"
      : healthScore.status === "degraded"
      ? "DEGRADADO"
      : "CRÍTICO";

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Saúde do Restaurante</h1>
        </header>

        {/* Score Geral */}
        <section className={styles.scoreSection}>
          <div className={styles.scoreHeader}>
            <h2 className={styles.sectionTitle}>Score Geral</h2>
            <span className={styles.statusBadge} data-status={statusVariant}>
              ✅ {statusLabel}
            </span>
          </div>
          <div className={styles.scoreValue} data-status={statusVariant}>
            {healthScore.score}
          </div>
          <p className={styles.scoreDescription}>
            Baseado em tarefas críticas e altas abertas
          </p>
        </section>

        {/* Breakdown */}
        <div className={styles.breakdownGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Tarefas Críticas</h3>
            <div
              className={styles.cardValue}
              data-status={healthScore.criticalTasks > 0 ? "error" : "success"}
            >
              {healthScore.criticalTasks}
            </div>
            <p className={styles.cardDescription}>
              Tarefas com prioridade CRÍTICA abertas
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Tarefas Altas</h3>
            <div
              className={styles.cardValue}
              data-status={healthScore.highTasks > 0 ? "warning" : "success"}
            >
              {healthScore.highTasks}
            </div>
            <p className={styles.cardDescription}>
              Tarefas com prioridade ALTA abertas
            </p>
          </div>

          <div className={`${styles.card} ${styles.cardFullWidth}`}>
            <h3 className={styles.cardTitle}>Total de Tarefas Abertas</h3>
            <div className={`${styles.cardValue} ${styles.cardValueNeutral}`}>
              {healthScore.totalOpenTasks}
            </div>
            <p className={styles.cardDescription}>
              Todas as tarefas com status OPEN no sistema
            </p>
          </div>
        </div>

        {/* Loop Operacional */}
        <div className={styles.infoSection}>
          <p className={styles.infoTitle}>🔄 Loop Operacional Ativo</p>
          <p className={styles.infoText}>
            O sistema monitora pedidos e mesas automaticamente. Quando detecta
            eventos (pedidos atrasados, mesas sem atendimento), gera tarefas que
            aparecem aqui e influenciam o score de saúde.
          </p>
        </div>
      </div>
    </div>
  );
}
