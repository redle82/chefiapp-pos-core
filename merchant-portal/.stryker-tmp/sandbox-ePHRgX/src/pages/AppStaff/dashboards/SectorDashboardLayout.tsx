/**
 * SectorDashboardLayout — Estrutura base dos Dashboards de Setor (nível 2).
 *
 * Dashboard de Setor não executa tarefas.
 * Ele mostra saúde, histórico e exceções daquele setor.
 * Cada dashboard responde UMA pergunta única (exibida no topo).
 *
 * Estrutura fixa:
 *   1. Header do setor + PERGUNTA ÚNICA
 *   2. Status do setor (veredito — 1 semáforo)
 *   3. Resumo do dia
 *   4. Slot livre (histórico, fila, etc.)
 *   5. Exceções / Atenção
 *   6. Ações contextuais (máx. 2, só navegação)
 *
 * Navegação: OwnerHome → Dashboard de Setor → Ferramenta específica
 */
// @ts-nocheck


import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";

export type SectorLevel = "normal" | "attention" | "critical";

interface SectorStatusConfig {
  level: SectorLevel;
  label: string;
}

interface ContextualAction {
  label: string;
  to: string;
}

interface SectorDashboardLayoutProps {
  /** Nome do setor (ex: "LIMPEZA", "COZINHA") */
  sectorName: string;
  /** Pergunta única que esta tela responde (exibida no subtítulo) */
  question: string;
  /** Status do setor — veredito único */
  status: SectorStatusConfig;
  /** Conteúdo do bloco "Resumo do dia" */
  summary: ReactNode;
  /** Conteúdo livre — histórico recente, fila atual, etc. */
  detail?: ReactNode;
  /** Exceções ativas (strings humanas) — se vazio, mostra "Nenhuma exceção ativa" */
  exceptions: string[];
  /** Ações contextuais — máx. 2, só navegam */
  actions?: ContextualAction[];
}

const LEVEL_MAP: Record<
  SectorLevel,
  { icon: string; color: string; bg: string }
> = {
  normal: {
    icon: "🟢",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.10)",
  },
  attention: {
    icon: "🟡",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.10)",
  },
  critical: {
    icon: "🔴",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.10)",
  },
};

export function SectorDashboardLayout({
  sectorName,
  question,
  status,
  summary,
  detail,
  exceptions,
  actions,
}: SectorDashboardLayoutProps) {
  const navigate = useNavigate();
  const vis = LEVEL_MAP[status.level];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: "20px 16px",
        backgroundColor: colors.surface.base,
        gap: 20,
        overflow: "auto",
      }}
    >
      {/* ── 1. HEADER DO SETOR ── */}
      <div>
        <h1
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: colors.text.primary,
            letterSpacing: "0.04em",
          }}
        >
          {sectorName}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: colors.text.secondary,
            margin: "4px 0 0",
            fontStyle: "italic",
          }}
        >
          {question}
        </p>
      </div>

      {/* ── 2. STATUS DO SETOR (veredito — 1 semáforo) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderRadius: 14,
          backgroundColor: vis.bg,
        }}
      >
        <span style={{ fontSize: 28 }}>{vis.icon}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: vis.color,
            letterSpacing: "0.04em",
          }}
        >
          {status.label}
        </span>
      </div>

      {/* ── 3. RESUMO DO DIA ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.text.tertiary,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          HOJE
        </span>
        {summary}
      </div>

      {/* ── 4. SLOT LIVRE (histórico, fila, etc.) ── */}
      {detail}

      {/* ── 5. EXCEÇÕES / ATENÇÃO ── */}
      {exceptions.length > 0 ? (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: colors.text.tertiary,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ⚠️ ATENÇÃO
          </span>
          {exceptions.map((ex) => (
            <span
              key={ex}
              style={{
                fontSize: 14,
                color: colors.text.primary,
                fontWeight: 500,
              }}
            >
              • {ex}
            </span>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            backgroundColor: "rgba(34, 197, 94, 0.06)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>✅</span>
          <span
            style={{
              fontSize: 14,
              color: colors.text.secondary,
              fontWeight: 500,
            }}
          >
            Nenhuma exceção ativa
          </span>
        </div>
      )}

      {/* ── 6. AÇÕES CONTEXTUAIS (máx. 2, só navegação) ── */}
      {actions && actions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 4,
          }}
        >
          {actions.slice(0, 2).map((action) => (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate(action.to)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${colors.border.subtle}`,
                backgroundColor: colors.surface.layer1,
                color: colors.action.text,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Espaço final */}
      <div style={{ flex: 1, minHeight: 16 }} />
    </div>
  );
}
