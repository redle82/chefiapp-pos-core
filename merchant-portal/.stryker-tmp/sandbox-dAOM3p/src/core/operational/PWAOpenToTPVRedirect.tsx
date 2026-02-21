/**
 * Quando o app é aberto na raiz ou em PWA (standalone) e o dispositivo está instalado como TPV ou KDS,
 * redireciona para /op/tpv ou /op/kds para mostrar só o ecrã operacional (não a landing nem a web de configuração).
 * Ref: start_url do manifest = /op/tpv; instalações antigas podem abrir em / ou /app/staff/home.
 *
 * EXCEPÇÃO: se o terminal provisionado é APPSTAFF ou WAITER (mobile), NÃO redireciona.
 * Dispositivos móveis devem ficar em /app/staff/home — nunca entrar no TPV.
 */
// @ts-nocheck


import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getInstalledDevice } from "../storage/installedDeviceStorage";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Verifica se o terminal provisionado é mobile (APPSTAFF ou WAITER).
 * Estes terminais devem ficar em /app/staff/home — nunca ser redirecionados ao TPV.
 *
 * Também verifica o user agent: se estamos num dispositivo móvel (iPhone/Android),
 * nunca redirecionar para TPV/KDS — esses módulos são exclusivamente desktop.
 */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Verificar terminal provisionado via InstallPage
  const terminalType = localStorage.getItem("chefiapp_terminal_type");
  if (terminalType === "APPSTAFF" || terminalType === "WAITER") {
    console.log(
      "[PWA-Guard] isMobileDevice=true (terminalType:",
      terminalType,
      ")",
    );
    return true;
  }

  // 2. Fallback: user agent mobile → nunca é TPV/KDS
  const ua = navigator.userAgent;
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  if (isMobileUA) {
    console.log(
      "[PWA-Guard] isMobileDevice=true (UA mobile:",
      ua.slice(0, 60),
      ")",
    );
    return true;
  }

  console.log(
    "[PWA-Guard] isMobileDevice=false (terminalType:",
    terminalType,
    ", UA:",
    ua.slice(0, 60),
    ")",
  );
  return false;
}

const OPERATIONAL_ROUTE: Record<"tpv" | "kds", string> = {
  tpv: "/op/tpv",
  kds: "/op/kds",
};

/** Se aberto na raiz (/) e dispositivo instalado como TPV ou KDS → ir para /op/tpv ou /op/kds (só ecrã operacional). */
export function PWAOpenToTPVRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname !== "/" && pathname !== "/app/staff/home") {
    return <>{children}</>;
  }
  // Dispositivos móveis (APPSTAFF/WAITER ou user agent mobile) nunca vão para TPV/KDS
  if (isMobileDevice()) {
    console.log(
      "[PWA-Guard] PWAOpenToTPVRedirect: mobile device → skipping redirect, staying at",
      pathname,
    );
    return <>{children}</>;
  }

  const device = getInstalledDevice();
  if (!device || (device.module_id !== "tpv" && device.module_id !== "kds")) {
    return <>{children}</>;
  }

  const standalone = isStandalone();
  if (!standalone) {
    console.log(
      "[PWA-Guard] PWAOpenToTPVRedirect: browser mode (not standalone) → skipping redirect, staying at",
      pathname,
    );    return <>{children}</>;
  }

  const to = OPERATIONAL_ROUTE[device.module_id];
  console.log(
    "[PWA-Guard] PWAOpenToTPVRedirect: REDIRECTING from",
    pathname,
    "to",
    to,
  );
  // Raiz: em PWA/standalone, ir para TPV/KDS quando instalado.
  if (pathname === "/") {
    return <Navigate to={to} replace />;
  }
  // /app/staff/home: em PWA (standalone) redirecionar.
  return <Navigate to={to} replace />;
}

/** Efeito: quando em PWA em /app/staff/home e dispositivo é TPV ou KDS, ir para /op/tpv ou /op/kds. */
export function usePWAStaffHomeToTPVRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname !== "/app/staff/home" && pathname !== "/app/staff") return;
    const standalone = isStandalone();
    if (!standalone) return;
    // Dispositivos móveis (APPSTAFF/WAITER ou user agent mobile) nunca vão para TPV/KDS
    if (isMobileDevice()) {
      console.log(
        "[PWA-Guard] usePWAStaffHomeToTPVRedirect: mobile device → skipping redirect",
      );
      return;
    }
    const device = getInstalledDevice();
    if (!device || (device.module_id !== "tpv" && device.module_id !== "kds"))
      return;
    const to = OPERATIONAL_ROUTE[device.module_id];
    console.log("[PWA-Guard] usePWAStaffHomeToTPVRedirect: REDIRECTING to", to);
    navigate(to, { replace: true });
  }, [location.pathname, navigate]);
}
