/**
 * AppModeShell — Shell mínimo por modo. Título + conteúdo; evita tela branca.
 * Contrato: ordem de execução AppStaff — cada rota com placeholder claro.
 */
// @ts-nocheck


import { type ReactNode } from "react";
import { colors } from "../../../ui/design-system/tokens/colors";

export function AppModeShell({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: 16,
        backgroundColor: colors.surface.base,
      }}
    >
      <h1
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 12,
          color: colors.text.primary,
        }}
      >
        {title}
      </h1>
      {children ?? (
        <p style={{ fontSize: 14, color: colors.text.tertiary }}>
          Conteúdo em breve.
        </p>
      )}
    </div>
  );
}
