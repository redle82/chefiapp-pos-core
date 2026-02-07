/**
 * AppStaffRoleHome — Router por papel. Substitui o launcher de modos.
 * Renderiza a home específica do activeRole. Contrato: APPSTAFF_ROLE_HOME_REDESIGN.md
 */

import React from "react";
import { useStaff } from "./context/StaffContext";
import { CleaningHome } from "./homes/CleaningHome";
import { KitchenHome } from "./homes/KitchenHome";
import { ManagerHome } from "./homes/ManagerHome";
import { OwnerHome } from "./homes/OwnerHome";
import { WaiterHome } from "./homes/WaiterHome";

export function AppStaffRoleHome() {
  const { activeRole } = useStaff();

  switch (activeRole) {
    case "owner":
      return <OwnerHome />;
    case "manager":
      return <ManagerHome />;
    case "waiter":
      return <WaiterHome />;
    case "kitchen":
      return <KitchenHome />;
    case "cleaning":
      return <CleaningHome />;
    case "worker":
      return <WaiterHome />;
    default:
      return <ManagerHome />;
  }
}
