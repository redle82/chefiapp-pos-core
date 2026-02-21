/**
 * MadeWithLoveFooter — Rodapé universal ChefIApp.
 *
 * "ChefIApp · made with ❤️ by goldmonkey.studio"
 *
 * Variantes:
 *  - "default"  → barra subtil com fundo escuro (Landing, Blog, Auth, Admin)
 *  - "inline"   → texto inline, sem fundo (sidebar footers, overlays, sheets)
 *  - "floating" → position absolute no bottom (KDS, TPV — ecrãs operacionais fullscreen)
 */

import React from "react";

export type MadeWithLoveVariant = "default" | "inline" | "floating";

interface MadeWithLoveFooterProps {
  variant?: MadeWithLoveVariant;
  className?: string;
}

const baseStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: 12,
  fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  color: "rgba(255,255,255,0.45)",
  letterSpacing: "0.02em",
};

const variantStyles: Record<MadeWithLoveVariant, React.CSSProperties> = {
  default: {
    ...baseStyle,
    padding: "16px 16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.25)",
    flexShrink: 0,
    minHeight: 44,
  },
  inline: {
    ...baseStyle,
    padding: "8px 0",
  },
  floating: {
    ...baseStyle,
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    pointerEvents: "none" as const,
    opacity: 0.6,
  },
};

const linkStyle: React.CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  transition: "color 0.15s",
};

export const MadeWithLoveFooter: React.FC<MadeWithLoveFooterProps> = ({
  variant = "default",
  className,
}) => {
  return (
    <footer
      className={className}
      style={variantStyles[variant]}
      data-testid="made-with-love-footer"
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          verticalAlign: "middle",
        }}
      >
        <img
          src="/logo-chefiapp-clean.png"
          alt="ChefIApp"
          style={{ height: 24, width: "auto", opacity: 0.85 }}
        />
        <span>ChefIApp™ OS</span>
      </span>
      <span> · made with </span>
      <span style={{ color: "#ef4444" }}>❤️</span>
      <span> by </span>
      <a
        href="https://goldmonkey.studio"
        target="_blank"
        rel="noreferrer"
        style={{
          ...linkStyle,
          pointerEvents: variant === "floating" ? "auto" : undefined,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#eab308";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "inherit";
        }}
      >
        goldmonkey.studio
      </a>
    </footer>
  );
};
