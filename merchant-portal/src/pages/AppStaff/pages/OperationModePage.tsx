/**
 * OperationModePage — Conteúdo da aba Operação por papel (guards internos).
 *
 * Mesma rota para todos; o papel define VISIBILIDADE:
 * - Dono → saúde + alertas + tendências (OwnerDashboard)
 * - Gerente → execução + gargalos (ManagerDashboard)
 * - Staff → status do turno (ManagerDashboard com visão essencial)
 *
 * Ref: reset arquitetura operacional — um app, uma navegação, papel só filtra.
 * UI: scroll é do Shell; sem dashboard/portal; sem duplicar layout.
 */

import { ManagerDashboard } from "../ManagerDashboard";
import { OwnerDashboard } from "../OwnerDashboard";
import { useStaff } from "../context/StaffContext";

export function OperationModePage() {
  const { activeRole } = useStaff();

  // Dono: visão consciência (saúde, alertas, tendências)
  if (activeRole === "owner") {
    return <OwnerDashboard variant="app" />;
  }

  // Gerente e Staff: mesma tela, conteúdo já filtrado por permissões no ManagerDashboard
  return <ManagerDashboard />;
}
