/**
 * StaffHelpPage — Ajuda / Estado do sistema (não técnico).
 */

import { colors } from "../../../ui/design-system/tokens/colors";

export function StaffHelpPage() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: colors.text.primary }}>
        Ajuda
      </h1>
      <div
        style={{
          backgroundColor: colors.surface.layer1,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${colors.border.subtle}`,
          color: colors.text.secondary,
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        <p style={{ marginBottom: 16 }}>
          ChefIApp — Sistema operacional para o seu restaurante. Use o menu à esquerda para navegar
          conforme o seu papel (Gerente, Garçom, Cozinha, etc.).
        </p>
        <p>
          Em caso de problema com o turno ou com o dispositivo, contacte o gerente ou o suporte.
        </p>
      </div>
    </div>
  );
}
