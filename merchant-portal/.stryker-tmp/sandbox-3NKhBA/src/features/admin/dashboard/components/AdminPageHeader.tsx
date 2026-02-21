/**
 * AdminPageHeader — Título e subtítulo de página Admin (Design System §2, §7).
 * Garante contraste alto: título e subtítulo usam tokens --text-primary e --text-secondary.
 */
// @ts-nocheck


import type { ReactNode } from "react";

export interface AdminPageHeaderProps {
  /** Título da secção (h1). */
  title: string;
  /** Descrição opcional (subtítulo). */
  subtitle?: string;
  /** Conteúdo extra à direita (ex.: botão "Criar"). */
  actions?: ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header
      style={{
        marginBottom: 24,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--heading-page, var(--text-primary))",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              maxWidth: "60ch",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
    </header>
  );
}
