/**
 * HealthDashboardPage — Saúde do Restaurante
 *
 * Mostra health operacional baseado em tarefas críticas/altas abertas.
 * Visual: VPC (escuro, superfície, espaçamento generoso).
 */

import { GlobalEmptyView, GlobalLoadingView } from "../../ui/design-system/components";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useHealthScore } from "../../core/health/useHealthScore";

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

  const statusColor =
    healthScore.status === "healthy"
      ? VPC.accent
      : healthScore.status === "degraded"
        ? "#eab308"
        : "#f87171";

  const statusLabel =
    healthScore.status === "healthy"
      ? "SAUDÁVEL"
      : healthScore.status === "degraded"
        ? "DEGRADADO"
        : "CRÍTICO";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: VPC.bg,
        fontFamily: "Inter, system-ui, sans-serif",
        color: VPC.text,
        lineHeight: VPC.lineHeight,
        padding: VPC.spaceLg,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: VPC.spaceLg }}>
          <h1
            style={{
              fontSize: VPC.fontSizeLarge,
              fontWeight: 700,
              margin: "0 0 8px 0",
              color: VPC.text,
              letterSpacing: "-0.02em",
            }}
          >
            Saúde do Restaurante
          </h1>
        </header>

        {/* Score Geral */}
        <section
          style={{
            padding: VPC.spaceLg,
            border: `1px solid ${VPC.border}`,
            borderRadius: VPC.radius,
            backgroundColor: VPC.surface,
            marginBottom: VPC.spaceLg,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: VPC.fontSizeBase, fontWeight: 600, color: VPC.text }}>
              Score Geral
            </h2>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: VPC.radius,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                color: statusColor,
                textTransform: "uppercase",
              }}
            >
              ✅ {statusLabel}
            </span>
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: statusColor,
              marginBottom: 8,
            }}
          >
            {healthScore.score}
          </div>
          <p style={{ fontSize: VPC.fontSizeBase, color: VPC.textMuted, margin: 0 }}>
            Baseado em tarefas críticas e altas abertas
          </p>
        </section>

        {/* Breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: VPC.space,
            marginBottom: VPC.spaceLg,
          }}
        >
          <div
            style={{
              padding: VPC.space,
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              backgroundColor: VPC.surface,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: VPC.fontSizeBase, fontWeight: 600, color: VPC.text }}>
              Tarefas Críticas
            </h3>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: healthScore.criticalTasks > 0 ? "#f87171" : VPC.accent,
              }}
            >
              {healthScore.criticalTasks}
            </div>
            <p style={{ marginTop: 8, fontSize: 14, color: VPC.textMuted }}>
              Tarefas com prioridade CRÍTICA abertas
            </p>
          </div>

          <div
            style={{
              padding: VPC.space,
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              backgroundColor: VPC.surface,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: VPC.fontSizeBase, fontWeight: 600, color: VPC.text }}>
              Tarefas Altas
            </h3>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: healthScore.highTasks > 0 ? "#eab308" : VPC.accent,
              }}
            >
              {healthScore.highTasks}
            </div>
            <p style={{ marginTop: 8, fontSize: 14, color: VPC.textMuted }}>
              Tarefas com prioridade ALTA abertas
            </p>
          </div>

          <div
            style={{
              padding: VPC.space,
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              backgroundColor: VPC.surface,
              gridColumn: "span 2",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: VPC.fontSizeBase, fontWeight: 600, color: VPC.text }}>
              Total de Tarefas Abertas
            </h3>
            <div style={{ fontSize: 32, fontWeight: 700, color: VPC.text }}>
              {healthScore.totalOpenTasks}
            </div>
            <p style={{ marginTop: 8, fontSize: 14, color: VPC.textMuted }}>
              Todas as tarefas com status OPEN no sistema
            </p>
          </div>
        </div>

        {/* Loop Operacional */}
        <div
          style={{
            padding: VPC.space,
            backgroundColor: VPC.surface,
            border: `1px solid ${VPC.border}`,
            borderRadius: VPC.radius,
            fontSize: VPC.fontSizeBase,
            color: VPC.textMuted,
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: VPC.text }}>
            🔄 Loop Operacional Ativo
          </p>
          <p style={{ margin: 0 }}>
            O sistema monitora pedidos e mesas automaticamente. Quando detecta
            eventos (pedidos atrasados, mesas sem atendimento), gera tarefas que
            aparecem aqui e influenciam o score de saúde.
          </p>
        </div>
      </div>
    </div>
  );
}
