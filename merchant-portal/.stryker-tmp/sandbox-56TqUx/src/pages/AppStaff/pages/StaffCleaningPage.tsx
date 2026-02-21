/**
 * StaffCleaningPage — Checklists (limpeza); usa useStaff para tasks e role.
 */
// @ts-nocheck


import { useStaff } from "../context/StaffContext";
import { CleaningTaskView } from "../views/CleaningTaskView";

export function StaffCleaningPage() {
  const { tasks, activeRole } = useStaff();
  return <CleaningTaskView tasks={tasks} role={activeRole} />;
}
