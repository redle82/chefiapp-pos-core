/**
 * ConfigIdentityPage - Configuração de Identidade
 *
 * Reutiliza IdentitySection em contexto permanente.
 * Visual: Restaurant OS Design System (dark default, tokens do core-design-system).
 */

import { IdentitySection } from "../Onboarding/sections/IdentitySection";
import { RestaurantSetupLayout } from "./RestaurantSetupLayout";

export function ConfigIdentityPage() {
  return (
    <RestaurantSetupLayout
      title="Identidade do Restaurante"
      description="Configure nome, tipo, país e informações básicas do seu restaurante."
    >
      <IdentitySection />
    </RestaurantSetupLayout>
  );
}
