/**
 * Abrir TPV/KDS em janela dedicada com nome fixo.
 * Reutiliza a mesma janela ao clicar de novo (comportamento de "app instalado").
 *
 * Usa `popup` + dimensões para que o browser abra uma janela **sem barra de URL**,
 * simulando uma aplicação desktop / PWA. Se o utilizador já instalou a PWA,
 * o browser pode interceptar e abrir a PWA nativa em vez de popup.
 *
 * Ref: MODULES_AND_DEVICES_ANTIREGRESSION.md
 */

export const TPV_WINDOW_NAME = "ChefIApp_TPV";
export const KDS_WINDOW_NAME = "ChefIApp_KDS";

/**
 * Popup features — abre janela sem barra de endereço (experiência app-like).
 * `popup=yes` indica ao browser que queremos uma janela mínima.
 * Dimensões centradas no ecrã.
 */
function getPopupFeatures(width = 1360, height = 900): string {
  const left = Math.max(0, Math.round((screen.width - width) / 2));
  const top = Math.max(0, Math.round((screen.height - height) / 2));
  return `popup=yes,width=${width},height=${height},left=${left},top=${top}`;
}

export function openTpvInNewWindow(searchParams?: string): void {
  if (typeof window === "undefined") return;
  const base = `${window.location.origin}/op/tpv`;
  const url = searchParams ? `${base}?${searchParams}` : base;
  window.open(url, TPV_WINDOW_NAME, getPopupFeatures());
}

export function openKdsInNewWindow(): void {
  if (typeof window === "undefined") return;
  const url = `${window.location.origin}/op/kds`;
  window.open(url, KDS_WINDOW_NAME, getPopupFeatures());
}

export const APPSTAFF_WINDOW_NAME = "ChefIApp_AppStaff";

export function openAppStaffInNewWindow(): void {
  if (typeof window === "undefined") return;
  const url = `${window.location.origin}/app/staff/home`;
  window.open(url, APPSTAFF_WINDOW_NAME, getPopupFeatures());
}

export function openOperationalInNewWindow(
  moduleId: "tpv" | "kds" | "appstaff",
): void {
  if (moduleId === "tpv") openTpvInNewWindow();
  else if (moduleId === "kds") openKdsInNewWindow();
  else openAppStaffInNewWindow();
}
