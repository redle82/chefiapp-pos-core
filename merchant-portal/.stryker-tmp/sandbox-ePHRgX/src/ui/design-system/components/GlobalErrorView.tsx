/**
 * GlobalErrorView — Estado error unificado (acordo visual mínimo)
 *
 * "Algo falhou, não é culpa tua." Mensagem neutra; retry ou voltar quando aplicável.
 * Alinhado a docs/product/GLOBAL_UI_STATE_MAP.md e DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.
 */
// @ts-nocheck


import React from "react";

export type GlobalErrorLayout = "operational" | "portal";

export interface GlobalErrorViewProps {
  /** Mensagem já passada por toUserMessage (neutra) */
  message: string;
  /** Título opcional (ex.: "Problema ao carregar") */
  title?: string;
  /** operational = VPC escuro; portal = claro */
  layout?: GlobalErrorLayout;
  /** fullscreen = ocupa viewport; inline = banner no fluxo */
  variant?: "fullscreen" | "inline";
  /** Ação opcional (ex.: retry) */
  action?: { label: string; onClick: () => void };
  style?: React.CSSProperties;
}

const OPERATIONAL = {
  bg: "#0a0a0a",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  errorBg: "#1f1111",
  errorBorder: "#dc2626",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 16,
  space: 24,
};

const PORTAL = {
  bg: "#f8f9fa",
  text: "#111827",
  textMuted: "#6b7280",
  errorBg: "#fee2e2",
  errorBorder: "#dc2626",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 16,
  space: 24,
};

export const GlobalErrorView: React.FC<GlobalErrorViewProps> = ({
  message,
  title = "Problema ao carregar",
  layout = "operational",
  variant = "fullscreen",
  action,
  style,
}) => {
  const theme = layout === "operational" ? OPERATIONAL : PORTAL;

  const content = (
    <>
      <p style={{ margin: 0, fontWeight: 600, color: theme.text }}>{title}</p>
      <p
        style={{
          margin: "8px 0 0",
          color: variant === "fullscreen" ? theme.textMuted : theme.text,
        }}
      >
        {message}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            marginTop: 16,
            padding: "12px 24px",
            fontSize: theme.fontSize,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#22c55e",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <div
        style={{
          padding: 12,
          backgroundColor: theme.errorBg ?? "#fee2e2",
          color: "#dc2626",
          borderRadius: 4,
          marginBottom: 16,
          border: "1px solid #dc2626",
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
