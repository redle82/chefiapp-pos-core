/**
 * GlobalLoadingView — Estado loading unificado (acordo visual mínimo)
 *
 * Usado por Portal, TPV e KDS para que "loading" pareça o mesmo estado.
 * Alinhado a docs/product/GLOBAL_UI_STATE_MAP.md e DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.
 */

import React from "react";

export type GlobalLoadingLayout = "operational" | "portal";

export interface GlobalLoadingViewProps {
  /** Mensagem (ex.: "A carregar pedidos...", "Carregando Dashboard...") */
  message?: string;
  /** operational = VPC escuro (TPV/KDS); portal = claro */
  layout?: GlobalLoadingLayout;
  /** fullscreen = ocupa viewport; inline = bloco no fluxo */
  variant?: "fullscreen" | "inline";
  style?: React.CSSProperties;
}

const OPERATIONAL = {
  bg: "#0a0a0a",
  text: "#a3a3a3",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 16,
  space: 24,
};

const PORTAL = {
  bg: "#f8f9fa",
  text: "#666",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 16,
  space: 24,
};

export const GlobalLoadingView: React.FC<GlobalLoadingViewProps> = ({
  message = "A carregar...",
  layout = "operational",
  variant = "fullscreen",
  style,
}) => {
  const theme = layout === "operational" ? OPERATIONAL : PORTAL;

  const content = (
    <p
      style={{
        margin: 0,
        color: theme.text,
        fontSize: theme.fontSize,
        opacity: variant === "fullscreen" ? 0.9 : 1,
        animation:
          variant === "fullscreen"
            ? "global-loading-fade 1.2s ease-in-out infinite alternate"
            : undefined,
      }}
    >
      {message}
    </p>
  );

  if (variant === "inline") {
    return (
      <div style={{ padding: theme.space, color: theme.text, ...style }}>
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
        fontSize: theme.fontSize,
        ...style,
      }}
    >
      {content}
      <style>{`
        @keyframes global-loading-fade {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
