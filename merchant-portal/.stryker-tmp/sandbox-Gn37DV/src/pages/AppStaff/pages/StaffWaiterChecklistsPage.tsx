/**
 * StaffWaiterChecklistsPage — Checklists (garçom); reutiliza vista de limpeza ou placeholder.
 */

import { useStaff } from "../context/StaffContext";
import { CleaningTaskView } from "../views/CleaningTaskView";

export function StaffWaiterChecklistsPage() {
  const { tasks, activeRole } = useStaff();
  return <CleaningTaskView tasks={tasks} role={activeRole} />;
}
