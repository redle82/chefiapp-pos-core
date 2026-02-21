/**
 * PanelRoot — Contrato de root para painéis dentro do OS
 *
 * Regra (OUC): Painéis NUNCA definem no root:
 * - minHeight: 100vh
 * - backgroundColor (de página)
 * - maxWidth (container global)
 *
 * PanelRoot aplica apenas padding e spacing consistentes; fundo e layout vêm do Shell.
 * Ver: docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md
 */
// @ts-nocheck


import type { ReactNode } from "react";

const VPC_SPACING = {
  space: 24,
  radius: 8,
} as const;

export interface PanelRootProps {
  children: ReactNode;
  /** Classe CSS opcional. */
  className?: string;
}

/**
 * Wrapper obrigatório para conteúdo de painéis dentro do OperationalShell.
 * Não define fundo, maxWidth nem minHeight:100vh — o Shell impõe o layout.
 */
export function PanelRoot({ children, className }: PanelRootProps) {
  return (
    <div
      className={className}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        padding: VPC_SPACING.space,
        gap: VPC_SPACING.space,
      }}
    >
      {children}
    </div>
  );
}
