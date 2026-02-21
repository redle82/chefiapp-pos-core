/**
 * StaffLauncherPage — Wrapper neutro. Scroll é do Shell. Sem layout próprio.
 * Rota /app/staff/home → AppStaffRoleHome (painel vivo por papel). Contrato: APPSTAFF_ROLE_HOME_REDESIGN.md
 */
// @ts-nocheck


import { AppStaffRoleHome } from "../AppStaffRoleHome";

export function StaffLauncherPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <AppStaffRoleHome />
    </div>
  );
}
