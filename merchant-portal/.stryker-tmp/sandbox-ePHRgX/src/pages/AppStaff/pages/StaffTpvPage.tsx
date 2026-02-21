/**
 * StaffTpvPage — Rota /app/staff/mode/tpv.
 * Uses central TPVPOSView — the same POS used at /op/tpv.
 * Accepts tableId (query or state) to preselect table (e.g., coming from WaiterHome).
 * Contract: APPSTAFF_ROLE_HOME_REDESIGN.md
 */
// @ts-nocheck


import { TPVPOSView } from "../../TPVMinimal/TPVPOSView";

export function StaffTpvPage() {
  return <TPVPOSView />;
}
