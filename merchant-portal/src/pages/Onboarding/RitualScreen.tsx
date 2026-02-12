/**
 * RitualScreen — Ceremonial full-screen layout
 *
 * Used for access-denied, onboarding rituals, and other "moment" screens.
 */
import React from "react";

interface RitualAction {
  label: string;
  onClick: () => void;
}

interface RitualScreenProps {
  id: string;
  title: string;
  subtitle?: string;
  primaryAction?: RitualAction;
  secondaryAction?: RitualAction;
  children?: React.ReactNode;
}

export const RitualScreen: React.FC<RitualScreenProps> = ({
  title,
  subtitle,
  primaryAction,
  children,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 32,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 24 }}>
          {subtitle}
        </p>
      )}
      {children}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          style={{
            marginTop: 24,
            padding: "12px 24px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {primaryAction.label}
        </button>
      )}
    </div>
  );
};
