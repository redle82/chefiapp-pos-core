/**
 * AdminPageHeader — Título e subtítulo de página Admin (Design System §2, §7).
 * Garante contraste alto: título e subtítulo usam tokens --text-primary e --text-secondary.
 */

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
      className="admin-page-header"
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
        <h1 className="admin-page-title" style={{ margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p className="admin-page-desc" style={{ margin: "4px 0 0", maxWidth: "60ch" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
    </header>
  );
}
