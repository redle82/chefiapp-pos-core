/**
 * GlobalBlockedView — Estado blocked unificado (acordo visual mínimo)
 *
 * "Há um passo antes." Explica; próximo passo explícito (ex.: publicar, abrir turno).
 * Alinhado a docs/product/GLOBAL_UI_STATE_MAP.md e DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.
 */

import React from "react";
import { Link } from "react-router-dom";

export interface GlobalBlockedViewProps {
  /** Título (ex.: "Sistema não operacional") */
  title: string;
  /** Descrição (ex.: por que está bloqueado e o que fazer) */
  description: string;
  /** CTA: se `to` for definido usa React Router Link; senão usa button com onClick */
  action: { label: string; to?: string; onClick?: () => void };
  style?: React.CSSProperties;
}

const STYLES = {
  bg: "#020617",
  text: "#fff",
  textMuted: "#94a3b8",
  iconBg: "rgba(245, 158, 11, 0.1)",
  iconColor: "#f59e0b",
  buttonBg: "#fff",
  buttonText: "#000",
  buttonHover: "#e2e8f0",
  radius: 12,
  space: 24,
};

export const GlobalBlockedView: React.FC<GlobalBlockedViewProps> = ({
  title,
  description,
  action,
  style,
}) => {
  const cta =
    action.to != null ? (
      <Link
        to={action.to}
        style={{
          padding: "12px 24px",
          backgroundColor: STYLES.buttonBg,
          color: STYLES.buttonText,
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {action.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={action.onClick}
        style={{
          padding: "12px 24px",
          backgroundColor: STYLES.buttonBg,
          color: STYLES.buttonText,
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {action.label}
      </button>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: STYLES.space,
        backgroundColor: STYLES.bg,
        color: STYLES.text,
        textAlign: "center",
        ...style,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          backgroundColor: STYLES.iconBg,
          color: STYLES.iconColor,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: STYLES.space,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={32}
          height={32}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>
        {title}
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth: 448,
          marginBottom: 32,
          color: STYLES.textMuted,
          fontSize: 16,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {cta}
    </div>
  );
};
