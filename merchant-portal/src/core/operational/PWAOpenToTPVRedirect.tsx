/**
 * Quando o app é aberto na raiz ou em PWA (standalone) e o dispositivo está instalado como TPV ou KDS,
 * redireciona para /op/tpv ou /op/kds para mostrar só o ecrã operacional (não a landing nem a web de configuração).
 * Ref: start_url do manifest = /op/tpv; instalações antigas podem abrir em / ou /app/staff/home.
 */

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
  const device = getInstalledDevice();
  if (!device || (device.module_id !== "tpv" && device.module_id !== "kds")) {
    return <>{children}</>;
  }
  const to = OPERATIONAL_ROUTE[device.module_id];
  // Raiz: sempre ir para TPV/KDS quando instalado (browser ou PWA).
  if (pathname === "/") {
    return <Navigate to={to} replace />;
  }
  // /app/staff/home: só em PWA (standalone) redirecionar.
  if (!isStandalone()) {
    return <>{children}</>;
  }

  return <Navigate to={to} replace />;
}

/** Efeito: quando em PWA em /app/staff/home e dispositivo é TPV ou KDS, ir para /op/tpv ou /op/kds. */
export function usePWAStaffHomeToTPVRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname !== "/app/staff/home" && pathname !== "/app/staff") return;
    if (!isStandalone()) return;
    const device = getInstalledDevice();
    if (!device || (device.module_id !== "tpv" && device.module_id !== "kds"))
      return;
    const to = OPERATIONAL_ROUTE[device.module_id];
    navigate(to, { replace: true });
  }, [location.pathname, navigate]);
}
