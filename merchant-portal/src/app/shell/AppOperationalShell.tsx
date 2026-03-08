import { useEffect } from "react";
import { Routes, useLocation, useNavigate } from "react-router-dom";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { usePWAStaffHomeToTPVRedirect } from "../../core/operational/PWAOpenToTPVRedirect";
import { isReactNativeWebView } from "../../core/operational/platformDetection";
import { OperationalRoutesFragment } from "../../routes/OperationalRoutes";
import { AppOperationalChrome } from "./AppOperationalChrome";
import { AppProviders } from "./AppProviders";
import {
  LAST_ROUTE_KEY,
  getInstalledDesktopOperationalRoute,
  normalizeLastRoute,
  resolveNativeAppStaffRedirect,
  shouldPersistLastRoute,
} from "./appShellRouting";

export function AppOperationalWrapper() {
  return (
    <AppProviders>
      <AppContentWithBilling />
    </AppProviders>
  );
}

function AppContentWithBilling() {
  const { isBillingBlocked, billingStatus, isTrialExpired } =
    useGlobalUIState();
  const location = useLocation();
  const navigate = useNavigate();

  usePWAStaffHomeToTPVRedirect();

  useEffect(() => {
    const nativeRedirect = resolveNativeAppStaffRedirect(
      location.pathname,
      isReactNativeWebView(),
    );
    if (!nativeRedirect) return;

    navigate(nativeRedirect, { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    const normalized = normalizeLastRoute(location.pathname);
    if (!normalized) return;

    const installedDesktopRoute = getInstalledDesktopOperationalRoute(
      typeof window === "undefined" ? null : localStorage,
    );
    if (!shouldPersistLastRoute(normalized, installedDesktopRoute)) {
      return;
    }

    try {
      sessionStorage.setItem(LAST_ROUTE_KEY, normalized);
    } catch {
      // ignore
    }
  }, [location.pathname]);

  return (
    <AppOperationalChrome
      pathname={location.pathname}
      billingStatus={billingStatus}
      isBillingBlocked={isBillingBlocked}
      isTrialExpired={isTrialExpired}
    >
      <Routes>{OperationalRoutesFragment}</Routes>
    </AppOperationalChrome>
  );
}
