/**
 * ConfigIdentityPage - Configuração de Identidade
 *
 * Reutiliza IdentitySection em contexto permanente.
 * Visual: Restaurant OS Design System (dark default, tokens do core-design-system).
 */

import {
  colors,
  space,
  fontSize,
  fontWeight,
  fontFamily,
} from "@chefiapp/core-design-system";
import { IdentitySection } from "../Onboarding/sections/IdentitySection";

export function ConfigIdentityPage() {
  return (
    <div>
      <header style={{ marginBottom: space.lg }}>
        <h1
          style={{
            fontFamily: fontFamily.sans,
            fontSize: `${fontSize.xl}px`,
            fontWeight: fontWeight.bold,
            margin: "0 0 8px 0",
            color: colors.textPrimary,
            letterSpacing: "-0.02em",
          }}
        >
          Identidade do Restaurante
        </h1>
        <p
          style={{
            fontFamily: fontFamily.sans,
            fontSize: `${fontSize.sm}px`,
            color: colors.textSecondary,
            margin: "0 0 8px 0",
          }}
        >
          Configure nome, tipo, país e informações básicas do seu restaurante.
        </p>
        <p
          style={{
            fontFamily: fontFamily.sans,
            fontSize: `${fontSize.sm}px`,
            color: colors.accent,
            margin: 0,
            fontWeight: fontWeight.medium,
          }}
        >
          Preencha o nome e selecione o país. O fuso horário e a moeda
          ajustam-se ao país escolhido. As alterações são guardadas
          automaticamente para o seu restaurante.
        </p>
      </header>

      <IdentitySection />
    </div>
  );
}
