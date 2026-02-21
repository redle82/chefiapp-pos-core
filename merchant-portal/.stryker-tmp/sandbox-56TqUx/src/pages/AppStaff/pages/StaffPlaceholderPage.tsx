/**
 * StaffPlaceholderPage — Página placeholder para rotas ainda sem conteúdo.
 */
// @ts-nocheck


import { colors } from "../../../ui/design-system/tokens/colors";

export function StaffPlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: colors.text.primary }}>
        {title}
      </h1>
      <p style={{ fontSize: 14, color: colors.text.tertiary }}>
        Conteúdo em breve.
      </p>
    </div>
  );
}
