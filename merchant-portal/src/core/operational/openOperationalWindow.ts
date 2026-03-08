/**
 * openOperationalWindow — DEPRECATED (Fase 1 refactor).
 *
 * Estas funções abriam TPV/KDS/AppStaff em popup do browser via window.open().
 * A partir da Fase 1, todos os módulos operacionais são instalados/abertos
 * via o Hub de Dispositivos (/admin/devices) — nunca pop-up.
 *
 * As funções são mantidas como no-ops para não quebrar callers legados.
 * Serão removidas quando todos os callers migrarem.
 *
 * @deprecated Use navigate("/admin/devices") instead.
 */

/** @deprecated No-op. Use navigate("/admin/devices"). */
export function openTpvInNewWindow(_searchParams?: string): void {
  console.warn(
    "[DEPRECATED] openTpvInNewWindow is a no-op. Navigate to /admin/devices instead.",
  );
}

/** @deprecated No-op. Use navigate("/admin/devices"). */
export function openKdsInNewWindow(): void {
  console.warn(
    "[DEPRECATED] openKdsInNewWindow is a no-op. Navigate to /admin/devices instead.",
  );
}

/** @deprecated No-op. Use navigate("/admin/devices"). */
export function openAppStaffInNewWindow(): void {
  console.warn(
    "[DEPRECATED] openAppStaffInNewWindow is a no-op. Navigate to /admin/devices instead.",
  );
}

/** @deprecated No-op. Use navigate("/admin/devices"). */
export function openOperationalInNewWindow(
  _moduleId: "tpv" | "kds" | "appstaff",
): void {
  console.warn(
    "[DEPRECATED] openOperationalInNewWindow is a no-op. Navigate to /admin/devices instead.",
  );
}
