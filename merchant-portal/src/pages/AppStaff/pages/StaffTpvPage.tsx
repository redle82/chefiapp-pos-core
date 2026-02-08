/**
 * StaffTpvPage — Rota /app/staff/mode/tpv. Injeta tasks do StaffContext no MiniPOS.
 * Aceita tableId (query ou state) para preselecionar mesa (ex.: vindo de WaiterHome). Contrato: APPSTAFF_ROLE_HOME_REDESIGN.md
 */

import { useLocation, useSearchParams } from "react-router-dom";
import { MiniPOS } from "../components/MiniPOS";
import { useStaff } from "../context/StaffContext";

export function StaffTpvPage() {
  const { tasks } = useStaff();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tableId =
    searchParams.get("tableId") ?? (location.state as { tableId?: string } | null)?.tableId ?? undefined;

  return <MiniPOS tasks={tasks} initialTableId={tableId ?? null} />;
}
