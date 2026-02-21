/**
 * OperationalShell — Shell que impõe VPC e contexto operacional
 *
 * Regra (OUC): Layout é imposto pelo Core, não escolhido pela tela.
 * O Shell decide: fundo, padding, grid, contraste, modo (dark).
 * O conteúdo filho só entrega UI; não define fundo nem estrutura de página.
 *
 * Ver: docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md
 */
// @ts-nocheck


import type { ReactNode } from "react";
import {
  OperationalContextProvider,
  type OperationalContextValue,
} from "./OperationalContext";

const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 24,
  font: "Inter, system-ui, sans-serif",
  fontSizeBase: 16,
  fontSizeLarge: 20,
} as const;

export interface OperationalShellProps {
  /** Contexto operacional (activeModule, systemMode, role, restaurantId). */
  context: OperationalContextValue;
  /** Conteúdo do painel — não define fundo/layout; só entrega conteúdo. */
  children: ReactNode;
  /** Se true, aplica área de scroll e flex para o painel preencher. */
  fill?: boolean;
  /** Classe CSS opcional. */
  className?: string;
}

/**
 * Envolve o conteúdo operacional com:
 * - VPC (fundo escuro, tipografia, spacing)
 * - Contexto operacional (para painéis consumirem)
 * - Container que impede o conteúdo de "escapar" (sem fundo próprio no root do filho)
 */
export function OperationalShell({
  context,
  children,
  fill = true,
  className,
}: OperationalShellProps) {
  const shellClassName = ["chefiapp-os", className].filter(Boolean).join(" ");

  return (
    <OperationalContextProvider value={context}>
      <div
        data-chefiapp-os="true"
        className={shellClassName}
        style={{
          fontFamily: VPC.font,
          fontSize: VPC.fontSizeBase,
          color: VPC.text,
          backgroundColor: VPC.bg,
          padding: VPC.space,
          borderRadius: VPC.radius,
          border: `1px solid ${VPC.border}`,
          ...(fill
            ? {
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
              }
            : {}),
        }}
      >
        {children}
      </div>
    </OperationalContextProvider>
  );
}
