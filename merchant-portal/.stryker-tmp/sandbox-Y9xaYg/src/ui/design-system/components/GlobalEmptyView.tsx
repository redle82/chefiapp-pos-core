/**
 * GlobalEmptyView — Estado empty unificado (acordo visual mínimo)
 *
 * "Falta algo, mas é normal." Orienta; CTA claro quando aplicável.
 * Alinhado a docs/product/GLOBAL_UI_STATE_MAP.md e DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.
 */

import React from "react";

export type GlobalEmptyLayout = "operational" | "portal";

export interface GlobalEmptyViewProps {
  /** Título (ex.: "Nenhum pedido ativo", "Ainda não há itens no menu.") */
  title: string;
  /** Descrição opcional */
  description?: string;
  /** operational = VPC escuro; portal = claro */
  layout?: GlobalEmptyLayout;
  /** fullscreen = ocupa viewport; inline = bloco no fluxo */
  variant?: "fullscreen" | "inline";
  /** CTA opcional */
  action?: { label: string; onClick: () => void };
  /** CTA em loading (desativa botão e mostra "A carregar...") */
  actionLoading?: boolean;
  style?: React.CSSProperties;
}

const OPERATIONAL = {
  bg: "#0a0a0a",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 16,
  space: 24,
};

const PORTAL = {
  bg: "#f8f9fa",
  text: "#111827",
  textMuted: "#6b7280",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 16,
  space: 24,
};

export const GlobalEmptyView: React.FC<GlobalEmptyViewProps> = ({
  title,
  description,
  layout = "operational",
  variant = "fullscreen",
  action,
  actionLoading = false,
  style,
}) => {
  const theme = layout === "operational" ? OPERATIONAL : PORTAL;

  const content = (
    <>
      <p style={{ margin: 0, fontWeight: 600, color: theme.text }}>{title}</p>
      {description && (
        <p style={{ margin: "8px 0 0", color: theme.textMuted, fontSize: theme.fontSize }}>
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={actionLoading ? undefined : action.onClick}
          disabled={actionLoading}
          style={{
            marginTop: 16,
            padding: "12px 24px",
            fontSize: theme.fontSize,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#22c55e",
            border: "none",
            borderRadius: 8,
            cursor: actionLoading ? "not-allowed" : "pointer",
            opacity: actionLoading ? 0.7 : 1,
          }}
        >
          {actionLoading ? "A carregar..." : action.label}
        </button>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <div
        style={{
          padding: theme.space,
          textAlign: "center",
          border: `1px solid ${layout === "operational" ? "#262626" : "#e5e7eb"}`,
          borderRadius: 8,
          backgroundColor: layout === "operational" ? "#141414" : "#fff",
          ...style,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.space,
        backgroundColor: theme.bg,
        fontFamily: theme.fontFamily,
        textAlign: "center",
        fontSize: theme.fontSize,
        ...style,
      }}
    >
      {content}
    </div>
  );
};
