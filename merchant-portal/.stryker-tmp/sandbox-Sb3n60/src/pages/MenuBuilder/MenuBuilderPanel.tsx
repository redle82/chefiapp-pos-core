/**
 * MenuBuilderPanel — Painel do Menu Builder dentro do OS (Dashboard)
 *
 * Usa PanelRoot (sem fundo, maxWidth, minHeight:100vh).
 * restaurantId vem do contexto operacional; fallback para dev.
 * Ver: docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md
 */

import { PanelRoot, useOperationalContext } from "../../core/operational";
import { MenuBuilderCore } from "./MenuBuilderCore";

const DEFAULT_RESTAURANT_ID = "bbce08c7-63c0-473d-b693-ec2997f73a68";

export function MenuBuilderPanel() {
  const { restaurantId } = useOperationalContext();
  const id = restaurantId ?? DEFAULT_RESTAURANT_ID;

  return (
    <PanelRoot>
      <MenuBuilderCore restaurantId={id} variant="panel" />
    </PanelRoot>
  );
}
